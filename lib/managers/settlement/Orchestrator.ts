import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '../DriverAdvanceManager';
import { UsageManager } from '../UsageManager';
import { SettlementCalculationEngine } from './CalculationEngine';
import { SettlementGenerationParams } from './types';
import { LoadStatus } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

export class SettlementOrchestrator {
    private calculationEngine: SettlementCalculationEngine;
    private advanceManager: DriverAdvanceManager;

    constructor() {
        this.calculationEngine = new SettlementCalculationEngine();
        this.advanceManager = new DriverAdvanceManager();
    }

    async generateSettlement(params: SettlementGenerationParams): Promise<any> {
        const { driverId, periodStart, periodEnd, salaryBatchId, loadIds, forceIncludeNotReady } = params;

        const driver = await prisma.driver.findUnique({
            where: { id: driverId, deletedAt: null },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });

        if (!driver) throw new Error('Driver not found');

        // Prevent duplicate settlements for same driver+period
        if (!loadIds || loadIds.length === 0) {
            const existing = await prisma.settlement.findFirst({
                where: { driverId, periodStart, periodEnd, status: { in: ['PENDING', 'APPROVED', 'PAID'] } },
            });
            if (existing) {
                throw new Error(`Settlement ${existing.settlementNumber} already exists for this driver and period. Use recalculate instead.`);
            }
        }

        const loadWhere: Record<string, any> = {
            driverId,
            deletedAt: null,
            status: { in: ['DELIVERED', 'INVOICED', 'PAID', 'BILLING_HOLD', 'READY_TO_BILL'] as LoadStatus[] },
        };

        const andConditions: Record<string, any>[] = [];

        if (loadIds && loadIds.length > 0) {
            loadWhere.id = { in: loadIds };
        } else {
            andConditions.push({
                OR: [
                    { deliveredAt: { gte: periodStart, lte: periodEnd } },
                    { deliveredAt: null, updatedAt: { gte: periodStart, lte: periodEnd } },
                ]
            });
        }

        // Safety: If it's invoiced/paid, it's definitely ready for settlement regardless of the flag.
        // This handles cases where loads were imported as invoiced or skipped the completion manager.
        if (!forceIncludeNotReady) {
            andConditions.push({
                OR: [
                    { readyForSettlement: true },
                    { status: { in: ['INVOICED', 'PAID'] } }
                ]
            });
        }

        if (andConditions.length > 0) {
            loadWhere.AND = andConditions;
        }

        const loads = await prisma.load.findMany({
            where: loadWhere,
            include: {
                accessorialCharges: { where: { status: { in: ['APPROVED', 'BILLED'] } } },
                loadExpenses: { where: { approvalStatus: 'APPROVED', expenseType: { in: ['TOLL', 'SCALE'] } } },
            },
            orderBy: { deliveredAt: 'asc' },
        });

        if (loads.length === 0) throw new Error('No completed loads found for the settlement period');

        const preview = await this.calculationEngine.calculateSettlementPreview(driverId, loads, periodStart, periodEnd);
        const { grossPay, netPay, totalDeductions, totalAdditions, totalAdvances, additions, deductions, advances, negativeBalanceDeduction, previousNegativeBalance, auditLog } = preview;

        const settlementNumber = params.settlementNumber || `SET-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        const settlement = await (prisma.settlement as any).create({
            data: {
                driverId,
                settlementNumber,
                loadIds: loads.map((l) => l.id),
                grossPay,
                deductions: totalDeductions + negativeBalanceDeduction,
                advances: totalAdvances,
                netPay: netPay < 0 ? 0 : netPay,
                carriedForwardAmount: netPay < 0 ? Math.abs(netPay) : 0,
                periodStart,
                periodEnd,
                status: 'PENDING',
                approvalStatus: 'PENDING',
                calculatedAt: new Date(),
                notes: params.notes,
                salaryBatchId,
                calculationLog: auditLog as any,
            },
        });

        if (netPay < 0) {
            await prisma.driverNegativeBalance.create({
                data: {
                    driverId,
                    amount: Math.abs(netPay),
                    originalSettlementId: settlement.id,
                    notes: `Negative balance from settlement ${settlementNumber}.`,
                },
            });

            if (previousNegativeBalance) {
                await prisma.driverNegativeBalance.update({
                    where: { id: previousNegativeBalance.id },
                    data: { isApplied: true, appliedSettlementId: settlement.id, appliedAt: new Date() },
                });
            }
        } else if (previousNegativeBalance) {
            await prisma.driverNegativeBalance.update({
                where: { id: previousNegativeBalance.id },
                data: { isApplied: true, appliedSettlementId: settlement.id, appliedAt: new Date() },
            });

            // Persist negative balance as a visible deduction line item (amount already in settlement.deductions field)
            await prisma.settlementDeduction.create({
                data: {
                    settlementId: settlement.id,
                    deductionType: 'ESCROW',
                    category: 'deduction',
                    description: `Previous negative balance applied (Settlement ${previousNegativeBalance.originalSettlement?.settlementNumber || 'N/A'})`,
                    amount: negativeBalanceDeduction,
                    metadata: { negativeBalanceId: previousNegativeBalance.id },
                },
            });
        }

        // Persist Additions
        for (const addition of additions) {
            await prisma.settlementDeduction.create({
                data: {
                    settlementId: settlement.id,
                    deductionType: addition.type as any,
                    category: 'addition',
                    description: addition.description,
                    amount: addition.amount,
                    loadExpenseId: addition.reference?.startsWith('expense_') ? addition.reference.replace('expense_', '') : undefined,
                    metadata: addition.metadata,
                },
            });
        }

        // Persist Deductions
        const additionTypes = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'];
        for (const deduction of deductions) {
            if (additionTypes.includes(deduction.type)) continue;

            await prisma.settlementDeduction.create({
                data: {
                    settlementId: settlement.id,
                    deductionType: deduction.type as any,
                    category: 'deduction',
                    description: deduction.description,
                    amount: deduction.amount,
                    fuelEntryId: deduction.reference?.startsWith('fuel_') ? deduction.reference.replace('fuel_', '') : undefined,
                    driverAdvanceId: deduction.reference?.startsWith('advance_') ? deduction.reference.replace('advance_', '') : undefined,
                    loadExpenseId: deduction.reference?.startsWith('expense_') ? deduction.reference.replace('expense_', '') : undefined,
                    metadata: deduction.metadata,
                },
            });
        }

        if (advances.length > 0) {
            await this.advanceManager.markAdvancesDeducted(advances.map((a) => a.id), settlement.id);
        }

        await prisma.activityLog.create({
            data: {
                companyId: driver.companyId,
                action: 'SETTLEMENT_GENERATED',
                entityType: 'Settlement',
                entityId: settlement.id,
                description: `Settlement ${settlementNumber} generated for ${driver.user?.firstName ?? ''} ${driver.user?.lastName ?? ''}`,
                metadata: { grossPay, totalAdditions, totalDeductions, totalAdvances, netPay, loadCount: loads.length },
            },
        });

        try { await UsageManager.trackUsage(driver.companyId, 'SETTLEMENTS_GENERATED'); } catch (e) { logger.error('Failed to track settlement usage', { error: e instanceof Error ? e.message : String(e) }); }

        return await prisma.settlement.findUnique({
            where: { id: settlement.id },
            include: {
                driver: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                deductionItems: true,
                driverAdvances: true,
            },
        });
    }

    async recalculateSettlement(settlementId: string): Promise<any> {
        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: { driver: true },
        });

        if (!settlement || settlement.status === 'PAID') throw new Error('Cannot recalculate');

        // Snapshot current calculation for audit trail before overwriting
        const previousSnapshot = settlement.calculationLog ? {
            ...(settlement.calculationLog as Record<string, any>),
            snapshotReason: 'recalculation',
            snapshotAt: new Date().toISOString(),
            previousGrossPay: settlement.grossPay,
            previousNetPay: settlement.netPay,
            previousDeductions: settlement.deductions,
        } : null;

        const loads = await prisma.load.findMany({
            where: { id: { in: settlement.loadIds }, deletedAt: null },
            include: {
                accessorialCharges: { where: { status: { in: ['APPROVED', 'BILLED'] } } },
                loadExpenses: { where: { approvalStatus: 'APPROVED', expenseType: { in: ['TOLL', 'SCALE'] } } },
            },
        });

        const preview = await this.calculationEngine.calculateSettlementPreview(settlement.driverId, loads, settlement.periodStart, settlement.periodEnd);
        const { grossPay, netPay, totalDeductions, totalAdditions, totalAdvances, additions, deductions, advances, negativeBalanceDeduction, previousNegativeBalance, auditLog } = preview;

        await (prisma.settlement as any).update({
            where: { id: settlementId },
            data: {
                grossPay,
                deductions: totalDeductions + negativeBalanceDeduction,
                advances: totalAdvances,
                netPay: netPay < 0 ? 0 : netPay,
                carriedForwardAmount: netPay < 0 ? Math.abs(netPay) : 0,
                calculatedAt: new Date(),
                calculationLog: auditLog as any,
                ...(previousSnapshot ? {
                    calculationHistory: { push: previousSnapshot },
                } : {}),
            },
        });

        const existingNegativeBalance = await prisma.driverNegativeBalance.findFirst({ where: { originalSettlementId: settlementId } });
        if (netPay < 0) {
            if (existingNegativeBalance) {
                await prisma.driverNegativeBalance.update({ where: { id: existingNegativeBalance.id }, data: { amount: Math.abs(netPay) } });
            } else {
                await prisma.driverNegativeBalance.create({ data: { driverId: settlement.driverId, amount: Math.abs(netPay), originalSettlementId: settlementId } });
            }
        } else if (existingNegativeBalance && !existingNegativeBalance.isApplied) {
            await prisma.driverNegativeBalance.delete({ where: { id: existingNegativeBalance.id } });
        }

        await prisma.settlementDeduction.deleteMany({ where: { settlementId } });

        // Persist Additions (with references)
        for (const addition of additions) {
            await prisma.settlementDeduction.create({
                data: {
                    settlementId,
                    deductionType: addition.type as any,
                    category: 'addition',
                    description: addition.description,
                    amount: addition.amount,
                    loadExpenseId: addition.reference?.startsWith('expense_') ? addition.reference.replace('expense_', '') : undefined,
                    metadata: addition.metadata,
                },
            });
        }

        // Persist Deductions (with references including advance links)
        const additionTypes = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'];
        for (const deduction of deductions) {
            if (additionTypes.includes(deduction.type)) continue;
            await prisma.settlementDeduction.create({
                data: {
                    settlementId,
                    deductionType: deduction.type as any,
                    category: 'deduction',
                    description: deduction.description,
                    amount: deduction.amount,
                    fuelEntryId: deduction.reference?.startsWith('fuel_') ? deduction.reference.replace('fuel_', '') : undefined,
                    driverAdvanceId: deduction.reference?.startsWith('advance_') ? deduction.reference.replace('advance_', '') : undefined,
                    loadExpenseId: deduction.reference?.startsWith('expense_') ? deduction.reference.replace('expense_', '') : undefined,
                    metadata: deduction.metadata,
                },
            });
        }

        if (previousNegativeBalance) {
            await prisma.settlementDeduction.create({
                data: {
                    settlementId,
                    deductionType: 'ESCROW',
                    category: 'deduction',
                    description: `Previous negative balance applied (Settlement ${previousNegativeBalance.originalSettlement?.settlementNumber || 'N/A'})`,
                    amount: negativeBalanceDeduction,
                    metadata: { negativeBalanceId: previousNegativeBalance.id }
                }
            });
        }

        return await prisma.settlement.findUnique({ where: { id: settlementId }, include: { deductionItems: true } });
    }
}
