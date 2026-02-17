import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';

// Industry benchmarks for carrier operations
const BENCHMARKS = {
    // Staffing ratios (per N trucks/drivers)
    dispatchersPerTruck: { ideal: 7, warning: 10, label: 'Dispatchers' },
    safetyManagersPerDriver: { ideal: 50, warning: 75, label: 'Safety Managers' },
    accountingStaffPerTruck: { ideal: 40, warning: 60, label: 'Accounting Staff' },
    hrStaffPerDriver: { ideal: 75, warning: 100, label: 'HR Staff' },
    maintenanceTechsPerTruck: { ideal: 15, warning: 20, label: 'Maintenance Techs' },
    fleetManagersPerTruck: { ideal: 50, warning: 75, label: 'Fleet Managers' },
    recruitersPerOpenPosition: { ideal: 20, warning: 30, label: 'Recruiters' },
    // Financial benchmarks
    grossMarginTarget: 0.20, // 20% gross margin
    operatingRatioTarget: 0.92, // 92 cents per dollar
    rpmTarget: 2.50,
    emptyMilePercentTarget: 0.12, // 12% of total miles
    driverPayPercentTarget: 0.35, // 35% of revenue
    fuelCostPerMileTarget: 0.65,
    maintenanceCostPerMileTarget: 0.15,
    revenuePerTruckPerMonth: 15000,
    loadsPerTruckPerMonth: 8,
};

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        const role = (session.user as any)?.role || 'CUSTOMER';
        if (!(await hasPermissionAsync(role, 'analytics.view'))) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const loadMcWhere = await buildMcNumberWhereClause(session, request);
        const entityFilter = await buildMcNumberIdWhereClause(session, request);
        const companyId = session.user.companyId;

        // Parallel data fetch
        const [
            totalTrucks, totalDrivers, totalLoads, totalUsers,
            loadAggregates, systemConfig,
            driversByStatus, trucksByStatus,
            usersByRole, recentLoads30d, recentLoads90d
        ] = await Promise.all([
            prisma.truck.count({ where: { ...entityFilter, isActive: true, deletedAt: null } }),
            prisma.driver.count({ where: { ...entityFilter, isActive: true, deletedAt: null } }),
            prisma.load.count({ where: { ...loadMcWhere, deletedAt: null } }),
            prisma.user.count({ where: { companyId, isActive: true, deletedAt: null } }),
            prisma.load.aggregate({
                where: { ...loadMcWhere, deletedAt: null },
                _sum: { revenue: true, driverPay: true, netProfit: true, totalMiles: true, loadedMiles: true, emptyMiles: true, totalExpenses: true, fuelAdvance: true },
                _avg: { revenue: true, driverPay: true, netProfit: true, totalMiles: true },
                _count: { _all: true },
            }),
            prisma.systemConfig.findUnique({ where: { companyId } }),
            // Drivers grouped by status
            prisma.driver.groupBy({
                by: ['status'],
                where: { ...entityFilter, isActive: true, deletedAt: null },
                _count: true,
            }),
            // Trucks grouped by status
            prisma.truck.groupBy({
                by: ['status'],
                where: { ...entityFilter, isActive: true, deletedAt: null },
                _count: true,
            }),
            // Users grouped by role
            prisma.user.groupBy({
                by: ['role'],
                where: { companyId, isActive: true, deletedAt: null },
                _count: true,
            }),
            // Last 30 days loads
            prisma.load.aggregate({
                where: { ...loadMcWhere, deletedAt: null, pickupDate: { gte: new Date(Date.now() - 30 * 86400000) } },
                _sum: { revenue: true, driverPay: true, netProfit: true, totalMiles: true, emptyMiles: true, totalExpenses: true },
                _count: { _all: true },
            }),
            // Last 90 days loads
            prisma.load.aggregate({
                where: { ...loadMcWhere, deletedAt: null, pickupDate: { gte: new Date(Date.now() - 90 * 86400000) } },
                _sum: { revenue: true, driverPay: true, netProfit: true, totalMiles: true, emptyMiles: true, totalExpenses: true },
                _count: { _all: true },
            }),
        ]);

        // --- COMPUTED INSIGHTS ---
        const rev = Number(loadAggregates._sum?.revenue) || 0;
        const pay = Number(loadAggregates._sum?.driverPay) || 0;
        const miles = Number(loadAggregates._sum?.totalMiles) || 0;
        const emptyM = Number(loadAggregates._sum?.emptyMiles) || 0;
        const loadedM = Number(loadAggregates._sum?.loadedMiles) || 0;
        const expenses = Number(loadAggregates._sum?.totalExpenses) || 0;
        const profit = Number(loadAggregates._sum?.netProfit) || 0;
        const avgRev = Number(loadAggregates._avg?.revenue) || 0;
        const avgPay = Number(loadAggregates._avg?.driverPay) || 0;
        const count = (loadAggregates._count as any)?._all || totalLoads;

        const rev30 = Number(recentLoads30d._sum?.revenue) || 0;
        const pay30 = Number(recentLoads30d._sum?.driverPay) || 0;
        const miles30 = Number(recentLoads30d._sum?.totalMiles) || 0;
        const empty30 = Number(recentLoads30d._sum?.emptyMiles) || 0;
        const count30 = (recentLoads30d._count as any)?._all || 0

        // Financial KPIs
        const grossMargin = rev > 0 ? (rev - pay - expenses) / rev : 0;
        const operatingRatio = rev > 0 ? (pay + expenses) / rev : 1;
        const rpm = miles > 0 ? rev / miles : 0;
        const emptyMilePercent = miles > 0 ? emptyM / miles : 0;
        const driverPayPercent = rev > 0 ? pay / rev : 0;
        const revenuePerTruck = totalTrucks > 0 ? rev / totalTrucks : 0;
        const revenuePerDriver = totalDrivers > 0 ? rev / totalDrivers : 0;
        const loadsPerTruck = totalTrucks > 0 ? count / totalTrucks : 0;
        const loadsPerDriver = totalDrivers > 0 ? count / totalDrivers : 0;

        // Monthly extrapolations (from 30-day data)
        const monthlyRevenue = rev30;
        const monthlyProfit = rev30 - pay30 - (Number(recentLoads30d._sum?.totalExpenses) || 0);
        const loadsPerMonth = count30;
        const monthlyRevenuePerTruck = totalTrucks > 0 ? rev30 / totalTrucks : 0;
        const monthlyLoadsPerTruck = totalTrucks > 0 ? count30 / totalTrucks : 0;

        // Staffing Analysis
        const currentStaff = buildStaffMap(usersByRole);
        const staffingRecommendations = computeStaffing(totalTrucks, totalDrivers, currentStaff);

        // Cost Optimization Recommendations
        const costInsights = computeCostInsights({
            grossMargin, operatingRatio, rpm, emptyMilePercent, driverPayPercent,
            monthlyRevenuePerTruck, monthlyLoadsPerTruck, rev, pay, expenses,
            miles, emptyM, count, totalTrucks, totalDrivers,
            fuelPrice: systemConfig?.averageFuelPrice || 0,
            mpg: systemConfig?.averageMpg || 0,
        });

        // Driver & Truck Status breakdown
        const driverStatus: Record<string, number> = {};
        driversByStatus.forEach(d => { driverStatus[d.status] = d._count; });
        const truckStatus: Record<string, number> = {};
        trucksByStatus.forEach(t => { truckStatus[t.status] = t._count; });

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalLoads: count, totalTrucks, totalDrivers, totalUsers,
                    totalRevenue: round(rev), totalDriverPay: round(pay), totalExpenses: round(expenses),
                    totalProfit: round(profit), totalMiles: round(miles), totalEmptyMiles: round(emptyM),
                },
                kpis: {
                    grossMargin: round(grossMargin * 100),
                    operatingRatio: round(operatingRatio * 100),
                    rpm: round(rpm),
                    emptyMilePercent: round(emptyMilePercent * 100),
                    driverPayPercent: round(driverPayPercent * 100),
                    avgRevenuePerLoad: round(avgRev),
                    avgDriverPayPerLoad: round(avgPay),
                    revenuePerTruck: round(revenuePerTruck),
                    revenuePerDriver: round(revenuePerDriver),
                    loadsPerTruck: round(loadsPerTruck),
                    loadsPerDriver: round(loadsPerDriver),
                },
                monthly: {
                    revenue: round(monthlyRevenue),
                    profit: round(monthlyProfit),
                    loads: loadsPerMonth,
                    revenuePerTruck: round(monthlyRevenuePerTruck),
                    loadsPerTruck: round(monthlyLoadsPerTruck),
                },
                staffing: staffingRecommendations,
                costInsights,
                driverStatus,
                truckStatus,
                benchmarks: BENCHMARKS,
            },
        });
    } catch (error: any) {
        console.error('Deep insights error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to compute insights' } },
            { status: 500 }
        );
    }
}

