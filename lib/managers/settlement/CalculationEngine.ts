import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '../DriverAdvanceManager';
import {
    AdditionItem,
    DeductionItem,
    SettlementCalculatedValues,
    LoadAuditLog,
    SettlementAuditLog
} from './types';

export class SettlementCalculationEngine {
    private advanceManager: DriverAdvanceManager;

    constructor() {
        this.advanceManager = new DriverAdvanceManager();
    }

    /**
     * Calculate settlement values without persisting (Preview/Draft Mode)
     */
    async calculateSettlementPreview(
        driverId: string,
        loads: any[],
        periodStart: Date,
        periodEnd: Date
    ): Promise<SettlementCalculatedValues> {
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            include: { user: true }
        });

        if (!driver) throw new Error('Driver not found');

        const { amount: grossPay, logs: loadLogs } = await this.calculateGrossPay(driver, loads);
        const additions = await this.calculateAdditions(driverId, loads, grossPay, periodStart, periodEnd);
        const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

        const advances = await this.advanceManager.getAdvancesForSettlement(
            driverId,
            periodStart,
            periodEnd
        );
        const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

        const deductions = await this.calculateDeductions(
            driverId,
            loads,
            grossPay,
            periodStart,
            periodEnd
        );
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

        const previousNegativeBalance = await this.getPreviousNegativeBalance(driverId);
        const negativeBalanceDeduction = previousNegativeBalance ? previousNegativeBalance.amount : 0;

        const netPay = grossPay + totalAdditions - totalDeductions - totalAdvances - negativeBalanceDeduction;

        const auditLog: SettlementAuditLog = {
            version: '1.0',
            calculatedAt: new Date().toISOString(),
            driverPayType: driver.payType || 'UNKNOWN',
            driverPayRate: driver.payRate || 0,
            loads: loadLogs,
            additions,
            deductions,
            advances: advances.map(a => ({ ...a, amount: a.amount })), // Simple copy
            grossPay,
            netPay
        };

        return {
            grossPay,
            netPay,
            totalDeductions,
            totalAdditions,
            totalAdvances,
            additions,
            deductions,
            advances,
            negativeBalanceDeduction,
            previousNegativeBalance,
            auditLog,
        };
    }

    /**
     * Calculate gross pay with STRICT hierarchy
     */
    async calculateGrossPay(driver: any, loads: any[]): Promise<{ amount: number, logs: LoadAuditLog[] }> {
        let grossPay = 0;
        const logs: LoadAuditLog[] = [];

        for (const load of loads) {
            let loadPay = 0;
            const logEntry: Partial<LoadAuditLog> = {
                loadId: load.id,
                loadNumber: load.loadNumber,
                deliveryDate: load.deliveryDate ? new Date(load.deliveryDate).toISOString() : '',
                payType: driver.payType,
                payRate: driver.payRate,
                loadedMiles: load.loadedMiles || 0,
                emptyMiles: load.emptyMiles || 0,
                totalMiles: (load.loadedMiles || 0) + (load.emptyMiles || 0),
                revenue: load.revenue || 0,
                fuelSurcharge: 0,
            };

            if (load.driverPay && load.driverPay > 0) {
                loadPay = load.driverPay;
                logEntry.appliedRule = "Manual Override";
            } else {
                switch (driver.payType) {
                    case 'PER_MILE': {
                        const loadedMiles = load.loadedMiles || 0;
                        const emptyMiles = load.emptyMiles || 0;
                        const totalMiles = loadedMiles + emptyMiles;
                        if (totalMiles > 0) {
                            loadPay = totalMiles * driver.payRate;
                            logEntry.appliedRule = "Per Mile Calculation";
                        }
                        break;
                    }

                    case 'PERCENTAGE': {
                        let invoiceTotal = 0;
                        let fuelSurcharge = 0;

                        const invoices = await prisma.invoice.findMany({
                            where: { loadIds: { has: load.id } },
                            include: {
                                accessorialCharges: {
                                    where: {
                                        chargeType: 'FUEL_SURCHARGE',
                                        status: { in: ['APPROVED', 'BILLED'] },
                                    },
                                    select: { amount: true },
                                },
                            },
                        });

                        if (invoices.length > 0) {
                            invoiceTotal = invoices.reduce((sum: number, inv: any) => sum + (inv.subtotal || inv.total || 0), 0);
                            fuelSurcharge = invoices.reduce((sum: number, inv: any) => {
                                const fsc = inv.accessorialCharges?.reduce((fscSum: number, charge: any) =>
                                    fscSum + (charge.amount || 0), 0) || 0;
                                return sum + fsc;
                            }, 0);
                        } else {
                            invoiceTotal = load.revenue || 0;
                            const fscCharges = load.accessorialCharges?.filter((c: any) => c.chargeType === 'FUEL_SURCHARGE') || [];
                            fuelSurcharge = fscCharges.reduce((sum: number, charge: any) => sum + (charge.amount || 0), 0);
                        }

                        const baseAmount = invoiceTotal - fuelSurcharge;
                        loadPay = baseAmount * (driver.payRate / 100);

                        logEntry.revenue = invoiceTotal;
                        logEntry.fuelSurcharge = fuelSurcharge;
                        logEntry.appliedRule = "Percentage Calculation (Revenue - FSC)";
                        break;
                    }

                    case 'PER_LOAD': {
                        loadPay = driver.payRate;
                        logEntry.appliedRule = "Per Load Flat Rate";
                        break;
                    }

                    case 'HOURLY': {
                        const totalMiles = (load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0;
                        const estimatedHours = totalMiles > 0 ? totalMiles / 50 : 10;
                        loadPay = estimatedHours * driver.payRate;
                        logEntry.appliedRule = `Hourly Estimate (${estimatedHours.toFixed(2)} hrs @ 50mph)`;
                        break;
                    }
                }
            }

            logEntry.calculatedPay = loadPay;
            logs.push(logEntry as LoadAuditLog);
            grossPay += loadPay;
        }

        if (driver.payType === 'WEEKLY' && loads.length > 0) {
            grossPay = driver.payRate;
            logs.push({
                loadId: 'WEEKLY_SALARY',
                loadNumber: 'SALARY',
                deliveryDate: new Date().toISOString(),
                payType: 'WEEKLY',
                payRate: driver.payRate,
                loadedMiles: 0,
                emptyMiles: 0,
                totalMiles: 0,
                revenue: 0,
                fuelSurcharge: 0,
                calculatedPay: driver.payRate,
                appliedRule: "Weekly Salary"
            });
        }

        return { amount: grossPay, logs };
    }

    /**
     * Calculate additions
     */
    async calculateAdditions(
        driverId: string,
        loads: any[],
        grossPay: number,
        periodStart: Date,
        periodEnd: Date
    ): Promise<AdditionItem[]> {
        const additions: AdditionItem[] = [];

        for (const load of loads) {
            const stopCharges = load.accessorialCharges?.filter((c: any) => c.chargeType === 'ADDITIONAL_STOP') || [];
            for (const charge of stopCharges) {
                additions.push({
                    type: 'STOP_PAY',
                    description: `Stop pay: ${charge.description || 'Additional stop'}`,
                    amount: charge.amount || 0,
                    reference: `accessorial_${charge.id}`,
                });
            }

            const detentionCharges = load.accessorialCharges?.filter((c: any) => c.chargeType === 'DETENTION') || [];
            for (const charge of detentionCharges) {
                additions.push({
                    type: 'DETENTION_PAY',
                    description: `Detention pay: ${charge.description || `${charge.detentionHours || 0} hours`}`,
                    amount: charge.amount || 0,
                    reference: `accessorial_${charge.id}`,
                });
            }

            const reimbursements = load.loadExpenses?.filter((e: any) => e.expenseType === 'TOLL' || e.expenseType === 'SCALE') || [];
            for (const expense of reimbursements) {
                additions.push({
                    type: 'REIMBURSEMENT',
                    description: `Reimbursement: ${expense.expenseType} - ${expense.description || expense.vendor || 'N/A'}`,
                    amount: expense.amount || 0,
                    reference: `expense_${expense.id}`,
                });
            }
        }

        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: { companyId: true, driverType: true, driverNumber: true },
        });

        if (driver) {
            const additionRules = await prisma.deductionRule.findMany({
                where: {
                    companyId: driver.companyId,
                    isActive: true,
                    isAddition: true,
                    deductionType: { in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] },
                    OR: [
                        { driverType: null, driverId: null },
                        { driverType: driver.driverType, driverId: null },
                        { driverId },
                    ],
                },
            });

            for (const rule of additionRules) {
                if (rule.name.startsWith('Driver ')) {
                    if (driver.driverNumber && !rule.name.includes(driver.driverNumber)) continue;
                }

                if (rule.minGrossPay && grossPay < rule.minGrossPay) continue;

                let additionAmount = 0;
                switch (rule.calculationType) {
                    case 'FIXED': additionAmount = rule.amount || 0; break;
                    case 'PERCENTAGE': additionAmount = grossPay * ((rule.percentage || 0) / 100); break;
                    case 'PER_MILE': {
                        const totalMiles = loads.reduce((sum, load) =>
                            sum + ((load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0), 0);
                        additionAmount = totalMiles * (rule.perMileRate || 0);
                        break;
                    }
                }

                if (rule.maxAmount && additionAmount > rule.maxAmount) additionAmount = rule.maxAmount;
                if (additionAmount > 0) {
                    additions.push({
                        type: rule.deductionType,
                        description: rule.name,
                        amount: additionAmount,
                        reference: `deduction_rule_${rule.id}`,
                        metadata: { deductionRuleId: rule.id },
                    });
                }
            }
        }

        return additions;
    }

    /**
     * Calculate deductions
     */
    async calculateDeductions(
        driverId: string,
        loads: any[],
        grossPay: number,
        periodStart: Date,
        periodEnd: Date
    ): Promise<DeductionItem[]> {
        const deductions: DeductionItem[] = [];
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: { companyId: true, driverType: true, driverNumber: true },
        });

        if (!driver) return deductions;

        const recurringRules = await prisma.deductionRule.findMany({
            where: {
                companyId: driver.companyId,
                isActive: true,
                isAddition: false,
                deductionType: { in: ['INSURANCE', 'OCCUPATIONAL_ACCIDENT', 'FUEL_CARD_FEE'] },
                NOT: { deductionType: { in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] } },
                OR: [
                    { driverType: null, driverId: null },
                    { driverType: driver.driverType, driverId: null },
                    { driverId },
                ],
            },
        });

        for (const rule of recurringRules) {
            if (this.shouldSkipRule(rule, driver)) continue;
            if (rule.minGrossPay && grossPay < rule.minGrossPay) continue;

            let deductionAmount = this.calculateAmount(rule, grossPay, loads);
            if (rule.maxAmount && deductionAmount > rule.maxAmount) deductionAmount = rule.maxAmount;
            deductionAmount = this.applyGoalAmount(rule, deductionAmount);

            if (deductionAmount > 0) {
                deductions.push({
                    type: rule.deductionType,
                    description: rule.name,
                    amount: deductionAmount,
                    metadata: { deductionRuleId: rule.id },
                });
            }
        }

        const garnishmentRules = await prisma.deductionRule.findMany({
            where: {
                companyId: driver.companyId,
                isActive: true,
                isAddition: false,
                deductionType: { in: ['ESCROW', 'OTHER'] },
                NOT: { deductionType: { in: ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] } },
                OR: [
                    { driverType: null, driverId: null },
                    { driverType: driver.driverType, driverId: null },
                    { driverId },
                ],
            },
        });

        for (const rule of garnishmentRules) {
            if (this.shouldSkipRule(rule, driver)) continue;
            if (rule.minGrossPay && grossPay < rule.minGrossPay) continue;

            let deductionAmount = this.calculateAmount(rule, grossPay, loads);
            if (rule.maxAmount && deductionAmount > rule.maxAmount) deductionAmount = rule.maxAmount;
            deductionAmount = this.applyGoalAmount(rule, deductionAmount);

            if (deductionAmount > 0) {
                deductions.push({
                    type: rule.deductionType,
                    description: rule.name,
                    amount: deductionAmount,
                    metadata: { deductionRuleId: rule.id },
                });
            }
        }

        return deductions;
    }

    private shouldSkipRule(rule: any, driver: any): boolean {
        const driverNumberPattern = /DRV-[A-Z]{2}-[A-Z]+-\d+/g;
        const matchedDriverNumbers = rule.name.match(driverNumberPattern);
        if (matchedDriverNumbers && matchedDriverNumbers.length > 0) {
            return !matchedDriverNumbers.some((num: string) => num === driver.driverNumber);
        }
        return false;
    }

    private calculateAmount(rule: any, grossPay: number, loads: any[]): number {
        switch (rule.calculationType) {
            case 'FIXED': return rule.amount || 0;
            case 'PERCENTAGE': return grossPay * ((rule.percentage || 0) / 100);
            case 'PER_MILE': {
                const totalMiles = loads.reduce((sum, load) =>
                    sum + ((load.loadedMiles || 0) + (load.emptyMiles || 0) || load.totalMiles || 0), 0);
                return totalMiles * (rule.perMileRate || 0);
            }
            default: return 0;
        }
    }

    private applyGoalAmount(rule: any, deductionAmount: number): number {
        if (typeof rule.goalAmount === 'number' && rule.goalAmount > 0) {
            const currentBalance = rule.currentAmount || 0;
            if (currentBalance >= rule.goalAmount) return 0;
            if (currentBalance + deductionAmount > rule.goalAmount) {
                return rule.goalAmount - currentBalance;
            }
        }
        return deductionAmount;
    }

    async getPreviousNegativeBalance(driverId: string): Promise<any | null> {
        return await (prisma as any).driverNegativeBalance.findFirst({
            where: { driverId, isApplied: false },
            include: {
                originalSettlement: { select: { settlementNumber: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
