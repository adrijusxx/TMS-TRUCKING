import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '../DriverAdvanceManager';
import { SettlementRuleProcessor } from './RuleProcessor';
import {
    SettlementCalculatedValues,
    LoadAuditLog,
    SettlementAuditLog,
    DriverNegativeBalance,
    AdvanceItem
} from './types';

export class SettlementCalculationEngine {
    private advanceManager: DriverAdvanceManager;
    private ruleProcessor: SettlementRuleProcessor;

    constructor() {
        this.advanceManager = new DriverAdvanceManager();
        this.ruleProcessor = new SettlementRuleProcessor();
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
            where: {
                id: driverId,
                deletedAt: null
            },
            include: { user: true }
        });

        if (!driver) throw new Error('Driver not found');

        const { amount: grossPay, logs: loadLogs } = await this.calculateGrossPay(driver, loads);

        const additions = await this.ruleProcessor.calculateAdditions(
            driverId,
            loads,
            grossPay,
            periodStart,
            periodEnd
        );
        const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

        const advancesRaw = await this.advanceManager.getAdvancesForSettlement(
            driverId,
            periodStart,
            periodEnd
        );
        // Cast to typed items
        const advances: AdvanceItem[] = advancesRaw.map(a => ({
            id: a.id,
            advanceNumber: a.advanceNumber,
            amount: a.amount,
            requestDate: a.requestDate,
            notes: a.notes
        }));
        const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

        const deductions = await this.ruleProcessor.calculateDeductions(
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
            advances,
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
                        const totalMiles = (load.loadedMiles || 0) + (load.emptyMiles || 0);
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
                            where: { loadIds: { has: load.id }, deletedAt: null },
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
                            invoiceTotal = invoices.reduce((sum, inv) => sum + (inv.subtotal || inv.total || 0), 0);
                            fuelSurcharge = invoices.reduce((sum, inv) => {
                                const fsc = inv.accessorialCharges?.reduce((fscSum, charge) =>
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

    async getPreviousNegativeBalance(driverId: string): Promise<DriverNegativeBalance | null> {
        const result = await (prisma as any).driverNegativeBalance.findFirst({
            where: { driverId, isApplied: false },
            include: {
                originalSettlement: { select: { settlementNumber: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!result) return null;

        return {
            id: result.id,
            amount: result.amount,
            createdAt: result.createdAt,
            originalSettlement: result.originalSettlement ? {
                settlementNumber: result.originalSettlement.settlementNumber
            } : undefined
        };
    }
}