function round(v: number) { return Math.round(v * 100) / 100; }

function buildStaffMap(usersByRole: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    usersByRole.forEach(u => { map[u.role] = u._count; });
    return map;
}

interface StaffRec { role: string; current: number; recommended: number; status: 'ok' | 'understaffed' | 'overstaffed'; note: string; }

function computeStaffing(trucks: number, drivers: number, staff: Record<string, number>): StaffRec[] {
    const recs: StaffRec[] = [];
    const fleet = Math.max(trucks, drivers, 1);

    const roles: { role: string; staffKey: string[]; per: number; basis: 'trucks' | 'drivers' }[] = [
        { role: 'Dispatchers', staffKey: ['DISPATCHER'], per: BENCHMARKS.dispatchersPerTruck.ideal, basis: 'trucks' },
        { role: 'Safety Managers', staffKey: ['SAFETY_MANAGER'], per: BENCHMARKS.safetyManagersPerDriver.ideal, basis: 'drivers' },
        { role: 'Accounting Staff', staffKey: ['ACCOUNTANT', 'BILLING'], per: BENCHMARKS.accountingStaffPerTruck.ideal, basis: 'trucks' },
        { role: 'HR Staff', staffKey: ['HR'], per: BENCHMARKS.hrStaffPerDriver.ideal, basis: 'drivers' },
        { role: 'Fleet Managers', staffKey: ['FLEET_MANAGER'], per: BENCHMARKS.fleetManagersPerTruck.ideal, basis: 'trucks' },
    ];

    for (const r of roles) {
        const basis = r.basis === 'trucks' ? trucks : drivers;
        const recommended = Math.max(1, Math.ceil(basis / r.per));
        const current = r.staffKey.reduce((sum, key) => sum + (staff[key] || 0), 0);
        let status: 'ok' | 'understaffed' | 'overstaffed' = 'ok';
        let note = '';

        if (current < recommended) {
            status = 'understaffed';
            note = `Consider hiring ${recommended - current} more. Industry standard: 1 per ${r.per} ${r.basis}.`;
        } else if (current > recommended * 1.5) {
            status = 'overstaffed';
            note = `You have ${current - recommended} more than the industry average. Review workload distribution.`;
        } else {
            note = `Well-staffed for your fleet size. Industry standard: 1 per ${r.per} ${r.basis}.`;
        }

        recs.push({ role: r.role, current, recommended, status, note });
    }

    // Admin / Owner (always need at least 1)
    const adminCount = (staff['ADMIN'] || 0) + (staff['SUPER_ADMIN'] || 0) + (staff['OWNER'] || 0);
    recs.push({
        role: 'Admin / Owner',
        current: adminCount,
        recommended: Math.max(1, Math.ceil(fleet / 100)),
        status: adminCount >= 1 ? 'ok' : 'understaffed',
        note: adminCount >= 1 ? 'Sufficient administrative oversight.' : 'Every operation needs at least 1 admin.',
    });

    return recs;
}

