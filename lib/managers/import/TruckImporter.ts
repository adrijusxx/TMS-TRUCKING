import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { TRUCK_STATUS_MAP, EQUIPMENT_TYPE_MAP } from './utils/enum-maps';
import { preFetchMcNumbers, resolveMcFromRow } from './utils/McNumberResolver';
import { buildDriverLookupMap } from './utils/DriverLookupHelper';
import { parseImportDate, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class TruckImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.truck; }
    protected useCreateMany() { return false; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const [existing, mcLookup, driverMap] = await Promise.all([
            this.prisma.truck.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { truckNumber: true, vin: true, id: true }
            }),
            preFetchMcNumbers(this.prisma, this.companyId),
            buildDriverLookupMap(this.prisma, this.companyId),
        ]);

        return {
            dbTruckNumberSet: new Set(existing.map(t => t.truckNumber)),
            dbVinSet: new Set(existing.map(t => t.vin || '')),
            truckIdMap: new Map(existing.map(t => [t.truckNumber.toLowerCase().trim(), t.id])),
            vinMap: new Map(existing.map(t => [t.vin?.toLowerCase().trim() || '', t.id])),
            mcLookup,
            driverMap,
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, currentMcNumber, updateExisting, importBatchId, formatSettings } = ctx.options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];
        const { dbTruckNumberSet, dbVinSet, truckIdMap, vinMap, mcLookup, driverMap } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        const truckNumber = this.getValue(row, 'truckNumber', columnMapping, ['Unit number', 'Truck Number', 'truck_number', 'Truck', 'truck', 'Truck ID', 'truck_id', 'Unit #', 'unit_number', 'Unit ID']);
        const vin = this.getValue(row, 'vin', columnMapping, ['VIN', 'vin', 'Serial Number', 'serial_number', 'Serial', 'serial']);

        if (!truckNumber) {
            return { action: 'skip', error: this.error(rowNum, 'Truck number is required', 'Truck Number') };
        }

        // File dedup
        if (ctx.existingInFile.has(truckNumber) || (vin && ctx.existingInFile.has(vin))) {
            return { action: 'skip', error: this.error(rowNum, `Duplicate found in file: ${truckNumber}`, 'Duplicate') };
        }

        // DB dedup
        const existsInDb = dbTruckNumberSet.has(truckNumber) || (vin && dbVinSet.has(vin));
        if (existsInDb && !updateExisting) {
            return { action: 'skip', error: this.error(rowNum, `Truck already exists in database: ${truckNumber}`, 'Database Duplicate') };
        }

        ctx.existingInFile.add(truckNumber);
        if (vin) ctx.existingInFile.add(vin);

        // Enum mapping
        const status = SmartEnumMapper.map(this.getValue(row, 'status', columnMapping, ['Status', 'status']), TRUCK_STATUS_MAP);
        const eqType = SmartEnumMapper.map(this.getValue(row, 'equipmentType', columnMapping, ['Equipment Type', 'equipment_type']), EQUIPMENT_TYPE_MAP);

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
        let finalTruckNumber = truckNumber;
        if (!finalTruckNumber) {
            finalTruckNumber = vin || this.getPlaceholder('TRK', rowNum);
            warnings.push(this.warning(rowNum, `Truck Number missing, defaulted to ${finalTruckNumber}`, 'truckNumber'));
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

        const truckData: any = {
            companyId: this.companyId,
            mcNumberId: resolvedMcId,
            truckNumber: finalTruckNumber,
            vin: finalVin,
            make, model,
            year: parseInt(String(this.getValue(row, 'year', columnMapping, ['Year', 'year', 'Yr', 'yr']) || '0')) || new Date().getFullYear(),
            licensePlate,
            state: stateParsed.state || 'XX',
            equipmentType: eqType,
            status,
            currentDriverId: driverId || undefined,
            registrationExpiry: parseImportDate(this.getValue(row, 'registrationExpiry', columnMapping, ['Registration Expiry', 'registration_expiry']), dateHint) || futureDate,
            insuranceExpiry: parseImportDate(this.getValue(row, 'insuranceExpiry', columnMapping, ['Insurance Expiry', 'insurance_expiry']), dateHint) || futureDate,
            inspectionExpiry: parseImportDate(this.getValue(row, 'inspectionExpiry', columnMapping, ['Inspection Expiry', 'inspection_expiry']), dateHint) || futureDate,
            odometerReading: parseFloat(String(this.getValue(row, 'odometerReading', columnMapping, ['Odometer', 'odometer']) || '0')) || 0,
            capacity: parseFloat(String(this.getValue(row, 'capacity', columnMapping, ['Capacity', 'capacity']) || '45000')) || 45000,
            importBatchId,
        };

        if (existsInDb && updateExisting) {
            const existingId = truckIdMap.get(truckNumber.toLowerCase().trim()) || vinMap.get(vin?.toLowerCase().trim() || '');
            return { action: 'update', data: { ...truckData, id: existingId }, warnings };
        }
        return { action: 'create', data: truckData, warnings };
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
                    return this.prisma.truck.update({ where: { id }, data: dataToUpdate });
                })
            );
            updatedCount = items.length;
        } catch {
            for (const item of items) {
                const { id, ...dataToUpdate } = item;
                try {
                    await this.prisma.truck.update({ where: { id }, data: dataToUpdate });
                    updatedCount++;
                } catch (e: any) {
                    ctx.errors.push(this.error(0, `Update failed for ${item.truckNumber}: ${e.message}`));
                }
            }
        }
        return updatedCount;
    }
}
