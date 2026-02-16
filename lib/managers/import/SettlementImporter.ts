
import { PrismaClient, Settlement, SettlementStatus } from '@prisma/client';
import { BaseImporter, ImportResult } from './BaseImporter';
import { parseImportDate, parseImportNumber } from '@/lib/import-export/import-utils';

export class SettlementImporter extends BaseImporter {
    constructor(prisma: PrismaClient, companyId: string, userId: string) {
        super(prisma, companyId, userId);
    }

    async import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        columnMapping?: Record<string, string>;
        importBatchId?: string;
    }): Promise<ImportResult> {
        const { previewOnly, updateExisting, currentMcNumber, columnMapping = {}, importBatchId } = options;
        const records = data;
        const mapping = columnMapping;
        const created: Settlement[] = [];
        const errors: Array<{ row: number; field?: string; error: string }> = [];
        const warnings: Array<{ row: number; field?: string; error: string }> = [];

        // 0. Pre-fetch Drivers for lookup
        const drivers = await this.prisma.driver.findMany({
            where: { companyId: this.companyId, deletedAt: null },
            select: {
                id: true,
                driverNumber: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Create normalized maps for driver lookup
        const driverMap = new Map<string, string>(); // name/number -> id
        for (const d of drivers) {
            if (d.driverNumber) driverMap.set(d.driverNumber.toLowerCase(), d.id);

            if (d.user) {
                const { firstName, lastName } = d.user;
                if (firstName && lastName) {
                    const fullName = `${firstName.trim()} ${lastName.trim()}`.toLowerCase();
                    driverMap.set(fullName, d.id);

                    const lastFirst = `${lastName.trim()}, ${firstName.trim()}`.toLowerCase();
                    driverMap.set(lastFirst, d.id);
                }
            }
        }

        // 1. Process Records in Batch
        // We'll process sequentially for now to handle simple validation, 
        // but Prisma createMany could be used if we didn't need relational lookups per row.
        // given the complexity of lookups, loop is safer.

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 1;

            try {
                // --- Resolve Driver ---
                const driverVal = this.getValue(row, 'driver', mapping, ['Driver', 'Driver Name', 'Driver ID', 'Employee']);
                let driverId: string | null = null;

                if (driverVal) {
                    const driverStr = String(driverVal).toLowerCase().trim();
                    if (driverMap.has(driverStr)) {
                        driverId = driverMap.get(driverStr)!;
                    }
                }

                if (!driverId) {
                    driverId = Array.from(driverMap.values())[0] || null;
                    if (driverId) {
                        warnings.push(this.warning(rowNum, `Driver not found, defaulted to first available driver`, 'driver'));
                    } else {
                        errors.push(this.error(rowNum, `Driver not found and no drivers exist in system`, 'driver'));
                        continue;
                    }
                }

                // --- Basic Fields ---
                const settlementNumber = this.getValue(row, 'settlementNumber', mapping, ['Settlement #', 'Settlement ID', 'Number', 'ID'])
                    || this.getPlaceholder('SETT', rowNum);
                const periodStartVal = this.getValue(row, 'periodStart', mapping, ['Start Date', 'Period Start', 'From']);
                const periodEndVal = this.getValue(row, 'periodEnd', mapping, ['End Date', 'Period End', 'To']);
                const periodStart = parseImportDate(periodStartVal) || new Date();
                const periodEnd = parseImportDate(periodEndVal) || new Date();

                const paymentDateVal = this.getValue(row, 'paidDate', mapping, ['Date', 'Payment Date', 'Check Date']);
                const paidDate = parseImportDate(paymentDateVal);

                // --- Financials ---
                const grossPay = parseImportNumber(this.getValue(row, 'grossPay', mapping, ['Gross', 'Gross Pay', 'Total Pay'])) || 0;
                const netPay = parseImportNumber(this.getValue(row, 'netPay', mapping, ['Net', 'Net Pay', 'Check Amount', 'Amount'])) || 0;
                const deductions = parseImportNumber(this.getValue(row, 'deductions', mapping, ['Deductions', 'Ded'])) || 0;
                const advances = parseImportNumber(this.getValue(row, 'advances', mapping, ['Advances', 'Advance'])) || 0;

                // --- Status ---
                let status: SettlementStatus = SettlementStatus.PENDING;
                const statusVal = this.getValue(row, 'status', mapping, ['Status']);
                if (statusVal) {
                    const s = String(statusVal).toUpperCase();
                    if (s.includes('PAID')) status = SettlementStatus.PAID;
                    else if (s.includes('APPROV')) status = SettlementStatus.APPROVED;
                    else if (s.includes('PEND')) status = SettlementStatus.PENDING;
                } else if (paidDate) {
                    status = SettlementStatus.PAID;
                }

                // Zero-Failure: Pay defaults
                if (grossPay === 0) warnings.push(this.warning(rowNum, 'Gross Pay is 0 or missing', 'grossPay'));
                if (netPay === 0) warnings.push(this.warning(rowNum, 'Net Pay is 0 or missing', 'netPay'));

                // Check for duplicate settlement number
                const existing = await this.prisma.settlement.findUnique({
                    where: { settlementNumber }
                });

                if (existing && !updateExisting) {
                    warnings.push(this.warning(rowNum, `Settlement # ${settlementNumber} already exists, skipping row.`, 'Database Duplicate'));
                    continue;
                }

                // --- Create Settlement ---
                const settlement = await this.prisma.settlement.create({
                    data: {
                        driverId,
                        settlementNumber,
                        periodStart,
                        periodEnd,
                        paidDate,
                        grossPay,
                        netPay,
                        deductions,
                        advances,
                        status,
                        notes: `Imported via CSV on ${new Date().toLocaleDateString()}`,
                        // Audit
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        approvalStatus: status === SettlementStatus.PAID ? 'APPROVED' : 'PENDING'
                    }
                });

                created.push(settlement);

            } catch (err: any) {
                errors.push(this.error(rowNum, `Unexpected error: ${err.message}`));
            }
        }

        return this.success({
            total: records.length,
            created: created.length,
            updated: 0,
            skipped: records.length - created.length - errors.length,
            errors: errors.length
        }, created, errors, warnings);
    }
}
