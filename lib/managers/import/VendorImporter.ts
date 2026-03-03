import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { VENDOR_TYPE_MAP } from './utils/enum-maps';
import { parseAddressFields, getAddressWarnings } from './utils/AddressParsingHelper';

export class VendorImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.vendor; }
    protected useCreateMany() { return true; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const existing = await this.prisma.vendor.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { vendorNumber: true, name: true, id: true }
        });

        return {
            dbNumberSet: new Set(existing.map(v => v.vendorNumber)),
            dbNameSet: new Set(existing.map(v => v.name.toLowerCase().trim())),
            vendorIdMap: new Map(existing.map(v => [v.name.toLowerCase().trim(), v.id])),
            vendorNumberMap: new Map(existing.map(v => [v.vendorNumber, v.id])),
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, importBatchId } = ctx.options;
        const { dbNumberSet, dbNameSet, vendorIdMap, vendorNumberMap } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        let name = this.getValue(row, 'name', columnMapping, ['Vendor name', 'Vendor Name', 'name', 'Vendor']);
        const vendorNumber = this.getValue(row, 'vendorNumber', columnMapping, ['ID', 'id', 'Vendor Number', 'vendor_number']) || this.getPlaceholder('VEND', rowNum);

        if (!name) {
            name = `Unknown Vendor (${vendorNumber})`;
            warnings.push(this.warning(rowNum, 'Vendor name missing, defaulted to placeholder', 'name'));
        }
        const nameLower = name.toLowerCase().trim();

        // File dedup
        if (ctx.existingInFile.has(nameLower) || (vendorNumber && ctx.existingInFile.has(vendorNumber))) {
            return { action: 'skip', error: this.warning(rowNum, `Duplicate found in file: ${name}, skipping row.`, 'Duplicate'), warnings };
        }

        // DB dedup
        const existsInDb = dbNumberSet.has(vendorNumber) || dbNameSet.has(nameLower);
        if (existsInDb && !updateExisting) {
            return { action: 'skip', error: this.warning(rowNum, `Vendor already exists in database: ${name}, skipping row.`, 'Database Duplicate'), warnings };
        }

        ctx.existingInFile.add(nameLower);
        if (vendorNumber) ctx.existingInFile.add(vendorNumber);

        // Address parsing
        const addr = parseAddressFields(
            this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Street']) || '',
            this.getValue(row, 'city', columnMapping, ['City', 'city']) || '',
            this.getValue(row, 'state', columnMapping, ['State', 'state', 'ST']) || '',
            this.getValue(row, 'zip', columnMapping, ['Zip', 'zip', 'Postal Code']) || ''
        );
        warnings.push(...getAddressWarnings(addr, rowNum, this.warning.bind(this)));

        const vendorData: any = {
            companyId: this.companyId,
            vendorNumber,
            name,
            type: SmartEnumMapper.map(this.getValue(row, 'type', columnMapping, ['Type', 'type', 'Category']), VENDOR_TYPE_MAP),
            email: this.getValue(row, 'email', columnMapping, ['Email', 'email']) || '',
            phone: this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'Contact Number']) || '',
            website: this.getValue(row, 'website', columnMapping, ['Website', 'website', 'URL']) || '',
            tag: this.getValue(row, 'tag', columnMapping, ['Tag', 'tag']) || '',
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            importBatchId,
        };

        if (existsInDb && updateExisting) {
            const id = vendorIdMap.get(nameLower) || vendorNumberMap.get(vendorNumber);
            return { action: 'update', data: { ...vendorData, id }, warnings };
        }
        return { action: 'create', data: vendorData, warnings };
    }
}
