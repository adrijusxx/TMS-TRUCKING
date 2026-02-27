
import { PrismaClient, DriverStatus, PayType, DriverType } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue, parseImportDate, parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';
import * as bcrypt from 'bcryptjs';

export class DriverImporter extends BaseImporter {
    public async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string;
        formatSettings?: { dateFormat?: string };
    }): Promise<ImportResult> {
        const { previewOnly, updateExisting, currentMcNumber, columnMapping = {}, importBatchId, formatSettings } = options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];

        console.log(`[DriverImporter] Starting import of ${data.length} records. MC: ${currentMcNumber}, Preview: ${previewOnly}`);

        const errors: any[] = [];
        const warnings: any[] = [];
        const driversToCreate: any[] = [];
        const driversToUpdate: any[] = [];
        const existingInFile = new Set<string>();

        // Pre-fetch (per-company only — email/employeeNumber are now unique per company)
        const [existingDrivers, existingUsers, mcNumbers] = await Promise.all([
            this.prisma.driver.findMany({
                where: { companyId: this.companyId },
                select: { driverNumber: true, id: true, userId: true, deletedAt: true }
            }),
            this.prisma.user.findMany({
                where: { companyId: this.companyId },
                select: { email: true, id: true, deletedAt: true }
            }),
            this.prisma.mcNumber.findMany({
                where: { companyId: this.companyId, deletedAt: null },
                select: { id: true, number: true, isDefault: true }
            })
        ]);

        const driverIdMap = new Map(existingDrivers.map(d => [d.driverNumber.toLowerCase().trim(), d]));
        const userIdToDriverMap = new Map<string, typeof existingDrivers[0]>();
        existingDrivers.forEach(d => {
            if (d.userId) userIdToDriverMap.set(d.userId, d);
        });

        const userIdMap = new Map(existingUsers.map(u => [u.email.toLowerCase().trim(), u]));
        const companyEmailSet = new Set(existingUsers.map(u => u.email.toLowerCase().trim()));

        const mcIdMap = new Map(mcNumbers.map(mc => [mc.number?.trim(), mc.id]));
        const defaultMcId = mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id;

        const passwordHash = await bcrypt.hash('Driver123!', 10);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            if (i === 0) {
                console.log('[DriverImporter] Diagnostic - First Row:', JSON.stringify(row, null, 2));
                console.log('[DriverImporter] Diagnostic - Row Keys:', Object.keys(row));
                console.log('[DriverImporter] Diagnostic - Mapping:', JSON.stringify(columnMapping, null, 2));
            }

            try {
                let driverNumber = this.getValue(row, 'driverNumber', columnMapping, ['Driver Phone Number', 'Driver Number', 'driver_number', 'contact_number', 'Phone', 'phone']);
                const phoneValue = this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'contact_number', 'Contact Number']);
                const truckNumber = this.getValue(row, 'truck', columnMapping, ['Truck', 'Truck Number', 'truck_number']);

                if (!driverNumber && phoneValue) {
                    driverNumber = phoneValue;
                    console.log(`[DriverImporter] Row ${rowNum}: Driver Phone Number missing, falling back to Phone: ${phoneValue}`);
                }

                if (!driverNumber && truckNumber) {
                    driverNumber = truckNumber;
                    console.log(`[DriverImporter] Row ${rowNum}: Driver Phone Number missing, falling back to Truck Number: ${truckNumber}`);
                }

                let email = String(this.getValue(row, 'email', columnMapping, ['Email', 'email']) || '').toLowerCase().trim();
                let firstName = this.getValue(row, 'firstName', columnMapping, ['First Name', 'first_name', 'Name', 'name', 'Driver Name', 'driver_name', 'Full Name']);
                let lastName = this.getValue(row, 'lastName', columnMapping, ['Last Name', 'last_name', 'Surname', 'surname']) || '';

                if (firstName && !lastName && firstName.trim().includes(' ')) {
                    const parts = firstName.trim().split(/\s+/);
                    if (parts.length > 1) {
                        firstName = parts[0];
                        lastName = parts.slice(1).join(' ');
                    }
                }

                if (!driverNumber && firstName) {
                    const cleanFirst = String(firstName).replace(/[^a-zA-Z0-9]/g, '');
                    const cleanLast = String(lastName).replace(/[^a-zA-Z0-9]/g, '');
                    driverNumber = `DRV-${cleanFirst.substring(0, 3)}-${cleanLast.substring(0, 3)}-${rowNum}`.toUpperCase();
                    console.log(`[DriverImporter] Row ${rowNum}: No Driver/Phone/Truck number, auto-generated: ${driverNumber}`);
                }

                if (!driverNumber) {
                    errors.push(this.error(rowNum, 'Driver Phone Number is required', 'driverNumber'));
                    continue;
                }

                // Auto-generate email if missing (per-company unique, simple format is fine)
                if (!email) {
                    const cleanDriverNum = String(driverNumber).replace(/[^a-zA-Z0-9]/g, '');
                    email = `driver.${cleanDriverNum}.${rowNum}@system.local`.toLowerCase();
                }

                const driverKey = driverNumber.toLowerCase().trim();
                if (existingInFile.has(driverKey) || existingInFile.has(email)) {
                    const dupField = existingInFile.has(driverKey) ? 'Driver Number' : 'Email';
                    console.log(`[DriverImporter] Skipping Row ${rowNum}: Duplicate ${dupField} found earlier in this file (${driverKey})`);
                    errors.push(this.error(rowNum, `Duplicate ${dupField} found earlier in this file`, 'Duplicate'));
                    continue;
                }

                const existingDriver = driverIdMap.get(driverKey);
                const existingUser = userIdMap.get(email);

                let userExistingDriver = existingUser ? userIdToDriverMap.get(existingUser.id) : null;

                const targetDriver = existingDriver || userExistingDriver;
                const exists = !!targetDriver || !!existingUser;

                if (exists && !updateExisting) {
                    const existsInDB = !!targetDriver ? 'Driver' : 'User';
                    console.log(`[DriverImporter] Skipping Row ${rowNum}: ${existsInDB} already exists in database (${driverKey})`);
                    errors.push(this.error(rowNum, `${existsInDB} already exists in this company`, 'Database Duplicate'));
                    continue;
                }

                if (userExistingDriver && !existingDriver && updateExisting) {
                    console.log(`[DriverImporter] Row ${rowNum}: User ${email} already has driver ${userExistingDriver.driverNumber}. Will update to new number ${driverNumber}.`);
                }

                console.log(`[DriverImporter] Queueing Row ${rowNum} for ${updateExisting && exists ? 'Update' : 'Creation'}: ${driverNumber}`);

                existingInFile.add(driverKey);
                existingInFile.add(email);

                // Resolve MC
                const rowMc = this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number', 'MC#']);
                const currentMcValue = currentMcNumber?.trim();
                const mcNumberId = mcIdMap.get(rowMc?.trim()) || (currentMcValue ? mcIdMap.get(currentMcValue) : null) || defaultMcId;

                // Smart Address Parsing
                const addressRaw = this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Address 1', 'Street']) || '';
                const cityRaw = this.getValue(row, 'city', columnMapping, ['City', 'city']) || '';
                const stateRaw = this.getValue(row, 'state', columnMapping, ['State', 'state', 'ST']) || '';
                const zipRaw = this.getValue(row, 'zip', columnMapping, ['Zip', 'zip', 'Zip Code', 'Postal Code']) || '';

                let finalAddress1 = addressRaw;
                let finalCity = cityRaw;
                let finalState = stateRaw;
                let finalZip = zipRaw;

                if (addressRaw && (!cityRaw || !stateRaw)) {
                    const parsed = parseLocationString(addressRaw);
                    if (parsed) {
                        if (parsed.address) finalAddress1 = parsed.address;
                        if (!finalCity) finalCity = parsed.city;
                        if (!finalState) finalState = parsed.state;
                        if (!finalZip && parsed.zip) finalZip = parsed.zip;
                    }
                }

                // Smart Type & Status Mapping
                const driverTypeStr = this.getValue(row, 'driverType', columnMapping, ['Type', 'driver_type', 'Driver Type']);
                const driverType = this.mapDriverTypeSmart(driverTypeStr);

                const statusStr = this.getValue(row, 'status', columnMapping, ['Status', 'status']);
                const status = this.mapDriverStatusSmart(statusStr);

                // Anomaly Detection
                let payRate = parseFloat(String(this.getValue(row, 'payRate', columnMapping, ['Pay Rate', 'pay_rate', 'Rate']) || '0').replace(/[^0-9.]/g, '')) || 0;
                if (payRate === 0) {
                    payRate = 0.65;
                    warnings.push(this.warning(rowNum, 'Pay Rate missing or zero, defaulted to $0.65/mile (PER_MILE)', 'payRate'));
                }

                let licenseNumber = this.getValue(row, 'licenseNumber', columnMapping, ['License Number', 'license_number', 'CDL#', 'CDL Number', 'License #', 'CDL']);
                if (!licenseNumber) {
                    licenseNumber = 'PENDING';
                    warnings.push(this.warning(rowNum, 'License Number missing, defaulted to PENDING', 'licenseNumber'));
                }

                let licenseState = normalizeState(this.getValue(row, 'licenseState', columnMapping, ['License State', 'license_state', 'CDL State', 'License ST']));
                if (!licenseState || licenseState === 'XX') {
                    licenseState = 'XX';
                    warnings.push(this.warning(rowNum, 'License State missing, defaulted to XX', 'licenseState'));
                }

                const futureDate = this.getFutureDate(1);

                let licenseExpiry = parseImportDate(this.getValue(row, 'licenseExpiry', columnMapping, ['License Expiry', 'license_expiry']), dateHint);
                if (!licenseExpiry) {
                    licenseExpiry = futureDate;
                    warnings.push(this.warning(rowNum, 'License Expiry missing, defaulted to +1 Year', 'licenseExpiry'));
                }

                let medicalCardExpiry = parseImportDate(this.getValue(row, 'medicalCardExpiry', columnMapping, ['Medical Card Expiry', 'medical_card_expiry']), dateHint);
                if (!medicalCardExpiry) {
                    medicalCardExpiry = futureDate;
                    warnings.push(this.warning(rowNum, 'Medical Card Expiry missing, defaulted to +1 Year', 'medicalCardExpiry'));
                }

                if (!firstName || !lastName) {
                    firstName = firstName || 'Driver';
                    lastName = lastName || `#${rowNum}`;
                    warnings.push(this.warning(rowNum, `Name missing, defaulted to ${firstName} ${lastName}`, 'name'));
                }

                const phone = this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'Cell phone', 'contact_number']) || '';

                const driverData: any = {
                    rowIndex: rowNum,
                    driverNumber,
                    driverType,
                    status,
                    licenseNumber,
                    licenseState,
                    licenseExpiry,
                    medicalCardExpiry,
                    payType: PayType.PER_MILE,
                    payRate,
                    mcNumberId,
                    address1: finalAddress1,
                    city: finalCity,
                    state: normalizeState(finalState) || finalState,
                    zipCode: String(finalZip || ''),
                    address2: '',
                    userData: {
                        email,
                        firstName,
                        lastName,
                        phone,
                        role: 'DRIVER',
                        companyId: this.companyId,
                        password: passwordHash,
                        mcNumberId
                    }
                };

                if (exists && updateExisting) {
                    driversToUpdate.push({
                        ...driverData,
                        driverId: targetDriver?.id,
                        userId: existingUser?.id || targetDriver?.userId,
                        isReactivate: !!(targetDriver?.deletedAt || existingUser?.deletedAt)
                    });
                } else {
                    driversToCreate.push(driverData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: driversToCreate.length,
                updated: driversToUpdate.length,
                skipped: errors.length,
                errors: errors.length
            }, [...driversToCreate, ...driversToUpdate].slice(0, 10), errors);
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of driversToCreate) {
            try {
                const { userData, rowIndex, ...dData } = item;
                await this.prisma.user.create({
                    data: {
                        ...userData,
                        drivers: {
                            create: {
                                ...dData,
                                companyId: this.companyId,
                                importBatchId
                            }
                        }
                    }
                });
                createdCount++;
            } catch (err: any) {
                errors.push(this.error(item.rowIndex, `Create failed: ${err.message}`));
            }
        }

        if (updateExisting && driversToUpdate.length > 0) {
            for (const item of driversToUpdate) {
                try {
                    const { userData, driverId, userId, rowIndex, isReactivate, ...dData } = item;

                    if (userId) {
                        await this.prisma.user.update({
                            where: { id: userId },
                            data: {
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                phone: userData.phone,
                                deletedAt: isReactivate ? null : undefined,
                                isActive: isReactivate ? true : undefined
                            }
                        });
                    }

                    if (driverId) {
                        await this.prisma.driver.update({
                            where: { id: driverId },
                            data: {
                                ...dData,
                                deletedAt: isReactivate ? null : undefined,
                                isActive: isReactivate ? true : undefined
                            }
                        });
                    } else if (userId) {
                        await this.prisma.driver.create({
                            data: {
                                ...dData,
                                userId,
                                companyId: this.companyId,
                                importBatchId
                            }
                        });
                    }

                    updatedCount++;
                } catch (err: any) {
                    errors.push(this.error(item.rowIndex, `Update failed: ${err.message}`));
                }
            }
        }

        return this.success({
            total: data.length,
            created: createdCount,
            updated: updatedCount,
            skipped: data.length - createdCount - updatedCount - errors.length,
            errors: errors.length
        }, [], errors);
    }

    private mapDriverTypeSmart(val: any): DriverType {
        if (!val) return DriverType.COMPANY_DRIVER;
        const v = String(val).toUpperCase();

        if (v.includes('OWNER')) return DriverType.OWNER_OPERATOR;
        if (v.includes('LEASE')) return DriverType.LEASE;
        if (v.includes('COMPANY') || v.includes('EMP')) return DriverType.COMPANY_DRIVER;

        return DriverType.COMPANY_DRIVER;
    }

    private mapDriverStatusSmart(val: any): DriverStatus {
        if (!val) return DriverStatus.AVAILABLE;
        const v = String(val).toUpperCase();

        if (v.includes('AVAILABLE') || v.includes('AVAIL') || v.includes('READY')) return DriverStatus.AVAILABLE;
        if (v.includes('DRIVING') || v.includes('ACTIVE')) return DriverStatus.DRIVING;
        if (v.includes('TRANSIT')) return DriverStatus.IN_TRANSIT;
        if (v.includes('DUTY') && !v.includes('OFF')) return DriverStatus.ON_DUTY;
        if (v.includes('OFF')) return DriverStatus.OFF_DUTY;
        if (v.includes('LEAVE')) return DriverStatus.ON_LEAVE;
        if (v.includes('INACTIVE') || v.includes('QUIT')) return DriverStatus.INACTIVE;

        return DriverStatus.AVAILABLE;
    }
}
