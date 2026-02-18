
import { PrismaClient, LocationType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class LocationImporter extends BaseImporter {
    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string; // Add importBatchId
    }): Promise<ImportResult> {
        const { previewOnly, updateExisting, columnMapping, importBatchId } = options;
        const errors: any[] = [];
        const warnings: any[] = [];
        const locationsToCreate: any[] = [];
        const locationsToUpdate: any[] = [];
        const existingInFile = new Set<string>();

        // Pre-fetch
        const existingInDb = await this.prisma.location.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { name: true, address: true, city: true, state: true, id: true }
        });

        const getLocKey = (l: { name: string, address: string | null, city: string | null, state: string | null }) =>
            `${l.name.toLowerCase().trim()}|${(l.address || '').toLowerCase().trim()}|${(l.city || '').toLowerCase().trim()}|${(l.state || '').toLowerCase().trim()}`;

        const dbLocSet = new Set(existingInDb.map(getLocKey));
        const locIdMap = new Map(existingInDb.map(l => [getLocKey(l), l.id]));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                const name = this.getValue(row, 'name', columnMapping, ['Place name', 'Place Name', 'name', 'Location']);
                const addressRaw = this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Street']) || '';
                const cityRaw = this.getValue(row, 'city', columnMapping, ['City', 'city']) || '';
                const stateRaw = this.getValue(row, 'state', columnMapping, ['State', 'state', 'ST']) || '';

                let finalName = name;
                if (!finalName) {
                    finalName = addressRaw || this.getPlaceholder('LOC', rowNum);
                    warnings.push(this.warning(rowNum, `Location name missing, defaulted to ${finalName}`, 'name'));
                }


                // --- Smart Address Parsing ---
                let finalAddress = addressRaw;
                let finalCity = cityRaw;
                let finalState = stateRaw;
                let finalZip = this.getValue(row, 'zip', columnMapping, ['ZIP', 'zip', 'Postal Code']) || '';

                if (addressRaw && (!cityRaw || !stateRaw)) {
                    const parsed = parseLocationString(addressRaw);
                    if (parsed) {
                        if (parsed.address) finalAddress = parsed.address;
                        if (!finalCity) finalCity = parsed.city;
                        if (!finalState) finalState = parsed.state;
                        if (!finalZip && parsed.zip) finalZip = parsed.zip;
                    }
                }

                const locKey = getLocKey({ name: finalName, address: finalAddress, city: finalCity, state: finalState });


                if (existingInFile.has(locKey)) {
                    errors.push(this.error(rowNum, `Duplicate found in file: ${name} at ${finalAddress}`, 'Duplicate'));
                    continue;
                }

                const existsInDb = dbLocSet.has(locKey);

                if (existsInDb && !updateExisting) {
                    errors.push(this.error(rowNum, `Location already exists in database: ${name} at ${finalAddress}`, 'Database Duplicate'));
                    continue;
                }

                existingInFile.add(locKey);

                // --- Smart Type Mapping ---
                const typeStr = this.getValue(row, 'type', columnMapping, ['Type', 'Location Type', 'type', 'Category']);
                const type = this.mapLocationTypeSmart(typeStr || name);

                const locationData: any = {
                    companyId: this.companyId,
                    locationNumber: this.getValue(row, 'locationNumber', columnMapping, ['ID', 'id', 'Location Number']) || this.getPlaceholder('LOC', rowNum),
                    name: finalName,

                    locationCompany: this.getValue(row, 'locationCompany', columnMapping, ['Company', 'location_company']) || '',
                    address: finalAddress,
                    city: finalCity,
                    state: normalizeState(finalState) || finalState,
                    zip: String(finalZip || ''),
                    contactName: this.getValue(row, 'contactName', columnMapping, ['Contact name', 'contact_name', 'Contact']) || '',
                    contactPhone: this.getValue(row, 'contactPhone', columnMapping, ['Phone', 'phone', 'Contact Phone']) || '',
                    type,
                    notes: this.getValue(row, 'notes', columnMapping, ['Notes', 'notes', 'Instructions']) || '',
                    importBatchId // Add batch ID
                };

                // Warnings for other defaults
                if (!finalAddress) warnings.push(this.warning(rowNum, 'Address missing, defaulted to Unknown', 'address'));
                if (!finalCity) warnings.push(this.warning(rowNum, 'City missing, defaulted to Unknown', 'city'));
                if (!finalState || finalState === 'XX') warnings.push(this.warning(rowNum, 'State missing, defaulted to XX', 'state'));


                if (existsInDb && updateExisting) {
                    locationData.id = locIdMap.get(locKey);
                    locationsToUpdate.push(locationData);
                } else {
                    locationsToCreate.push(locationData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: locationsToCreate.length,
                updated: locationsToUpdate.length,
                skipped: errors.length + warnings.length,
                errors: errors.length
            }, locationsToCreate.slice(0, 10), errors, warnings);
        }


        let createdCount = 0;
        let updatedCount = 0;

        if (locationsToCreate.length > 0) {
            try {
                await this.prisma.location.createMany({ data: locationsToCreate, skipDuplicates: true });
                createdCount = locationsToCreate.length;
            } catch (err: any) {
                for (const item of locationsToCreate) {
                    try {
                        await this.prisma.location.create({ data: item });
                        createdCount++;
                    } catch (e: any) {
                        errors.push(this.error(0, `Create failed for ${item.name}: ${e.message}`));
                    }
                }
            }
        }

        if (updateExisting && locationsToUpdate.length > 0) {
            for (const item of locationsToUpdate) {
                const { id, ...dataToUpdate } = item;
                if (!id) continue;
                try {
                    await this.prisma.location.update({
                        where: { id },
                        data: dataToUpdate
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
        }, locationsToCreate, errors, warnings);
    }


    private mapLocationTypeSmart(val: any): LocationType {
        if (!val) return LocationType.PICKUP;
        const v = String(val).toUpperCase();

        if (v.includes('PICKUP') || v.includes('SHIPPER')) return LocationType.PICKUP;
        if (v.includes('DELIVER') || v.includes('RECEIVER') || v.includes('CONSIGNEE')) return LocationType.DELIVERY;
        if (v.includes('WAREHOUSE') || v.includes('WHSE') || v.includes('STORAGE')) return LocationType.WAREHOUSE;
        if (v.includes('TERMINAL') || v.includes('YARD') || v.includes('LOT')) return LocationType.TERMINAL;
        if (v.includes('CUSTOMER')) return LocationType.CUSTOMER;
        if (v.includes('VENDOR')) return LocationType.VENDOR;
        if (v.includes('REPAIR') || v.includes('SHOP') || v.includes('SERVICE')) return LocationType.REPAIR_SHOP;
        if (v.includes('FUEL') || v.includes('TRUCKSTOP') || v.includes('DAT')) return LocationType.FUEL_STOP;
        if (v.includes('SCALE')) return LocationType.SCALE;

        return LocationType.PICKUP;
    }
}
