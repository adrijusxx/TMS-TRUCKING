import { PayType } from '@prisma/client';
import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { DRIVER_TYPE_MAP, DRIVER_STATUS_MAP } from './utils/enum-maps';
import { parseAddressFields } from './utils/AddressParsingHelper';
import { parseImportDate } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';
import * as bcrypt from 'bcryptjs';

export class DriverImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.driver; }
    protected useCreateMany() { return false; }

    protected async preFetchLookups(_ctx: ImportContext) {
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
        existingDrivers.forEach(d => { if (d.userId) userIdToDriverMap.set(d.userId, d); });

        return {
            driverIdMap,
            userIdToDriverMap,
            userIdMap: new Map(existingUsers.map(u => [u.email.toLowerCase().trim(), u])),
            companyEmailSet: new Set(existingUsers.map(u => u.email.toLowerCase().trim())),
            mcIdMap: new Map(mcNumbers.map(mc => [mc.number?.trim(), mc.id])),
            defaultMcId: mcNumbers.find(mc => mc.isDefault)?.id || mcNumbers[0]?.id,
            passwordHash: await bcrypt.hash('Driver123!', 10),
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, currentMcNumber, importBatchId, formatSettings } = ctx.options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];
        const { driverIdMap, userIdToDriverMap, userIdMap, companyEmailSet, mcIdMap, defaultMcId } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        // Resolve driver number with fallback chain
        let driverNumber = this.getValue(row, 'driverNumber', columnMapping, ['Driver Phone Number', 'Driver Number', 'driver_number', 'contact_number', 'Phone', 'phone']);
        const phoneValue = this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'contact_number', 'Contact Number']);
        const truckNumber = this.getValue(row, 'truck', columnMapping, ['Truck', 'Truck Number', 'truck_number']);

        if (!driverNumber && phoneValue) driverNumber = phoneValue;
        if (!driverNumber && truckNumber) driverNumber = truckNumber;

        let email = String(this.getValue(row, 'email', columnMapping, ['Email', 'email']) || '').toLowerCase().trim();
        let firstName = this.getValue(row, 'firstName', columnMapping, ['First Name', 'first_name', 'Name', 'name', 'Driver Name', 'driver_name', 'Full Name']);
        let lastName = this.getValue(row, 'lastName', columnMapping, ['Last Name', 'last_name', 'Surname', 'surname']) || '';

        // Auto-split full name
        if (firstName && !lastName && firstName.trim().includes(' ')) {
            const parts = firstName.trim().split(/\s+/);
            if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(' ');
            }
        }

        // Auto-generate driver number from name
        if (!driverNumber && firstName) {
            const cleanFirst = String(firstName).replace(/[^a-zA-Z0-9]/g, '');
            const cleanLast = String(lastName).replace(/[^a-zA-Z0-9]/g, '');
            driverNumber = `DRV-${cleanFirst.substring(0, 3)}-${cleanLast.substring(0, 3)}-${rowNum}`.toUpperCase();
        }

        if (!driverNumber) {
            return { action: 'skip', error: this.error(rowNum, 'Driver Phone Number is required', 'driverNumber') };
        }

        // Auto-generate email
        if (!email) {
            const cleanDriverNum = String(driverNumber).replace(/[^a-zA-Z0-9]/g, '');
            email = `driver.${cleanDriverNum}.${rowNum}@system.local`.toLowerCase();
        }

        // File dedup
        const driverKey = driverNumber.toLowerCase().trim();
        if (ctx.existingInFile.has(driverKey) || ctx.existingInFile.has(email)) {
            return { action: 'skip', error: this.error(rowNum, `Duplicate found earlier in this file`, 'Duplicate') };
        }

        // DB dedup
        const existingDriver = driverIdMap.get(driverKey);
        const existingUser = userIdMap.get(email);
        const userExistingDriver = existingUser ? userIdToDriverMap.get(existingUser.id) : null;
        const targetDriver = existingDriver || userExistingDriver;
        const exists = !!targetDriver || !!existingUser;

        if (exists && !updateExisting) {
            return { action: 'skip', error: this.error(rowNum, `${targetDriver ? 'Driver' : 'User'} already exists in this company`, 'Database Duplicate') };
        }

        ctx.existingInFile.add(driverKey);
        ctx.existingInFile.add(email);

        // Resolve MC
        const rowMc = this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number', 'MC#']);
        const currentMcValue = currentMcNumber?.trim();
        const mcNumberId = mcIdMap.get(rowMc?.trim()) || (currentMcValue ? mcIdMap.get(currentMcValue) : null) || defaultMcId;

        // Address parsing
        const addr = parseAddressFields(
            this.getValue(row, 'address', columnMapping, ['Address', 'address', 'Address 1', 'Street']) || '',
            this.getValue(row, 'city', columnMapping, ['City', 'city']) || '',
            this.getValue(row, 'state', columnMapping, ['State', 'state', 'ST']) || '',
            this.getValue(row, 'zip', columnMapping, ['Zip', 'zip', 'Zip Code', 'Postal Code']) || ''
        );

        // Enum mapping
        const driverType = SmartEnumMapper.map(this.getValue(row, 'driverType', columnMapping, ['Type', 'driver_type', 'Driver Type']), DRIVER_TYPE_MAP);
        const status = SmartEnumMapper.map(this.getValue(row, 'status', columnMapping, ['Status', 'status']), DRIVER_STATUS_MAP);

        // Pay rate
        let payRate = parseFloat(String(this.getValue(row, 'payRate', columnMapping, ['Pay Rate', 'pay_rate', 'Rate']) || '0').replace(/[^0-9.]/g, '')) || 0;
        if (payRate === 0) {
            payRate = 0.65;
            warnings.push(this.warning(rowNum, 'Pay Rate missing or zero, defaulted to $0.65/mile (PER_MILE)', 'payRate'));
        }

        // License
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
            address1: addr.address,
            city: addr.city,
            state: normalizeState(addr.state) || addr.state,
            zipCode: addr.zip,
            address2: '',
            userData: {
                email, firstName, lastName, phone,
                role: 'DRIVER',
                companyId: this.companyId,
                password: ctx.lookups.passwordHash,
                mcNumberId,
            },
        };

        if (exists && updateExisting) {
            return {
                action: 'update',
                data: {
                    ...driverData,
                    driverId: targetDriver?.id,
                    userId: existingUser?.id || targetDriver?.userId,
                    isReactivate: !!(targetDriver?.deletedAt || existingUser?.deletedAt),
                },
                warnings,
            };
        }
        return { action: 'create', data: driverData, warnings };
    }

    /**
     * Custom preview: shows both creates and updates.
     */
    protected buildPreview(total: number, toCreate: any[], toUpdate: any[], ctx: ImportContext) {
        return this.success(
            { total, created: toCreate.length, updated: toUpdate.length, skipped: ctx.errors.length, errors: ctx.errors.length },
            [...toCreate, ...toUpdate].slice(0, 10),
            ctx.errors
        );
    }

    /**
     * Custom persist: nested User+Driver creation, separate user+driver updates.
     */
    protected async persist(toCreate: any[], toUpdate: any[], ctx: ImportContext) {
        const { importBatchId } = ctx.options;
        let createdCount = 0;
        let updatedCount = 0;

        for (const item of toCreate) {
            try {
                const { userData, rowIndex, ...dData } = item;
                await this.prisma.user.create({
                    data: {
                        ...userData,
                        drivers: {
                            create: { ...dData, companyId: this.companyId, importBatchId }
                        }
                    }
                });
                createdCount++;
            } catch (err: any) {
                ctx.errors.push(this.error(item.rowIndex, `Create failed: ${err.message}`));
            }
        }

        if (ctx.options.updateExisting && toUpdate.length > 0) {
            for (const item of toUpdate) {
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
                                isActive: isReactivate ? true : undefined,
                            }
                        });
                    }

                    if (driverId) {
                        await this.prisma.driver.update({
                            where: { id: driverId },
                            data: {
                                ...dData,
                                deletedAt: isReactivate ? null : undefined,
                                isActive: isReactivate ? true : undefined,
                            }
                        });
                    } else if (userId) {
                        await this.prisma.driver.create({
                            data: { ...dData, userId, companyId: this.companyId, importBatchId }
                        });
                    }

                    updatedCount++;
                } catch (err: any) {
                    ctx.errors.push(this.error(item.rowIndex, `Update failed: ${err.message}`));
                }
            }
        }

        return { createdCount, updatedCount };
    }
}
