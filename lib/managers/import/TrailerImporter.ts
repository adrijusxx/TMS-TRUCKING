import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { TRAILER_TYPE_MAP, TRAILER_STATUS_MAP } from './utils/enum-maps';
import { preFetchMcNumbers, resolveMcFromRow } from './utils/McNumberResolver';
import { buildDriverLookupMap } from './utils/DriverLookupHelper';
import { parseImportDate, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class TrailerImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.trailer; }
    protected useCreateMany() { return false; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const [existing, mcLookup, driverMap] = await Promise.all([
            this.prisma.trailer.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { trailerNumber: true, vin: true, id: true }
            }),
            preFetchMcNumbers(this.prisma, this.companyId),
            buildDriverLookupMap(this.prisma, this.companyId),
        ]);

        return {
            dbTrailerNumberSet: new Set(existing.map(t => t.trailerNumber)),
            dbVinSet: new Set(existing.map(t => t.vin || '')),
            trailerIdMap: new Map(existing.map(t => [t.trailerNumber.toLowerCase().trim(), t.id])),
            mcLookup,
            driverMap,
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, currentMcNumber, updateExisting, importBatchId, formatSettings } = ctx.options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];
        const { dbTrailerNumberSet, dbVinSet, trailerIdMap, mcLookup, driverMap } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        const trailerNumber = this.getValue(row, 'trailerNumber', columnMapping, ['Trailer Number', 'trailer_number', 'unit_number', 'Trailer', 'trailer', 'Trailer ID', 'trailer_id', 'Unit #', 'Unit ID']);
        const vin = this.getValue(row, 'vin', columnMapping, ['VIN', 'vin', 'Serial Number', 'serial_number', 'Serial', 'serial']);

        if (!trailerNumber) {
            return { action: 'skip', error: this.error(rowNum, 'Trailer number is required', 'Trailer Number') };
        }

        // File dedup
        if (ctx.existingInFile.has(trailerNumber) || (vin && ctx.existingInFile.has(vin))) {
            return { action: 'skip', error: this.error(rowNum, `Duplicate found in file: ${trailerNumber}`, 'Duplicate') };
        }

        // DB dedup
        const existsInDb = dbTrailerNumberSet.has(trailerNumber) || (vin && dbVinSet.has(vin));
        if (existsInDb && !updateExisting) {
            return { action: 'skip', error: this.error(rowNum, `Trailer already exists in database: ${trailerNumber}`, 'Database Duplicate') };
        }

        ctx.existingInFile.add(trailerNumber);
        if (vin) ctx.existingInFile.add(vin);

        // Enum mapping
        const trailerType = SmartEnumMapper.map(this.getValue(row, 'trailerType', columnMapping, ['Trailer Type', 'trailer_type', 'type']), TRAILER_TYPE_MAP);
        const status = SmartEnumMapper.map(this.getValue(row, 'status', columnMapping, ['Status', 'status']) || 'AVAILABLE', TRAILER_STATUS_MAP);

        // State parsing
        const stateVal = this.getValue(row, 'state', columnMapping, ['State', 'state', 'Registration State']);
        const stateParsed = parseLocationString(stateVal) || { state: normalizeState(stateVal) || 'TX' };

        // Resolve driver
        const driverVal = String(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'Assigned Driver']) || '').toLowerCase().trim();
        const driverId = driverVal ? (driverMap.get(driverVal) || null) : undefined;

        // Resolve MC number
        const rowMc = this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number']);
        const resolvedMcId = resolveMcFromRow(rowMc, currentMcNumber, mcLookup);

        // Identity fallbacks
        let finalTrailerNumber = trailerNumber;
        if (!finalTrailerNumber) {
            finalTrailerNumber = vin || this.getPlaceholder('TRL', rowNum);
            warnings.push(this.warning(rowNum, `Trailer Number missing, defaulted to ${finalTrailerNumber}`, 'trailerNumber'));
        }

        let finalVin = vin;
        if (!finalVin) {
            finalVin = this.getPlaceholder('VIN', rowNum);
            warnings.push(this.warning(rowNum, 'VIN missing, generated placeholder', 'vin'));
        }

        const futureDate = this.getFutureDate(1);
        const make = this.getValue(row, 'make', columnMapping, ['Make', 'make', 'Manufacturer', 'Brand']) || 'Unknown';
        const model = this.getValue(row, 'model', columnMapping, ['Model', 'model']) || 'Unknown';
        const licensePlate = this.getValue(row, 'licensePlate', columnMapping, ['License Plate', 'license_plate', 'Plate', 'Tag', 'Registration']) || 'UNKNOWN';

        if (make === 'Unknown') warnings.push(this.warning(rowNum, 'Make missing, defaulted to Unknown', 'make'));
        if (model === 'Unknown') warnings.push(this.warning(rowNum, 'Model missing, defaulted to Unknown', 'model'));
        if (licensePlate === 'UNKNOWN') warnings.push(this.warning(rowNum, 'License Plate missing, defaulted to UNKNOWN', 'licensePlate'));

        const trailerData: any = {
            companyId: this.companyId,
            mcNumberId: resolvedMcId,
            trailerNumber: finalTrailerNumber,
            vin: finalVin,
            make, model,
            year: parseInt(String(this.getValue(row, 'year', columnMapping, ['Year', 'year', 'Yr', 'yr']) || '0')) || new Date().getFullYear(),
            licensePlate,
            state: stateParsed.state || 'XX',
            type: trailerType,
            status,
            operatorDriverId: driverId || undefined,
            registrationExpiry: parseImportDate(this.getValue(row, 'registrationExpiry', columnMapping, ['Registration Expiry', 'registration_expiry']), dateHint) || futureDate,
            insuranceExpiry: parseImportDate(this.getValue(row, 'insuranceExpiry', columnMapping, ['Insurance Expiry', 'insurance_expiry']), dateHint) || futureDate,
            inspectionExpiry: parseImportDate(this.getValue(row, 'inspectionExpiry', columnMapping, ['Inspection Expiry', 'inspection_expiry']), dateHint) || futureDate,
            importBatchId,
        };

        if (existsInDb && updateExisting) {
            const existingId = trailerIdMap.get(trailerNumber.toLowerCase().trim()) || trailerIdMap.get(vin?.toLowerCase().trim() || '');
            if (existingId) {
                return { action: 'update', data: { ...trailerData, id: existingId }, warnings };
            }
            return { action: 'skip', error: this.error(rowNum, `Update failed: Could not find ID for existing trailer ${trailerNumber}`, 'Database Error'), warnings };
        }
        return { action: 'create', data: trailerData, warnings };
    }

    /**
     * Updates use transaction batch with individual fallback (preserves current behavior).
     */
    protected async batchUpdate(items: any[], ctx: ImportContext): Promise<number> {
        let updatedCount = 0;
        try {
            await this.prisma.$transaction(
                items.map(item => {
                    const { id, ...dataToUpdate } = item;
                    return this.prisma.trailer.update({ where: { id }, data: dataToUpdate });
                })
            );
            updatedCount = items.length;
        } catch {
            for (const item of items) {
                const { id, ...dataToUpdate } = item;
                try {
                    await this.prisma.trailer.update({ where: { id }, data: dataToUpdate });
                    updatedCount++;
                } catch (e: any) {
                    ctx.errors.push(this.error(0, `Update failed for ${item.trailerNumber}: ${e.message}`));
                }
            }
        }
        return updatedCount;
    }
}
