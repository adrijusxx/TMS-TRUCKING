import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { CUSTOMER_TYPE_MAP } from './utils/enum-maps';
import { parseAddressFields, getAddressWarnings } from './utils/AddressParsingHelper';
import { parseTags } from '@/lib/import-export/import-utils';

export class CustomerImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.customer; }
    protected useCreateMany() { return true; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const existing = await this.prisma.customer.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { customerNumber: true, name: true }
        });

        return {
            dbNumberSet: new Set(existing.map(c => c.customerNumber)),
            dbNameSet: new Set(existing.map(c => c.name.toLowerCase().trim())),
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, currentMcNumber, updateExisting, importBatchId } = ctx.options;
        const { dbNumberSet, dbNameSet } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        let name = this.getValue(row, 'name', columnMapping, ['Company name', 'Company Name', 'name', 'customer_name', 'Customer', 'Bill To', 'bill_to', 'Sold To', 'sold_to', 'Company', 'company']);
        const customerNumber = this.getValue(row, 'customerNumber', columnMapping, ['Customer Number', 'customer_number', 'Customer ID', 'customer_id', 'Account #', 'account_number']) || this.getPlaceholder('CUST', rowNum);

        if (!name) {
            name = `Unknown Customer (${customerNumber})`;
            warnings.push(this.warning(rowNum, 'Company name missing, defaulted to placeholder', 'name'));
        }
        const nameLower = name.toLowerCase().trim();

        // File dedup
        if (ctx.existingInFile.has(customerNumber) || ctx.existingInFile.has(nameLower)) {
            return { action: 'skip', error: this.warning(rowNum, `Duplicate found in file: ${name}, skipping row.`, 'Duplicate'), warnings };
        }

        // DB dedup
        const existsInDb = dbNumberSet.has(customerNumber) || dbNameSet.has(nameLower);
        if (existsInDb && !updateExisting) {
            return { action: 'skip', error: this.warning(rowNum, `Customer already exists in database: ${name}, skipping row.`, 'Database Duplicate'), warnings };
        }

        ctx.existingInFile.add(customerNumber);
        ctx.existingInFile.add(nameLower);

        // Address parsing
        const addr = parseAddressFields(
            this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Street']) || '',
            this.getValue(row, 'city', columnMapping, ['City', 'city']) || '',
            this.getValue(row, 'state', columnMapping, ['State', 'state']) || '',
            this.getValue(row, 'zip', columnMapping, ['ZIP', 'zip']) || ''
        );
        warnings.push(...getAddressWarnings(addr, rowNum, this.warning.bind(this)));

        const customerData: any = {
            companyId: this.companyId,
            customerNumber,
            name,
            type: SmartEnumMapper.map(this.getValue(row, 'type', columnMapping, ['Customer type', 'type']), CUSTOMER_TYPE_MAP),
            mcNumber: this.getValue(row, 'mcNumber', columnMapping, ['MC Number', 'mc_number']) || currentMcNumber,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            phone: this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'Contact Number']) || '',
            email: this.getValue(row, 'email', columnMapping, ['Email', 'email']) || '',
            billingAddress: this.getValue(row, 'billingAddress', columnMapping, ['Billing Address', 'billing_address']),
            billingEmails: this.getValue(row, 'billingEmails', columnMapping, ['Billing emails', 'billing_emails']),
            billingType: this.getValue(row, 'billingType', columnMapping, ['Billing type', 'billing_type']),
            status: this.getValue(row, 'status', columnMapping, ['Status', 'status']),
            legacyTags: parseTags(this.getValue(row, 'tags', columnMapping, ['Tags', 'tags'])),
            warning: this.getValue(row, 'warning', columnMapping, ['Warning', 'warning']),
            creditRate: parseFloat(String(this.getValue(row, 'creditRate', columnMapping, ['Credit rate', 'credit_rate']) || '0')) || null,
            riskLevel: this.getValue(row, 'riskLevel', columnMapping, ['Risk level', 'risk_level']),
            comments: this.getValue(row, 'comments', columnMapping, ['Comments', 'comments']),
            importBatchId,
        };

        if (existsInDb && updateExisting) {
            return { action: 'update', data: customerData, warnings };
        }
        return { action: 'create', data: customerData, warnings };
    }

    /**
     * Customer updates use updateMany by name (preserves current behavior).
     */
    protected async batchUpdate(items: any[], ctx: ImportContext): Promise<number> {
        let updatedCount = 0;
        for (const item of items) {
            try {
                await this.prisma.customer.updateMany({
                    where: { companyId: this.companyId, name: item.name },
                    data: item
                });
                updatedCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Update failed for ${item.name}: ${e.message}`));
            }
        }
        return updatedCount;
    }
}
