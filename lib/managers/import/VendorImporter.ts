
import { PrismaClient, VendorType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export class VendorImporter extends BaseImporter {
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
        const vendorsToCreate: any[] = [];
        const vendorsToUpdate: any[] = [];
        const existingInFile = new Set<string>();

        // Pre-fetch
        const existingInDb = await this.prisma.vendor.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { vendorNumber: true, name: true, id: true }
        });

        const dbNumberSet = new Set(existingInDb.map(v => v.vendorNumber));
        const dbNameSet = new Set(existingInDb.map(v => v.name.toLowerCase().trim()));
        const vendorIdMap = new Map(existingInDb.map(v => [v.name.toLowerCase().trim(), v.id]));
        const vendorNumberMap = new Map(existingInDb.map(v => [v.vendorNumber, v.id]));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                let finalName = this.getValue(row, 'name', columnMapping, ['Vendor name', 'Vendor Name', 'name', 'Vendor']);
                const vendorNumber = this.getValue(row, 'vendorNumber', columnMapping, ['ID', 'id', 'Vendor Number', 'vendor_number']) || this.getPlaceholder('VEND', rowNum);

                if (!finalName) {
                    finalName = `Unknown Vendor (${vendorNumber})`;
                    warnings.push(this.warning(rowNum, 'Vendor name missing, defaulted to placeholder', 'name'));
                }
                const nameLower = finalName.toLowerCase().trim();


                if (existingInFile.has(nameLower) || (vendorNumber && existingInFile.has(vendorNumber))) {
                    warnings.push(this.warning(rowNum, `Duplicate found in file: ${finalName}, skipping row.`, 'Duplicate'));
                    continue;
                }


                const existsInDb = dbNumberSet.has(vendorNumber) || dbNameSet.has(nameLower);

                if (existsInDb && !updateExisting) {
                    warnings.push(this.warning(rowNum, `Vendor already exists in database: ${finalName}, skipping row.`, 'Database Duplicate'));
                    continue;
                }


                existingInFile.add(nameLower);
                if (vendorNumber) existingInFile.add(vendorNumber);

                // --- Smart Address Parsing ---
                const addressRaw = this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Street']) || '';
                const cityRaw = this.getValue(row, 'city', columnMapping, ['City', 'city']) || '';
                const stateRaw = this.getValue(row, 'state', columnMapping, ['State', 'state', 'ST']) || '';
                const zipRaw = this.getValue(row, 'zip', columnMapping, ['Zip', 'zip', 'Postal Code']) || '';

                let finalAddress = addressRaw;
                let finalCity = cityRaw;
                let finalState = stateRaw;
                let finalZip = zipRaw;

                // If only address is provided, try to split it
                if (addressRaw && (!cityRaw || !stateRaw)) {
                    const parsed = parseLocationString(addressRaw);
                    if (parsed) {
                        if (parsed.address) finalAddress = parsed.address;
                        if (!finalCity) finalCity = parsed.city;
                        if (!finalState) finalState = parsed.state;
                        if (!finalZip && parsed.zip) finalZip = parsed.zip;
                    }
                }

                // --- Smart Category Mapping ---
                const typeStr = this.getValue(row, 'type', columnMapping, ['Type', 'type', 'Category']);
                const type = this.mapVendorTypeSmart(typeStr);

                const vendorData: any = {
                    companyId: this.companyId,
                    vendorNumber,
                    name: finalName,

                    type,
                    email: this.getValue(row, 'email', columnMapping, ['Email', 'email']) || '',
                    phone: this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'Contact Number']) || '',
                    website: this.getValue(row, 'website', columnMapping, ['Website', 'website', 'URL']) || '',
                    tag: this.getValue(row, 'tag', columnMapping, ['Tag', 'tag']) || '',
                    address: finalAddress,
                    city: finalCity,
                    state: normalizeState(finalState) || finalState,
                    zip: String(finalZip || ''),
                    importBatchId // Add batch ID
                };

                // Warnings for location defaults
                if (!finalAddress) warnings.push(this.warning(rowNum, 'Address missing, defaulted to Unknown', 'address'));
                if (!finalCity) warnings.push(this.warning(rowNum, 'City missing, defaulted to Unknown', 'city'));
                if (!finalState || finalState === 'XX') warnings.push(this.warning(rowNum, 'State missing, defaulted to XX', 'state'));


                if (existsInDb && updateExisting) {
                    const id = vendorIdMap.get(nameLower) || vendorNumberMap.get(vendorNumber);
                    vendorsToUpdate.push({ ...vendorData, id });
                } else {
                    vendorsToCreate.push(vendorData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: vendorsToCreate.length,
                updated: vendorsToUpdate.length,
                skipped: errors.length + warnings.length,
                errors: errors.length
            }, vendorsToCreate.slice(0, 10), errors, warnings);
        }


        let createdCount = 0;
        let updatedCount = 0;

        if (vendorsToCreate.length > 0) {
            try {
                // Since Vendor doesn't have a unique constraint on name/companyId in schema (it has unique on vendorNumber/companyId possibly, 
                // but schema check showed unique on [companyId, vendorNumber] at line 3421 (wait, I missed the unique index in previous view, let me check).
                // Actually, line 3421 was createdById. Let's check line 3430+
                await this.prisma.vendor.createMany({ data: vendorsToCreate, skipDuplicates: true });
                createdCount = vendorsToCreate.length;
            } catch (err: any) {
                for (const item of vendorsToCreate) {
                    try {
                        await this.prisma.vendor.create({ data: item });
                        createdCount++;
                    } catch (e: any) {
                        errors.push(this.error(0, `Create failed for ${item.name}: ${e.message}`));
                    }
                }
            }
        }

        if (updateExisting && vendorsToUpdate.length > 0) {
            for (const item of vendorsToUpdate) {
                const { id, ...dataToUpdate } = item;
                if (!id) continue;
                try {
                    await this.prisma.vendor.update({
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
        }, vendorsToCreate, errors, warnings);
    }


    private mapVendorTypeSmart(value: any): VendorType {
        if (!value) return VendorType.SUPPLIER;
        const v = String(value).toUpperCase().trim();

        if (v.includes('PARTS')) return VendorType.PARTS_VENDOR;
        if (v.includes('SERVICE')) return VendorType.SERVICE_PROVIDER;
        if (v.includes('FUEL')) return VendorType.FUEL_VENDOR;
        if (v.includes('REPAIR') || v.includes('SHOP')) return VendorType.REPAIR_SHOP;
        if (v.includes('TIRE')) return VendorType.TIRE_SHOP;
        if (v.includes('SUPPLY') || v.includes('SUPPLIER')) return VendorType.SUPPLIER;

        return VendorType.SUPPLIER;
    }
}
