
import { PrismaClient, CustomerType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue, normalizeHeaderKey, parseTags, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class CustomerImporter extends BaseImporter {
    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string; // Add importBatchId
    }): Promise<ImportResult> {
        const { previewOnly, currentMcNumber, updateExisting, columnMapping, importBatchId } = options;
        const errors: any[] = [];
        const warnings: any[] = [];
        const customersToCreate: any[] = [];
        const customersToUpdate: any[] = [];
        const existingInFile = new Set<string>(); // To catch duplicates WITHIN the file

        // 1. Pre-fetch existing customers for database duplicate checks
        const existingInDb = await this.prisma.customer.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { customerNumber: true, name: true }
        });

        const dbNumberSet = new Set(existingInDb.map(c => c.customerNumber));
        const dbNameSet = new Set(existingInDb.map(c => c.name.toLowerCase().trim()));

        // 2. Process rows
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                let finalName = this.getValue(row, 'name', columnMapping, ['Company name', 'Company Name', 'name', 'customer_name', 'Customer', 'Bill To', 'bill_to', 'Sold To', 'sold_to', 'Company', 'company']);
                const customerNumber = this.getValue(row, 'customerNumber', columnMapping, ['Customer Number', 'customer_number', 'Customer ID', 'customer_id', 'Account #', 'account_number']) || this.getPlaceholder('CUST', rowNum);

                if (!finalName) {
                    finalName = `Unknown Customer (${customerNumber})`;
                    warnings.push(this.warning(rowNum, 'Company name missing, defaulted to placeholder', 'name'));
                }
                const nameLower = finalName.toLowerCase().trim();


                // Check for duplicates WITHIN the file first
                if (existingInFile.has(customerNumber) || existingInFile.has(nameLower)) {
                    warnings.push(this.warning(rowNum, `Duplicate found in file: ${finalName}, skipping row.`, 'Duplicate'));
                    continue;
                }


                // Check for database duplicates
                const existsInDb = dbNumberSet.has(customerNumber) || dbNameSet.has(nameLower);

                if (existsInDb && !updateExisting) {
                    warnings.push(this.warning(rowNum, `Customer already exists in database: ${finalName}, skipping row.`, 'Database Duplicate'));
                    continue;
                }


                existingInFile.add(customerNumber);
                existingInFile.add(nameLower);

                const type = this.mapCustomerType(this.getValue(row, 'type', columnMapping, ['Customer type', 'type']));

                const addressRaw = this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Street']) || '';
                const cityRaw = this.getValue(row, 'city', columnMapping, ['City', 'city']) || '';
                const stateRaw = this.getValue(row, 'state', columnMapping, ['State', 'state']) || '';
                const zipRaw = this.getValue(row, 'zip', columnMapping, ['ZIP', 'zip']) || '';

                // Smart Address Parsing Fallback
                let finalAddress = addressRaw;
                let finalCity = cityRaw;
                let finalState = stateRaw;
                let finalZip = zipRaw;

                if (addressRaw && (!cityRaw || !stateRaw)) {
                    const parsed = parseLocationString(addressRaw);
                    if (parsed) {
                        finalAddress = parsed.address || addressRaw;
                        finalCity = parsed.city || cityRaw;
                        finalState = parsed.state || stateRaw;
                        finalZip = parsed.zip || zipRaw;
                    }
                }

                const customerData: any = {
                    companyId: this.companyId,
                    customerNumber,
                    name: finalName,

                    type,
                    mcNumber: this.getValue(row, 'mcNumber', columnMapping, ['MC Number', 'mc_number']) || currentMcNumber,
                    address: finalAddress,
                    city: finalCity,
                    state: normalizeState(finalState) || finalState,
                    zip: finalZip,
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
                    importBatchId // Add batch ID
                };

                // Warnings for location defaults
                if (!finalAddress) warnings.push(this.warning(rowNum, 'Address missing, defaulted to Unknown', 'address'));
                if (!finalCity) warnings.push(this.warning(rowNum, 'City missing, defaulted to Unknown', 'city'));
                if (!finalState || finalState === 'XX') warnings.push(this.warning(rowNum, 'State missing, defaulted to XX', 'state'));


                if (existsInDb && updateExisting) {
                    customersToUpdate.push(customerData);
                } else {
                    customersToCreate.push(customerData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: customersToCreate.length,
                updated: customersToUpdate.length,
                skipped: errors.length + warnings.length,
                errors: errors.length
            }, customersToCreate.slice(0, 10), errors, warnings);
        }


        // 3. Save to database
        let createdCount = 0;
        let updatedCount = 0;

        if (customersToCreate.length > 0) {
            for (let i = 0; i < customersToCreate.length; i += this.BATCH_SIZE) {
                const batch = customersToCreate.slice(i, i + this.BATCH_SIZE);
                try {
                    await this.prisma.customer.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                    createdCount += batch.length;
                } catch (err: any) {
                    // Failback to individual if batch fails
                    for (const item of batch) {
                        try {
                            await this.prisma.customer.create({ data: item });
                            createdCount++;
                        } catch (e: any) {
                            errors.push(this.error(0, `Create failed for ${item.name}: ${e.message}`));
                        }
                    }
                }
            }
        }

        if (updateExisting && customersToUpdate.length > 0) {
            for (const item of customersToUpdate) {
                try {
                    await this.prisma.customer.updateMany({
                        where: { companyId: this.companyId, name: item.name },
                        data: item
                    });
                    updatedCount++;
                } catch (e: any) {
                    errors.push(this.error(0, `Update failed for ${item.name}: ${e.message}`));
                }
            }
        }

        return this.success({
            total: data.length,
            created: createdCount,
            updated: updatedCount,
            skipped: data.length - createdCount - updatedCount - errors.length,
            errors: errors.length
        }, customersToCreate, errors, warnings);
    }


    private mapCustomerType(value: any): CustomerType {
        if (!value) return CustomerType.DIRECT;
        const v = String(value).toUpperCase().trim();
        if (v.includes('BROKER')) return CustomerType.BROKER;
        if (v.includes('FORWARD')) return CustomerType.FREIGHT_FORWARDER;
        if (v.includes('3PL') || v.includes('THIRD')) return CustomerType.THIRD_PARTY_LOGISTICS;
        return CustomerType.DIRECT;
    }
}
