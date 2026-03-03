import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { mapUserRole } from './utils/enum-maps';
import * as bcrypt from 'bcryptjs';

export class EmployeeImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.user; }
    protected useCreateMany() { return false; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const companyUsers = await this.prisma.user.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: { email: true, id: true, employeeNumber: true }
        });

        return {
            userIdMap: new Map(companyUsers.map(u => [u.email.toLowerCase().trim(), u.id])),
            companyEmailSet: new Set(companyUsers.map(u => u.email.toLowerCase().trim())),
            companyEmpNumberSet: new Set(
                companyUsers.filter(u => u.employeeNumber).map(u => u.employeeNumber!.toLowerCase().trim())
            ),
            fileEmployeeNumbers: new Set<string>(),
            passwordHash: await bcrypt.hash('User123!', 10),
        };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, entity } = ctx.options;
        const { userIdMap, companyEmailSet, companyEmpNumberSet, fileEmployeeNumbers } = ctx.lookups;
        const warnings: RowProcessResult['warnings'] = [];

        let email = this.getValue(row, 'email', columnMapping, ['Email', 'email'])?.toLowerCase().trim();
        let firstName = this.getValue(row, 'firstName', columnMapping, ['First Name', 'first_name']);
        let lastName = this.getValue(row, 'lastName', columnMapping, ['Last Name', 'last_name']);

        if (!email) {
            const shortId = this.companyId.slice(-6);
            const ts = Date.now().toString(36);
            email = `user.${rowNum}.${shortId}.${ts}@tms.system`.toLowerCase();
            warnings.push(this.warning(rowNum, `Email missing, defaulted to ${email}`, 'email'));
        }

        if (!firstName || !lastName) {
            firstName = firstName || 'Employee';
            lastName = lastName || `#${rowNum}`;
            warnings.push(this.warning(rowNum, `Name missing, defaulted to ${firstName} ${lastName}`, 'name'));
        }

        // File dedup
        if (ctx.existingInFile.has(email)) {
            return { action: 'skip', error: this.error(rowNum, `Duplicate found in file: ${email}`, 'Duplicate'), warnings };
        }

        // DB dedup
        const existsInCompany = companyEmailSet.has(email);
        if (existsInCompany && !updateExisting) {
            return { action: 'skip', error: this.error(rowNum, `User already exists in this company: ${email}`, 'Database Duplicate'), warnings };
        }

        ctx.existingInFile.add(email);

        const role = mapUserRole(this.getValue(row, 'role', columnMapping, ['Role', 'role', 'Job Title', 'Type']), entity);
        const resolvedMcId = await this.resolveMcNumberId(this.getValue(row, 'mcNumberId', columnMapping, ['MC Number', 'mc_number']));

        // Generate unique employeeNumber
        let employeeNumber = this.getValue(row, 'employeeNumber', columnMapping, ['Employee Number', 'employee_number', 'ID']);
        if (!employeeNumber) {
            let base = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-');
            let candidate = base;
            let suffix = 2;
            while (companyEmpNumberSet.has(candidate.toLowerCase()) || fileEmployeeNumbers.has(candidate.toLowerCase())) {
                candidate = `${base}-${suffix}`;
                suffix++;
            }
            employeeNumber = candidate;
            warnings.push(this.warning(rowNum, `Employee Number auto-generated: ${employeeNumber}`, 'employeeNumber'));
        } else {
            const empNumLower = employeeNumber.toLowerCase().trim();
            if ((companyEmpNumberSet.has(empNumLower) || fileEmployeeNumbers.has(empNumLower)) && !updateExisting) {
                return { action: 'skip', error: this.error(rowNum, `Employee Number already exists: ${employeeNumber}`, 'Duplicate'), warnings };
            }
        }
        fileEmployeeNumbers.add(employeeNumber.toLowerCase().trim());

        const employeeData: any = {
            companyId: this.companyId,
            mcNumberId: resolvedMcId,
            email,
            firstName,
            lastName,
            phone: this.getValue(row, 'phone', columnMapping, ['Phone', 'phone', 'Cell']) || '',
            role,
            isActive: true,
            employeeNumber,
        };

        if (existsInCompany && updateExisting) {
            employeeData.id = userIdMap.get(email);
            return { action: 'update', data: employeeData, warnings };
        }
        return { action: 'create', data: employeeData, warnings };
    }

    /**
     * Creates need password hash injected.
     */
    protected async batchCreate(items: any[], ctx: ImportContext): Promise<number> {
        const { passwordHash } = ctx.lookups;
        let createdCount = 0;
        for (const item of items) {
            try {
                await this.prisma.user.create({ data: { ...item, password: passwordHash } });
                createdCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Create failed for ${item.email}: ${e.message}`));
            }
        }
        return createdCount;
    }
}
