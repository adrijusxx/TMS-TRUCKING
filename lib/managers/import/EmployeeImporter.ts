
import { PrismaClient, UserRole } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { getRowValue } from '@/lib/import-export/import-utils';
import * as bcrypt from 'bcryptjs';

export class EmployeeImporter extends BaseImporter {
    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        entity?: string;
        columnMapping?: Record<string, string>;
        importBatchId?: string; // Add importBatchId
    }): Promise<ImportResult> {
        const { previewOnly, updateExisting, entity, columnMapping, importBatchId } = options;
        const errors: any[] = [];
        const warnings: any[] = [];
        const employeesToCreate: any[] = [];
        const employeesToUpdate: any[] = [];
        const existingInFile = new Set<string>();

        // Pre-fetch
        const existingUsers = await this.prisma.user.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { email: true, id: true }
        });

        const dbEmailSet = new Set(existingUsers.map(u => u.email.toLowerCase().trim()));
        const userIdMap = new Map(existingUsers.map(u => [u.email.toLowerCase().trim(), u.id]));

        const passwordHash = await bcrypt.hash('User123!', 10);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;

            try {
                let email = this.getValue(row, 'email', columnMapping, ['Email', 'email'])?.toLowerCase().trim();
                let firstName = this.getValue(row, 'firstName', columnMapping, ['First Name', 'first_name']);
                let lastName = this.getValue(row, 'lastName', columnMapping, ['Last Name', 'last_name']);

                if (!email) {
                    email = `user.${rowNum}@tms.system`.toLowerCase();
                    warnings.push(this.warning(rowNum, `Email missing, defaulted to ${email}`, 'email'));
                }

                if (!firstName || !lastName) {
                    firstName = firstName || 'Employee';
                    lastName = lastName || `#${rowNum}`;
                    warnings.push(this.warning(rowNum, `Name missing, defaulted to ${firstName} ${lastName}`, 'name'));
                }


                if (existingInFile.has(email)) {
                    errors.push(this.error(rowNum, `Duplicate found in file: ${email}`, 'Duplicate'));
                    continue;
                }

                const existsInDb = dbEmailSet.has(email);

                if (existsInDb && !updateExisting) {
                    errors.push(this.error(rowNum, `User already exists in database: ${email}`, 'Database Duplicate'));
                    continue;
                }

                existingInFile.add(email);

                const roleStr = this.getValue(row, 'role', columnMapping, ['Role', 'role', 'Job Title', 'Type']);
                const role = this.mapUserRoleSmart(roleStr, entity);

                const rowMc = this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number']);
                const resolvedMcId = await this.resolveMcNumberId(rowMc);


                const employeeData: any = {
                    companyId: this.companyId,
                    mcNumberId: resolvedMcId,
                    email,
                    firstName,
                    lastName,
                    phone: this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'Cell']) || '',
                    role,
                    isActive: true, // Default to true
                    employeeNumber: this.getValue(row, 'employeeNumber', columnMapping, ['Employee Number', 'employee_number', 'ID']) || `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-'),
                };


                if (existsInDb && updateExisting) {
                    employeeData.id = userIdMap.get(email);
                    employeesToUpdate.push(employeeData);
                } else {
                    employeesToCreate.push(employeeData);
                }

            } catch (err: any) {
                errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        if (previewOnly) {
            return this.success({
                total: data.length,
                created: employeesToCreate.length,
                updated: employeesToUpdate.length,
                skipped: errors.length + warnings.length,
                errors: errors.length
            }, employeesToCreate.slice(0, 10), errors, warnings);
        }


        let createdCount = 0;
        let updatedCount = 0;

        if (employeesToCreate.length > 0) {
            for (const item of employeesToCreate) {
                try {
                    await this.prisma.user.create({
                        data: {
                            ...item,
                            password: passwordHash
                        }
                    });
                    createdCount++;
                } catch (e: any) {
                    errors.push(this.error(0, `Create failed for ${item.email}: ${e.message}`));
                }
            }
        }

        if (updateExisting && employeesToUpdate.length > 0) {
            for (const item of employeesToUpdate) {
                const { id, ...dataToUpdate } = item;
                if (!id) continue;
                try {
                    await this.prisma.user.update({
                        where: { id },
                        data: dataToUpdate
                    });
                    updatedCount++;
                } catch (e: any) {
                    errors.push(this.error(0, `Update failed for ${item.email}: ${e.message}`));
                }
            }
        }

        return this.success({
            total: data.length,
            created: createdCount,
            updated: updatedCount,
            skipped: data.length - createdCount - updatedCount - errors.length,
            errors: errors.length
        }, employeesToCreate, errors, warnings);
    }


    private mapUserRoleSmart(value: any, entity?: string): UserRole {
        if (!value) {
            if (entity === 'dispatchers') return UserRole.DISPATCHER;
            if (entity === 'employees') return UserRole.DISPATCHER;
            return UserRole.DISPATCHER;
        }

        const v = String(value).toUpperCase().trim();
        if (v.includes('ADMIN')) return UserRole.ADMIN;
        if (v.includes('DISPATCH')) return UserRole.DISPATCHER;
        if (v.includes('ACCOUNT') || v.includes('BILLING')) return UserRole.ACCOUNTANT;
        if (v.includes('DRIVER')) return UserRole.DRIVER;
        if (v.includes('SUPER')) return UserRole.SUPER_ADMIN;

        return UserRole.DISPATCHER;
    }
}
