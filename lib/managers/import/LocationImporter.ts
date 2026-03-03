import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { LOCATION_TYPE_MAP } from './utils/enum-maps';
import { parseAddressFields, getAddressWarnings } from './utils/AddressParsingHelper';
import { normalizeState } from '@/lib/utils/state-utils';

function getLocKey(l: { name: string; address: string; city: string; state: string }) {
    return `${l.name.toLowerCase().trim()}|${(l.address || '').toLowerCase().trim()}|${(l.city || '').toLowerCase().trim()}|${(l.state || '').toLowerCase().trim()}`;
}

export class LocationImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.location; }
    protected useCreateMany() { return true; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const existing = await this.prisma.location.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { name: true, address: true, city: true, state: true, id: true }
        });

        return {
            dbLocSet: new Set(existing.map(getLocKey)),
            locIdMap: new Map(existing.map(l => [getLocKey(l), l.id])),
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, importBatchId } = ctx.options;
        const { dbLocSet, locIdMap } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        const nameRaw = this.getValue(row, 'name', columnMapping, ['Place name', 'Place Name', 'name', 'Location']);
        const addressRaw = this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Street']) || '';

        let name = nameRaw;
        if (!name) {
            name = addressRaw || this.getPlaceholder('LOC', rowNum);
            warnings.push(this.warning(rowNum, `Location name missing, defaulted to ${name}`, 'name'));
        }

        // Address parsing
        const addr = parseAddressFields(
            addressRaw,
            this.getValue(row, 'city', columnMapping, ['City', 'city']) || '',
            this.getValue(row, 'state', columnMapping, ['State', 'state', 'ST']) || '',
            this.getValue(row, 'zip', columnMapping, ['ZIP', 'zip', 'Postal Code']) || ''
        );
        warnings.push(...getAddressWarnings(addr, rowNum, this.warning.bind(this)));

        const locKey = getLocKey({ name, address: addr.address, city: addr.city, state: addr.state });

        // File dedup (composite key)
        if (ctx.existingInFile.has(locKey)) {
            return { action: 'skip', error: this.error(rowNum, `Duplicate found in file: ${nameRaw} at ${addr.address}`, 'Duplicate') };
        }

        // DB dedup
        const existsInDb = dbLocSet.has(locKey);
        if (existsInDb && !updateExisting) {
            return { action: 'skip', error: this.error(rowNum, `Location already exists in database: ${nameRaw} at ${addr.address}`, 'Database Duplicate') };
        }

        ctx.existingInFile.add(locKey);

        const typeStr = this.getValue(row, 'type', columnMapping, ['Type', 'Location Type', 'type', 'Category']);
        const type = SmartEnumMapper.map(typeStr || name, LOCATION_TYPE_MAP);

        const locationData: any = {
            companyId: this.companyId,
            locationNumber: this.getValue(row, 'locationNumber', columnMapping, ['ID', 'id', 'Location Number']) || this.getPlaceholder('LOC', rowNum),
            name,
            locationCompany: this.getValue(row, 'locationCompany', columnMapping, ['Company', 'location_company']) || '',
            address: addr.address,
            city: addr.city,
            state: normalizeState(addr.state) || addr.state,
            zip: addr.zip,
            contactName: this.getValue(row, 'contactName', columnMapping, ['Contact name', 'contact_name', 'Contact']) || '',
            contactPhone: this.getValue(row, 'contactPhone', columnMapping, ['Phone', 'phone', 'Contact Phone']) || '',
            type,
            notes: this.getValue(row, 'notes', columnMapping, ['Notes', 'notes', 'Instructions']) || '',
            importBatchId,
        };

        if (existsInDb && updateExisting) {
            locationData.id = locIdMap.get(locKey);
            return { action: 'update', data: locationData, warnings };
        }
        return { action: 'create', data: locationData, warnings };
    }
}
