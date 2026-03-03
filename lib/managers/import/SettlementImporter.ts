import { SettlementStatus, ApprovalStatus } from '@prisma/client';
import { BaseImporter } from './BaseImporter';
import type { ImportContext, RowProcessResult } from './types/importer-types';
import { SmartEnumMapper } from './utils/SmartEnumMapper';
import { SETTLEMENT_STATUS_MAP } from './utils/enum-maps';
import { buildDriverLookupMap } from './utils/DriverLookupHelper';
import { parseImportDate, parseImportNumber } from '@/lib/import-export/import-utils';

export class SettlementImporter extends BaseImporter {

    protected getPrismaDelegate() { return this.prisma.settlement; }
    protected useCreateMany() { return false; }

    protected async preFetchLookups(_ctx: ImportContext) {
        const drivers = await this.prisma.driver.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: {
                id: true,
                driverNumber: true,
                user: { select: { firstName: true, lastName: true } }
            }
        });

        // Build driver map with "LastName, FirstName" variant for settlement lookups
        const driverMap = new Map<string, string>();
        for (const d of drivers) {
            if (d.driverNumber) driverMap.set(d.driverNumber.toLowerCase(), d.id);
            if (d.user) {
                const { firstName, lastName } = d.user;
                if (firstName && lastName) {
                    driverMap.set(`${firstName.trim()} ${lastName.trim()}`.toLowerCase(), d.id);
                    driverMap.set(`${lastName.trim()}, ${firstName.trim()}`.toLowerCase(), d.id);
                }
            }
        }

        return { driverMap };
    }

    protected async processRow(row: any, rowNum: number, ctx: ImportContext): Promise<RowProcessResult> {
        const { columnMapping, updateExisting, formatSettings } = ctx.options;
        const dateHint = formatSettings?.dateFormat as Parameters<typeof parseImportDate>[1];
        const { driverMap } = ctx.lookups;
        const mapping = columnMapping || {};
        const warnings: RowProcessResult['warnings'] = [];

        // Resolve driver
        const driverVal = this.getValue(row, 'driver', mapping, ['Driver', 'Driver Name', 'Driver ID', 'Employee']);
        let driverId: string | null = null;
        if (driverVal) {
            driverId = driverMap.get(String(driverVal).toLowerCase().trim()) || null;
        }
        if (!driverId) {
            driverId = (Array.from(driverMap.values())[0] as string) || null;
            if (driverId) {
                warnings.push(this.warning(rowNum, 'Driver not found, defaulted to first available driver', 'driver'));
            } else {
                return { action: 'skip', error: this.error(rowNum, 'Driver not found and no drivers exist in system', 'driver') };
            }
        }

        // Basic fields
        const settlementNumber = this.getValue(row, 'settlementNumber', mapping, ['Settlement #', 'Settlement ID', 'Number', 'ID'])
            || this.getPlaceholder('SETT', rowNum);
        const periodStart = parseImportDate(this.getValue(row, 'periodStart', mapping, ['Start Date', 'Period Start', 'From']), dateHint) || new Date();
        const periodEnd = parseImportDate(this.getValue(row, 'periodEnd', mapping, ['End Date', 'Period End', 'To']), dateHint) || new Date();
        const paidDate = parseImportDate(this.getValue(row, 'paidDate', mapping, ['Date', 'Payment Date', 'Check Date']), dateHint);

        // Financials
        const grossPay = parseImportNumber(this.getValue(row, 'grossPay', mapping, ['Gross', 'Gross Pay', 'Total Pay'])) || 0;
        const netPay = parseImportNumber(this.getValue(row, 'netPay', mapping, ['Net', 'Net Pay', 'Check Amount', 'Amount'])) || 0;
        const deductions = parseImportNumber(this.getValue(row, 'deductions', mapping, ['Deductions', 'Ded'])) || 0;
        const advances = parseImportNumber(this.getValue(row, 'advances', mapping, ['Advances', 'Advance'])) || 0;

        // Status
        const statusVal = this.getValue(row, 'status', mapping, ['Status']);
        let status: SettlementStatus;
        if (statusVal) {
            status = SmartEnumMapper.map(statusVal, SETTLEMENT_STATUS_MAP);
        } else if (paidDate) {
            status = SettlementStatus.PAID;
        } else {
            status = SettlementStatus.PENDING;
        }

        if (grossPay === 0) warnings.push(this.warning(rowNum, 'Gross Pay is 0 or missing', 'grossPay'));
        if (netPay === 0) warnings.push(this.warning(rowNum, 'Net Pay is 0 or missing', 'netPay'));

        // Per-row DB dedup
        const existing = await this.prisma.settlement.findUnique({
            where: { settlementNumber }
        });

        if (existing && !updateExisting) {
            return { action: 'skip', error: this.warning(rowNum, `Settlement # ${settlementNumber} already exists, skipping row.`, 'Database Duplicate'), warnings };
        }

        const settlementFields = {
            driverId,
            periodStart,
            periodEnd,
            paidDate,
            grossPay,
            netPay,
            deductions,
            advances,
            status,
            notes: `Imported via CSV on ${new Date().toLocaleDateString()}`,
            updatedAt: new Date(),
            approvalStatus: status === SettlementStatus.PAID ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
        };

        if (existing && updateExisting) {
            return {
                action: 'update',
                data: { _existingId: existing.id, ...settlementFields },
                warnings,
            };
        }

        return {
            action: 'create',
            data: { settlementNumber, ...settlementFields, createdAt: new Date() },
            warnings,
        };
    }

    /**
     * Custom persist: settlements use inline create/update (preserves current behavior).
     */
    protected async persist(toCreate: any[], toUpdate: any[], ctx: ImportContext) {
        let createdCount = 0;
        let updatedCount = 0;

        for (const item of toCreate) {
            try {
                await this.prisma.settlement.create({ data: item });
                createdCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Create failed: ${e.message}`));
            }
        }

        for (const item of toUpdate) {
            const { _existingId, ...data } = item;
            try {
                await this.prisma.settlement.update({ where: { id: _existingId }, data });
                updatedCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Update failed: ${e.message}`));
            }
        }

        return { createdCount, updatedCount };
    }
}
