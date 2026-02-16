
import { PrismaClient, EquipmentType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue, parseImportDate, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class TrailerImporter extends BaseImporter {
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
        const trailersToCreate: any[] = [];
        const trailersToUpdate: any[] = [];
        const existingInFile = new Set<string>();

        // Pre-fetch existing, MCs, and Drivers
        const [existingInDb, mcNumbers, drivers] = await Promise.all([
            this.prisma.trailer.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { trailerNumber: true, vin: true, id: true }
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

        const dbTrailerNumberSet = new Set(existingInDb.map(t => t.trailerNumber));
        const dbVinSet = new Set(existingInDb.map(t => t.vin || ''));
        const trailerIdMap = new Map(existingInDb.map(t => [t.trailerNumber.toLowerCase().trim(), t.id]));

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
                const trailerNumber = this.getValue(row, 'trailerNumber', columnMapping, ['Trailer Number', 'trailer_number', 'unit_number', 'Trailer', 'trailer', 'Trailer ID', 'trailer_id', 'Unit #', 'Unit ID']);
                const vin = this.getValue(row, 'vin', columnMapping, ['VIN', 'vin', 'Serial Number', 'serial_number', 'Serial', 'serial']);

                if (!trailerNumber) {
                    errors.push(this.error(rowNum, 'Trailer number is required', 'Trailer Number'));
                    continue;
                }

                if (existingInFile.has(trailerNumber) || (vin && existingInFile.has(vin))) {
                    errors.push(this.error(rowNum, `Duplicate found in file: ${trailerNumber}`, 'Duplicate'));
                    continue;
                }

                const existsInDb = dbTrailerNumberSet.has(trailerNumber) || (vin && dbVinSet.has(vin));

                if (existsInDb && !updateExisting) {
                    errors.push(this.error(rowNum, `Trailer already exists in database: ${trailerNumber}`, 'Database Duplicate'));
                    continue;
                }

                existingInFile.add(trailerNumber);
                if (vin) existingInFile.add(vin);

                const trailerTypeStr = this.getValue(row, 'trailerType', columnMapping, ['Trailer Type', 'trailer_type', 'type']);
                const trailerType = await this.mapTrailerTypeSmart(trailerTypeStr);

                const statusStr = this.getValue(row, 'status', columnMapping, ['Status', 'status']) || 'AVAILABLE';
                const status = await this.mapTrailerStatusSmart(statusStr);

                // Smart State Parsing
                const stateVal = this.getValue(row, 'state', columnMapping, ['State', 'state', 'Registration State']);
                const stateParsed = parseLocationString(stateVal) || { state: normalizeState(stateVal) || 'TX' };

                // Resolve Driver (Matching only)
                const driverVal = String(this.getValue(row, 'driverId', columnMapping, ['Driver', 'driver', 'Assigned Driver']) || '').toLowerCase().trim();
                const driverId = driverVal ? (driverMap.get(driverVal) || null) : undefined;

                // Resolve MC Number ID using BaseImporter helper
                const rowMc = this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number']);
                const currentMcValue = currentMcNumber?.trim();
                const resolvedMcId = await this.resolveMcNumberId(rowMc || currentMcValue);

                // Zero-Failure: Identity Fallbacks
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

                const trailerData: any = {
                    companyId: this.companyId,
                    mcNumberId: resolvedMcId,
                    trailerNumber: finalTrailerNumber,
                    vin: finalVin,
                    make: this.getValue(row, 'make', columnMapping, ['Make', 'make', 'Manufacturer', 'Brand']) || 'Unknown',
                    model: this.getValue(row, 'model', columnMapping, ['Model', 'model']) || 'Unknown',
                    year: parseInt(String(this.getValue(row, 'year', columnMapping, ['Year', 'year', 'Yr', 'yr']) || '0')) || new Date().getFullYear(),
                    licensePlate: this.getValue(row, 'licensePlate', columnMapping, ['License Plate', 'license_plate', 'Plate', 'Tag', 'Registration']) || 'UNKNOWN',
                    state: stateParsed.state || 'XX',
                    type: trailerType,
                    status: status,
                    driverId,
                    registrationExpiry: parseImportDate(this.getValue(row, 'registrationExpiry', columnMapping, ['Registration Expiry', 'registration_expiry'])) || futureDate,
                    insuranceExpiry: parseImportDate(this.getValue(row, 'insuranceExpiry', columnMapping, ['Insurance Expiry', 'insurance_expiry'])) || futureDate,
                    inspectionExpiry: parseImportDate(this.getValue(row, 'inspectionExpiry', columnMapping, ['Inspection Expiry', 'inspection_expiry'])) || futureDate,
                    importBatchId
                };

                // Warnings for other defaults
                if (trailerData.make === 'Unknown') warnings.push(this.warning(rowNum, 'Make missing, defaulted to Unknown', 'make'));
                if (trailerData.model === 'Unknown') warnings.push(this.warning(rowNum, 'Model missing, defaulted to Unknown', 'model'));
                if (trailerData.licensePlate === 'UNKNOWN') warnings.push(this.warning(rowNum, 'License Plate missing, defaulted to UNKNOWN', 'licensePlate'));


                if (existsInDb && updateExisting) {
                    // FIX: Use lowercased key for lookup to ensure we find the ID
                    const existingId = trailerIdMap.get(trailerNumber.toLowerCase().trim()) || trailerIdMap.get(vin?.toLowerCase().trim() || '');
                    if (existingId) {
                        trailersToUpdate.push({ ...trailerData, id: existingId });
                    } else {
                        // Logic fallback: If we thought it existed but can't find ID, warn and skip/create?
                        // For safety, let's treat as create effectively or log error
                        errors.push(this.error(rowNum, `Update failed: Could not find ID for existing trailer ${trailerNumber}`, 'Database Error'));
                    }
                } else {
                    trailersToCreate.push(trailerData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: trailersToCreate.length,
                updated: trailersToUpdate.length,
                skipped: errors.length,
                errors: errors.length
            }, trailersToCreate.slice(0, 10), errors, warnings);
        }

        let createdCount = 0;
        let updatedCount = 0;

        if (trailersToCreate.length > 0) {
            try {
                await this.prisma.trailer.createMany({ data: trailersToCreate, skipDuplicates: true });
                createdCount = trailersToCreate.length;
            } catch (err: any) {
                for (const item of trailersToCreate) {
                    try {
                        await this.prisma.trailer.create({ data: item });
                        createdCount++;
                    } catch (e: any) {
                        errors.push(this.error(0, `Create failed for ${item.trailerNumber}: ${e.message}`));
                    }
                }
            }
        }

        if (updateExisting && trailersToUpdate.length > 0) {
            try {
                await this.prisma.$transaction(
                    trailersToUpdate.map(item => {
                        const { id, ...dataToUpdate } = item;
                        return this.prisma.trailer.update({
                            where: { id },
                            data: dataToUpdate
                        });
                    })
                );
                updatedCount = trailersToUpdate.length;
            } catch (err: any) {
                // Fallback to individual updates
                for (const item of trailersToUpdate) {
                    const { id, ...dataToUpdate } = item;
                    try {
                        await this.prisma.trailer.update({
                            where: { id },
                            data: dataToUpdate
                        });
                        updatedCount++;
                    } catch (e: any) {
                        errors.push(this.error(0, `Update failed for ${item.trailerNumber}: ${e.message}`));
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
        }, trailersToCreate, errors, warnings);
    }

    private async mapTrailerTypeSmart(value: any): Promise<EquipmentType> {
        if (!value) return EquipmentType.DRY_VAN;
        const v = String(value).toUpperCase().trim();

        // Fast heuristics
        if (v.includes('REEFER') || v.includes('REF')) return EquipmentType.REEFER;
        if (v.includes('FLAT') || v.includes('FB')) return EquipmentType.FLATBED;
        if (v.includes('TANK')) return EquipmentType.TANKER;
        if (v.includes('VAN') || v.includes('DRY')) return EquipmentType.DRY_VAN;

        // Fallback to AI
        try {
            const result = await this.aiService.callAI(`Map this trailer type to one of: DRY_VAN, REEFER, FLATBED, TANKER. Input: "${value}"`, {
                systemPrompt: "Return ONLY the enum value as a plain string, no JSON, no markdown.",
                jsonMode: false,
                temperature: 0
            });
            const mapped = String(result.data).replace(/['"`]/g, '').toUpperCase().trim() as EquipmentType;
            if (Object.values(EquipmentType).includes(mapped)) return mapped;
        } catch (e) {
            console.error('[TrailerImporter] AI type mapping failed', e);
        }

        return EquipmentType.DRY_VAN;
    }

    private async mapTrailerStatusSmart(value: any): Promise<string> {
        if (!value) return 'AVAILABLE';
        const v = String(value).toUpperCase().trim();
        if (v.includes('IN_USE') || v.includes('INUSE') || v.includes('ACTIVE')) return 'IN_USE';
        if (v.includes('MAINT') || v.includes('SHOP')) return 'MAINTENANCE';
        if (v.includes('OUT') || v.includes('SERVICE')) return 'OUT_OF_SERVICE';
        return 'AVAILABLE';
    }
}