interface CostInput {
    grossMargin: number; operatingRatio: number; rpm: number; emptyMilePercent: number;
    driverPayPercent: number; monthlyRevenuePerTruck: number; monthlyLoadsPerTruck: number;
    rev: number; pay: number; expenses: number; miles: number; emptyM: number; count: number;
    totalTrucks: number; totalDrivers: number; fuelPrice: number; mpg: number;
}

interface CostAdvice { category: string; severity: 'critical' | 'warning' | 'good' | 'excellent'; title: string; detail: string; impact?: string; }

function computeCostInsights(d: CostInput): CostAdvice[] {
    const advice: CostAdvice[] = [];
    const B = BENCHMARKS;

    // 1. Gross Margin
    if (d.grossMargin < 0.10) {
        advice.push({
            category: 'Profitability', severity: 'critical', title: 'Critically Low Gross Margin',
            detail: `Your gross margin is ${(d.grossMargin * 100).toFixed(1)}% (target: ${(B.grossMarginTarget * 100)}%). You are barely covering costs.`,
            impact: `Increasing margin to ${(B.grossMarginTarget * 100)}% would add ~${formatUSD((B.grossMarginTarget - d.grossMargin) * d.rev)} in profit.`
        });
    } else if (d.grossMargin < B.grossMarginTarget) {
        advice.push({
            category: 'Profitability', severity: 'warning', title: 'Below-Target Gross Margin',
            detail: `Gross margin: ${(d.grossMargin * 100).toFixed(1)}% vs. ${(B.grossMarginTarget * 100)}% industry target.`,
            impact: `Closing the gap = ~${formatUSD((B.grossMarginTarget - d.grossMargin) * d.rev)} additional profit.`
        });
    } else {
        advice.push({
            category: 'Profitability', severity: 'excellent', title: 'Strong Gross Margin',
            detail: `${(d.grossMargin * 100).toFixed(1)}% exceeds the ${(B.grossMarginTarget * 100)}% target. Keep it up!`
        });
    }

    // 2. Empty Miles
    if (d.emptyMilePercent > 0.20) {
        const savingsPerPercent = d.miles * 0.01 * (d.fuelPrice > 0 && d.mpg > 0 ? d.fuelPrice / d.mpg : 0.65);
        advice.push({
            category: 'Empty Miles', severity: 'critical', title: 'Excessive Empty Miles',
            detail: `${(d.emptyMilePercent * 100).toFixed(1)}% empty miles (target: <${B.emptyMilePercentTarget * 100}%). This is costing you fuel and wear with no revenue.`,
            impact: `Reducing by 5% could save ~${formatUSD(savingsPerPercent * 5)} in fuel alone.`
        });
    } else if (d.emptyMilePercent > B.emptyMilePercentTarget) {
        advice.push({
            category: 'Empty Miles', severity: 'warning', title: 'Above-Average Empty Miles',
            detail: `${(d.emptyMilePercent * 100).toFixed(1)}% of miles are empty (industry target: ${B.emptyMilePercentTarget * 100}%). Use load boards and backhaul strategies.`
        });
    } else {
        advice.push({
            category: 'Empty Miles', severity: 'excellent', title: 'Excellent Empty Mile Ratio',
            detail: `Only ${(d.emptyMilePercent * 100).toFixed(1)}% empty miles — well below the ${B.emptyMilePercentTarget * 100}% target.`
        });
    }

    // 3. Driver Pay %
    if (d.driverPayPercent > 0.45) {
        advice.push({
            category: 'Labor Cost', severity: 'critical', title: 'Driver Pay Exceeds 45% of Revenue',
            detail: `Driver pay is ${(d.driverPayPercent * 100).toFixed(1)}% of revenue (target: ${(B.driverPayPercentTarget * 100)}%). Renegotiate pay structures or increase revenue per load.`,
            impact: `Reducing to ${(B.driverPayPercentTarget * 100)}% would save ~${formatUSD((d.driverPayPercent - B.driverPayPercentTarget) * d.rev)}.`
        });
    } else if (d.driverPayPercent > B.driverPayPercentTarget) {
        advice.push({
            category: 'Labor Cost', severity: 'warning', title: 'Driver Pay Above Target',
            detail: `${(d.driverPayPercent * 100).toFixed(1)}% vs. ${(B.driverPayPercentTarget * 100)}% target. Consider per-mile vs. percentage pay models.`
        });
    } else {
        advice.push({
            category: 'Labor Cost', severity: 'good', title: 'Driver Pay Well-Managed',
            detail: `${(d.driverPayPercent * 100).toFixed(1)}% is at or below the ${(B.driverPayPercentTarget * 100)}% industry benchmark.`
        });
    }

    // 4. Revenue Per Truck (monthly)
    if (d.totalTrucks > 0 && d.monthlyRevenuePerTruck < B.revenuePerTruckPerMonth * 0.6) {
        advice.push({
            category: 'Asset Utilization', severity: 'critical', title: 'Low Revenue Per Truck',
            detail: `$${d.monthlyRevenuePerTruck.toLocaleString()}/truck/month vs. $${B.revenuePerTruckPerMonth.toLocaleString()} benchmark. Trucks may be sitting idle.`,
            impact: `Reaching benchmark = ~${formatUSD((B.revenuePerTruckPerMonth - d.monthlyRevenuePerTruck) * d.totalTrucks)} more revenue/month.`
        });
    } else if (d.totalTrucks > 0 && d.monthlyRevenuePerTruck < B.revenuePerTruckPerMonth) {
        advice.push({
            category: 'Asset Utilization', severity: 'warning', title: 'Below-Average Revenue Per Truck',
            detail: `$${d.monthlyRevenuePerTruck.toLocaleString()}/truck/month. Industry: $${B.revenuePerTruckPerMonth.toLocaleString()}. Consider higher-paying lanes or dedicated contracts.`
        });
    } else if (d.totalTrucks > 0) {
        advice.push({
            category: 'Asset Utilization', severity: 'excellent', title: 'Strong Revenue Per Truck',
            detail: `$${d.monthlyRevenuePerTruck.toLocaleString()}/truck/month exceeds the $${B.revenuePerTruckPerMonth.toLocaleString()} benchmark.`
        });
    }

    // 5. RPM
    if (d.rpm < 1.80) {
        advice.push({
            category: 'Rate Quality', severity: 'critical', title: 'RPM Below Breakeven',
            detail: `$${d.rpm.toFixed(2)}/mile is dangerously low. Average carrier needs $${B.rpmTarget.toFixed(2)}+ to be profitable. Renegotiate rates or target better lanes.`
        });
    } else if (d.rpm < B.rpmTarget) {
        advice.push({
            category: 'Rate Quality', severity: 'warning', title: 'RPM Below Target',
            detail: `$${d.rpm.toFixed(2)}/mile vs. $${B.rpmTarget.toFixed(2)} target. Focus on higher-RPM lanes and avoid cheap freight.`
        });
    } else {
        advice.push({
            category: 'Rate Quality', severity: 'excellent', title: 'Strong RPM',
            detail: `$${d.rpm.toFixed(2)}/mile exceeds the $${B.rpmTarget.toFixed(2)} benchmark.`
        });
    }

    // 6. Loads Per Truck
    if (d.totalTrucks > 0 && d.monthlyLoadsPerTruck < B.loadsPerTruckPerMonth * 0.5) {
        advice.push({
            category: 'Dispatch Efficiency', severity: 'critical', title: 'Very Few Loads Per Truck',
            detail: `${d.monthlyLoadsPerTruck.toFixed(1)} loads/truck/month (target: ${B.loadsPerTruckPerMonth}). Your dispatch team may need reinforcement or your trucks are sitting idle.`
        });
    } else if (d.totalTrucks > 0 && d.monthlyLoadsPerTruck < B.loadsPerTruckPerMonth) {
        advice.push({
            category: 'Dispatch Efficiency', severity: 'warning', title: 'Below-Target Load Frequency',
            detail: `${d.monthlyLoadsPerTruck.toFixed(1)} loads/truck/month vs. ${B.loadsPerTruckPerMonth} target. Reduce dwell time between loads.`
        });
    }

    // 7. Operating Ratio
    if (d.operatingRatio > 1.0) {
        advice.push({
            category: 'Operating Ratio', severity: 'critical', title: 'Operating Ratio Over 100%',
            detail: `Your operating ratio is ${(d.operatingRatio * 100).toFixed(1)}% — you are losing money on every dollar earned. Immediate action needed.`
        });
    } else if (d.operatingRatio > B.operatingRatioTarget) {
        advice.push({
            category: 'Operating Ratio', severity: 'warning', title: 'Operating Ratio Above Industry Average',
            detail: `${(d.operatingRatio * 100).toFixed(1)}% vs. ${(B.operatingRatioTarget * 100)}% target. Reduce costs or increase revenue.`
        });
    } else {
        advice.push({
            category: 'Operating Ratio', severity: 'excellent', title: 'Healthy Operating Ratio',
            detail: `${(d.operatingRatio * 100).toFixed(1)}% is below the ${(B.operatingRatioTarget * 100)}% industry average — efficient operations.`
        });
    }

    return advice;
}

function formatUSD(v: number): string {
    return '$' + Math.abs(Math.round(v)).toLocaleString();
}
