/**
 * SettlementRuleProcessor
 * 
 * Split from SettlementCalculationEngine
 * Handles logic for calculating additions and deductions based on rules and load data.
 */

import { prisma } from '@/lib/prisma';
import { AdditionItem, DeductionItem } from './types';

export class SettlementRuleProcessor {
    /**
     * Calculate additions based on accessorials, reimbursements, and deduction rules
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
            // STOP PAY
            const stopCharges = load.accessorialCharges?.filter((c: any) => c.chargeType === 'ADDITIONAL_STOP') || [];
            for (const charge of stopCharges) {
                additions.push({
                    type: 'STOP_PAY',
                    description: `Stop pay: ${charge.description || 'Additional stop'}`,
                    amount: charge.amount || 0,
                    reference: `accessorial_${charge.id}`,
                });
            }

            // DETENTION PAY
            const detentionCharges = load.accessorialCharges?.filter((c: any) => c.chargeType === 'DETENTION') || [];
            for (const charge of detentionCharges) {
                additions.push({
                    type: 'DETENTION_PAY',
                    description: `Detention pay: ${charge.description || `${charge.detentionHours || 0} hours`}`,
                    amount: charge.amount || 0,
                    reference: `accessorial_${charge.id}`,
                });
            }

            // REIMBURSEMENTS
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
                if (this.shouldSkipRule(rule, driver)) continue;
                if (rule.minGrossPay && grossPay < rule.minGrossPay) continue;

                let additionAmount = this.calculateAmount(rule, grossPay, loads);
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
     * Calculate deductions based on recurring rules and garnishments
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

        // FETCH ALL APPLICABLE RULES (RECURRING + GARNISHMENTS)
        const rules = await prisma.deductionRule.findMany({
            where: {
                companyId: driver.companyId,
                isActive: true,
                isAddition: false,
                OR: [
                    { driverType: null, driverId: null },
                    { driverType: driver.driverType, driverId: null },
                    { driverId },
                ],
            },
        });

        for (const rule of rules) {
            if (this.shouldSkipRule(rule, driver)) continue;
            if (rule.minGrossPay && grossPay < rule.minGrossPay) continue;

            let deductionAmount = this.calculateAmount(rule, grossPay, loads);
            if (rule.maxAmount && deductionAmount > rule.maxAmount) deductionAmount = rule.maxAmount;

            // Apply goal amount logic (don't exceed total total)
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
}
