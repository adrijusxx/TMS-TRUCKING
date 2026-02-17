/**
 * LoadProfitabilityAnalyzer
 * 
 * Split from LoadCostingManager
 * Handles aggregate profitability analysis and projections across multiple loads.
 */

import { prisma } from '@/lib/prisma';
import { LoadCostCalculator, CostBreakdown } from './LoadCostCalculator';

export class LoadProfitabilityAnalyzer {
    private calculator: LoadCostCalculator;

    constructor() {
        this.calculator = new LoadCostCalculator();
    }

    /**
     * Get profitability summary for a date range
     */
    async getProfitabilitySummary(
        mcWhere: Record<string, any>,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalRevenue: number;
        totalCosts: number;
        totalProfit: number;
        averageMargin: number;
        loadCount: number;
    }> {
        const loads = await prisma.load.findMany({
            where: {
                ...mcWhere,
                deliveredAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: {
                    in: ['DELIVERED', 'INVOICED', 'PAID'],
                },
                deletedAt: null,
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

        let totalRevenue = 0;
        let totalCosts = 0;
        let totalProfit = 0;

        for (const load of loads) {
            const expenses = load.loadExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const accessorials = load.accessorialCharges.reduce(
                (sum, charge) => sum + charge.amount,
                0
            );

            const revenue = load.revenue + accessorials;
            const costs = (load.driverPay || 0) + (load.fuelAdvance || 0) + expenses;
            const profit = revenue - costs;

            totalRevenue += revenue;
            totalCosts += costs;
            totalProfit += profit;
        }

        const averageMargin =
            totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalCosts,
            totalProfit,
            averageMargin,
            loadCount: loads.length,
        };
    }

    /**
     * Get most profitable loads
     */
    async getMostProfitableLoads(
        mcWhere: Record<string, any>,
        limit: number = 10
    ): Promise<CostBreakdown[]> {
        const loads = await prisma.load.findMany({
            where: {
                ...mcWhere,
                status: {
                    in: ['DELIVERED', 'INVOICED', 'PAID'],
                },
                netProfit: {
                    not: null,
                },
                deletedAt: null,
            },
            orderBy: {
                netProfit: 'desc',
            },
            take: limit,
            select: {
                id: true,
            },
        });

        const breakdowns: CostBreakdown[] = [];
        for (const load of loads) {
            try {
                const breakdown = await this.calculator.getCostBreakdown(load.id);
                breakdowns.push(breakdown);
            } catch (error) {
                console.error(`Failed to get breakdown for load ${load.id}:`, error);
            }
        }

        return breakdowns;
    }

    /**
     * Get least profitable loads (potential issues)
     */
    async getLeastProfitableLoads(
        mcWhere: Record<string, any>,
        limit: number = 10
    ): Promise<CostBreakdown[]> {
        const loads = await prisma.load.findMany({
            where: {
                ...mcWhere,
                status: {
                    in: ['DELIVERED', 'INVOICED', 'PAID'],
                },
                netProfit: {
                    not: null,
                },
                deletedAt: null,
            },
            orderBy: {
                netProfit: 'asc',
            },
            take: limit,
            select: {
                id: true,
            },
        });

        const breakdowns: CostBreakdown[] = [];
        for (const load of loads) {
            try {
                const breakdown = await this.calculator.getCostBreakdown(load.id);
                breakdowns.push(breakdown);
            } catch (error) {
                console.error(`Failed to get breakdown for load ${load.id}:`, error);
            }
        }

        return breakdowns;
    }

    /**
     * Calculate projected profit based on fleet-wide averages
     */
    async calculateProjectedProfit(loadId: string): Promise<{
        projectedFuel: number;
        projectedMaintenance: number;
        projectedTotalCost: number;
        projectedNetProfit: number;
        projectedMargin: number;
    }> {
        const load = await prisma.load.findUnique({
            where: {
                id: loadId,
                deletedAt: null
            },
            include: {
                company: {
                    include: {
                        systemConfig: true,
                    },
                },
            },
        });

        if (!load || !load.company.systemConfig) {
            throw new Error('Load or system configuration not found');
        }

        const config = load.company.systemConfig;
        const totalMiles = load.totalMiles || load.loadedMiles || 0;

        // 1. Projected Fuel Cost
        const fuelPrice = config.averageFuelPrice || 0;
        const mpg = config.averageMpg || 1; // Avoid division by zero
        const projectedFuel = (totalMiles / mpg) * fuelPrice;

        // 2. Projected Maintenance Cost
        const projectedMaintenance = totalMiles * (config.maintenanceCpm || 0);

        // 3. Fixed Costs (Daily)
        // We assume 1 day for a typical load if not multi-day
        const fixedCosts = config.fixedCostPerDay || 0;

        // 4. Actual/Committed Costs
        const driverPay = load.driverPay || 0;

        // Total Projected Cost
        const projectedTotalCost = projectedFuel + projectedMaintenance + fixedCosts + driverPay;

        // Projected Net Profit
        const projectedNetProfit = load.revenue - projectedTotalCost;
        const projectedMargin = load.revenue > 0 ? (projectedNetProfit / load.revenue) * 100 : 0;

        return {
            projectedFuel,
            projectedMaintenance,
            projectedTotalCost,
            projectedNetProfit,
            projectedMargin,
        };
    }
}
