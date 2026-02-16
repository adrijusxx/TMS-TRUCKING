
import { PrismaClient, TruckStatus, EquipmentType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue, parseImportDate, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class TruckImporter extends BaseImporter {
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
        const trucksToCreate: any[] = [];
        const trucksToUpdate: any[] = [];
        const existingInFile = new Set<string>(); // catch duplicates by truckNumber or VIN

        const [existingInDb, mcNumbers, drivers] = await Promise.all([
            this.prisma.truck.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { truckNumber: true, vin: true, id: true }
            }),
            this.prisma.mcNumber.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { id: true, number: true, isDefault: true, companyName: true }
            }),
            this.prisma.driver.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } }
            })
        ]);

        const dbTruckNumberSet = new Set(existingInDb.map(t => t.truckNumber));
        const dbVinSet = new Set(existingInDb.map(t => t.vin || ''));
        const truckIdMap = new Map(existingInDb.map(t => [t.truckNumber.toLowerCase().trim(), t.id]));
        const vinMap = new Map(existingInDb.map(t => [t.vin?.toLowerCase().trim() || '', t.id]));

        const mcIdMap = new Map<string, string>();
        const defaultMcId = mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id;
        mcNumbers.forEach(mc => {
            if (mc.number) mcIdMap.set(mc.number.trim(), mc.id);
            if (mc.companyName) mcIdMap.set(mc.companyName.trim().toLowerCase(), mc.id);
        });

        const driverMap = new Map<string, string>();
        drivers.forEach(d => {
            driverMap.set(d.driverNumber.toLowerCase().trim(), d.id);
            if (d.user) {
                const fullName = `${d.user.firstName} ${d.user.lastName}`.toLowerCase().trim();
                driverMap.set(fullName, d.id);
                driverMap.set(d.user.lastName.toLowerCase().trim(), d.id);
            }
        });

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                const truckNumber = this.getValue(row, 'truckNumber', columnMapping, ['Unit number', 'Truck Number', 'truck_number']);
                const vin = this.getValue(row, 'vin', columnMapping, ['VIN', 'vin']);

                if (!truckNumber) {
                    errors.push(this.error(rowNum, 'Truck number is required', 'Truck Number'));
                    continue;
                }

                if (existingInFile.has(truckNumber) || (vin && existingInFile.has(vin))) {
                    errors.push(this.error(rowNum, `Duplicate found in file: ${truckNumber}`, 'Duplicate'));
                    continue;
                }

                const existsInDb = dbTruckNumberSet.has(truckNumber) || (vin && dbVinSet.has(vin));

                if (existsInDb && !updateExisting) {
                    errors.push(this.error(rowNum, `Truck already exists in database: ${truckNumber}`, 'Database Duplicate'));
                    continue;
                }

                existingInFile.add(truckNumber);
                if (vin) existingInFile.add(vin);

                // Match Status and Equipment
                const statusStr = this.getValue(row, 'status', columnMapping, ['Status', 'status']);
                const status = await this.mapTruckStatusSmart(statusStr);

                const eqTypeStr = this.getValue(row, 'equipmentType', columnMapping, ['Equipment Type', 'equipment_type']);
                const eqType = await this.mapEquipmentTypeSmart(eqTypeStr);

                // Smart State Parsing
                const stateVal = this.getValue(row, 'state', columnMapping, ['State', 'state', 'Registration State']);
                const stateParsed = parseLocationString(stateVal) || { state: normalizeState(stateVal) || 'TX' };

                // Resolve Driver (Matching only, no auto-create for now to stay safe)
                const driverVal = String(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'Assigned Driver']) || '').toLowerCase().trim();
                const driverId = driverVal ? (driverMap.get(driverVal) || null) : undefined;

                // Resolve MC Number ID using BaseImporter helper
                const rowMc = this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number']);
                const currentMcValue = currentMcNumber?.trim();
                const resolvedMcId = await this.resolveMcNumberId(rowMc || currentMcValue);

                // Zero-Failure: Identity Fallbacks
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

                const truckData: any = {
                    companyId: this.companyId,
                    mcNumberId: resolvedMcId,
                    truckNumber: finalTruckNumber,
                    vin: finalVin,
                    make: this.getValue(row, 'make', columnMapping, ['Make', 'make']) || 'Unknown',
                    model: this.getValue(row, 'model', columnMapping, ['Model', 'model']) || 'Unknown',
                    year: parseInt(String(this.getValue(row, 'year', columnMapping, ['Year', 'year']) || '0')) || new Date().getFullYear(),
                    licensePlate: this.getValue(row, 'licensePlate', columnMapping, ['License Plate', 'license_plate']) || 'UNKNOWN',
                    state: stateParsed.state || 'XX',
                    equipmentType: eqType,
                    status: status,
                    driverId,
                    registrationExpiry: parseImportDate(this.getValue(row, 'registrationExpiry', columnMapping, ['Registration Expiry', 'registration_expiry'])) || futureDate,
                    insuranceExpiry: parseImportDate(this.getValue(row, 'insuranceExpiry', columnMapping, ['Insurance Expiry', 'insurance_expiry'])) || futureDate,
                    inspectionExpiry: parseImportDate(this.getValue(row, 'inspectionExpiry', columnMapping, ['Inspection Expiry', 'inspection_expiry'])) || futureDate,
                    odometerReading: parseFloat(String(this.getValue(row, 'odometerReading', columnMapping, ['Odometer', 'odometer']) || '0')) || 0,
                    capacity: parseFloat(String(this.getValue(row, 'capacity', columnMapping, ['Capacity', 'capacity']) || '45000')) || 45000,
                    importBatchId
                };

                // Warnings for other defaults
                if (truckData.make === 'Unknown') warnings.push(this.warning(rowNum, 'Make missing, defaulted to Unknown', 'make'));
                if (truckData.model === 'Unknown') warnings.push(this.warning(rowNum, 'Model missing, defaulted to Unknown', 'model'));
                if (truckData.licensePlate === 'UNKNOWN') warnings.push(this.warning(rowNum, 'License Plate missing, defaulted to UNKNOWN', 'licensePlate'));


                if (existsInDb && updateExisting) {
                    trucksToUpdate.push({ ...truckData, id: truckIdMap.get(truckNumber) || truckIdMap.get(vin || '') });
                } else {
                    trucksToCreate.push(truckData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: trucksToCreate.length,
                updated: trucksToUpdate.length,
                skipped: errors.length,
                errors: errors.length
            }, trucksToCreate.slice(0, 10), errors, warnings);
        }

        let createdCount = 0;
        let updatedCount = 0;

        if (trucksToCreate.length > 0) {
            try {
                await this.prisma.truck.createMany({ data: trucksToCreate, skipDuplicates: true });
                createdCount = trucksToCreate.length;
            } catch (err: any) {
                for (const item of trucksToCreate) {
                    try {
                        await this.prisma.truck.create({ data: item });
                        createdCount++;
                    } catch (e: any) {
                        errors.push(this.error(0, `Create failed for ${item.truckNumber}: ${e.message}`));
                    }
                }
            }
        }

        if (updateExisting && trucksToUpdate.length > 0) {
            try {
                await this.prisma.$transaction(
                    trucksToUpdate.map(item => {
                        const { id, ...dataToUpdate } = item;
                        return this.prisma.truck.update({
                            where: { id },
                            data: dataToUpdate
                        });
                    })
                );
                updatedCount = trucksToUpdate.length;
            } catch (err: any) {
                // Fallback to individual updates
                for (const item of trucksToUpdate) {
                    const { id, ...dataToUpdate } = item;
                    try {
                        await this.prisma.truck.update({
                            where: { id },
                            data: dataToUpdate
                        });
                        updatedCount++;
                    } catch (e: any) {
                        errors.push(this.error(0, `Update failed for ${item.truckNumber}: ${e.message}`));
                    }
                }
            }
        }

        return this.success({
            total: data.length,
            created: createdCount,
            updated: updatedCount,
            skipped: data.length - createdCount - updatedCount - errors.length,
            errors: errors.length
        }, trucksToCreate, errors, warnings);
    }

    private async mapTruckStatusSmart(value: any): Promise<TruckStatus> {
        if (!value) return TruckStatus.AVAILABLE;
        const v = String(value).toUpperCase().trim();

        // Fast heuristics
        if (v.includes('IN_USE') || v.includes('INUSE') || v.includes('ACTIVE')) return TruckStatus.IN_USE;
        if (v.includes('MAINT') || v.includes('SHOP') || v.includes('REPAIR')) return TruckStatus.MAINTENANCE;
        if (v.includes('OUT') || v.includes('DOWN') || v.includes('SERVICE')) return TruckStatus.OUT_OF_SERVICE;
        if (v.includes('INACTIVE') || v.includes('QUIT')) return TruckStatus.INACTIVE;
        if (v.includes('AVAIL') || v.includes('READY') || v.includes('OK')) return TruckStatus.AVAILABLE;

        // Fallback to AI status mapping if it's very messy
        try {
            const result = await this.aiService.callAI(`Map this truck status to one of: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE. Input: "${value}"`, {
                systemPrompt: "Return ONLY the enum value.",
                jsonMode: false
            });
            const mapped = String(result.data).toUpperCase().trim() as TruckStatus;
            if (Object.values(TruckStatus).includes(mapped)) return mapped;
        } catch (e) {
            console.error('[TruckImporter] AI status mapping failed', e);
        }

        return TruckStatus.AVAILABLE;
    }

    private async mapEquipmentTypeSmart(value: any): Promise<EquipmentType> {
        if (!value) return EquipmentType.DRY_VAN;
        const v = String(value).toUpperCase().trim();

        // Fast heuristics
        if (v.includes('REEFER') || v.includes('REF')) return EquipmentType.REEFER;
        if (v.includes('FLAT') || v.includes('FB')) return EquipmentType.FLATBED;
        if (v.includes('STEP') || v.includes('SD')) return EquipmentType.STEP_DECK;
        if (v.includes('TANK')) return EquipmentType.TANKER;
        if (v.includes('VAN') || v.includes('DRY')) return EquipmentType.DRY_VAN;

        // Fallback to AI
        try {
            const result = await this.aiService.callAI(`Map this equipment type to one of: DRY_VAN, REEFER, FLATBED, STEP_DECK, TANKER. Input: "${value}"`, {
                systemPrompt: "Return ONLY the enum value.",
                jsonMode: false
            });
            const mapped = String(result.data).toUpperCase().trim() as EquipmentType;
            if (Object.values(EquipmentType).includes(mapped)) return mapped;
        } catch (e) {
            console.error('[TruckImporter] AI equipment mapping failed', e);
        }

        return EquipmentType.DRY_VAN;
    }
}
