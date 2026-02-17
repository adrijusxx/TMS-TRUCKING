/**
 * LoadCostCalculator
 * 
 * Split from LoadCostingManager
 * Handles granular cost calculations for individual loads or batches.
 */

import { prisma } from '@/lib/prisma';

export interface LoadCost {
    loadId: string;
    revenue: number;
    driverPay: number;
    fuelCosts: number;
    expenses: number;
    accessorialCharges: number;
    totalCost: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
}

export interface CostBreakdown {
    loadId: string;
    loadNumber: string;
    revenue: number;
    costs: {
        driverPay: number;
        fuel: number;
        tolls: number;
        permits: number;
        lumper: number;
        detention: number;
        other: number;
    };
    accessorialRevenue: number;
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
}

export class LoadCostCalculator {
    /**
     * Calculate total load cost
     */
    async calculateLoadCost(loadId: string): Promise<LoadCost> {
        const load = await prisma.load.findUnique({
            where: {
                id: loadId,
                deletedAt: null
            },
            include: {
                loadExpenses: {
                    where: {
                        approvalStatus: 'APPROVED',
                    },
                },
                accessorialCharges: {
                    where: {
                        status: {
                            in: ['APPROVED', 'BILLED'],
                        },
                    },
                },
                driverAdvances: {
                    where: {
                        approvalStatus: 'APPROVED',
                    },
                },
            },
        });

        if (!load) {
            throw new Error('Load not found');
        }

        // Calculate expenses
        const expenses = load.loadExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate accessorial charges (additional revenue)
        const accessorialCharges = load.accessorialCharges.reduce(
            (sum, charge) => sum + charge.amount,
            0
        );

        // Calculate fuel costs from fuel advance
        const fuelCosts = load.fuelAdvance || 0;

        // Total costs
        const totalCost = (load.driverPay || 0) + fuelCosts + expenses;

        // Revenue including accessorials
        const totalRevenue = load.revenue + accessorialCharges;

        // Profit calculations
        const grossProfit = totalRevenue - totalCost;
        const netProfit = grossProfit; // Can add additional deductions here
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // Update load with calculated values
        await prisma.load.update({
            where: { id: loadId },
            data: {
                totalExpenses: expenses,
                netProfit,
            },
        });

        return {
            loadId,
            revenue: load.revenue,
            driverPay: load.driverPay || 0,
            fuelCosts,
            expenses,
            accessorialCharges,
            totalCost,
            grossProfit,
            netProfit,
            profitMargin,
        };
    }

    /**
     * Calculate load profitability
     */
    async calculateProfitability(loadId: string): Promise<number> {
        const cost = await this.calculateLoadCost(loadId);
        return cost.netProfit;
    }

    /**
     * Get detailed cost breakdown
     */
    async getCostBreakdown(loadId: string): Promise<CostBreakdown> {
        const load = await prisma.load.findUnique({
            where: {
                id: loadId,
                deletedAt: null
            },
            include: {
                loadExpenses: {
                    where: {
                        approvalStatus: 'APPROVED',
                    },
                },
                accessorialCharges: {
                    where: {
                        status: {
                            in: ['APPROVED', 'BILLED'],
                        },
                    },
                },
            },
        });

        if (!load) {
            throw new Error('Load not found');
        }

        // Categorize expenses
        const costs = {
            driverPay: load.driverPay || 0,
            fuel: load.fuelAdvance || 0,
            tolls: 0,
            permits: 0,
            lumper: 0,
            detention: 0,
            other: 0,
        };

        // Categorize each expense
        load.loadExpenses.forEach((expense) => {
            switch (expense.expenseType) {
                case 'TOLL':
                    costs.tolls += expense.amount;
                    break;
                case 'PERMIT':
                    costs.permits += expense.amount;
                    break;
                case 'LUMPER':
                    costs.lumper += expense.amount;
                    break;
                case 'DETENTION':
                    costs.detention += expense.amount;
                    break;
                default:
                    costs.other += expense.amount;
            }
        });

        // Calculate accessorial revenue
        const accessorialRevenue = load.accessorialCharges.reduce(
            (sum, charge) => sum + charge.amount,
            0
        );

        const totalRevenue = load.revenue + accessorialRevenue;
        const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        const grossProfit = totalRevenue - totalCosts;
        const netProfit = grossProfit;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            loadId,
            loadNumber: load.loadNumber,
            revenue: load.revenue,
            costs,
            accessorialRevenue,
            totalRevenue,
            totalCosts,
            grossProfit,
            netProfit,
            profitMargin,
        };
    }

    /**
     * Get load margin percentage
     */
    async getLoadMargin(loadId: string): Promise<number> {
        const cost = await this.calculateLoadCost(loadId);
        return cost.profitMargin;
    }

    /**
     * Calculate profitability for multiple loads
     */
    async calculateBatchProfitability(loadIds: string[]): Promise<LoadCost[]> {
        const results: LoadCost[] = [];

        for (const loadId of loadIds) {
            try {
                const cost = await this.calculateLoadCost(loadId);
                results.push(cost);
            } catch (error) {
                console.error(`Failed to calculate cost for load ${loadId}:`, error);
            }
        }

        return results;
    }
}
