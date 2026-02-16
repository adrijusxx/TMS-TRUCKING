import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getLoadFilter, createFilterContext } from '@/lib/filters/role-data-filter';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'loads.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Apply role-based filtering
    const roleFilter = await getLoadFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );

    // 5. Merge filters
    const where: any = {
      ...mcWhere,
      ...roleFilter,
      deletedAt: null,
    };

    // 6. Fetch operational metrics for projections
    const systemConfig = await prisma.systemConfig.findUnique({
      where: { companyId: session.user.companyId },
    });

    // 7. Calculate statistics - fetch all required fields
    const loads = await prisma.load.findMany({
      where,
      select: {
        totalMiles: true,
        loadedMiles: true,
        emptyMiles: true,
        revenue: true,
        driverPay: true,
        profit: true,
        fuelAdvance: true,
        totalExpenses: true,
        segments: {
          select: {
            loadedMiles: true,
            emptyMiles: true,
            segmentMiles: true,
          },
        },
      },
    });

    // Calculate totals
    const totalLoads = loads.length;
    let totalMiles = 0;
    let loadedMiles = 0;
    let emptyMiles = 0;
    let totalRevenue = 0;
    let totalDriverPay = 0;
    let totalProfit = 0;
    let totalFuelAdvance = 0;
    let totalLoadExpenses = 0;

    loads.forEach((load) => {
      // Add revenue, driverPay, profit
      totalRevenue += load.revenue || 0;
      totalDriverPay += load.driverPay || 0;
      totalFuelAdvance += load.fuelAdvance || 0;
      totalLoadExpenses += load.totalExpenses || 0;

      // Calculate profit: use stored profit if available, otherwise revenue - driverPay
      if (load.profit !== null && load.profit !== undefined) {
        totalProfit += load.profit;
      } else {
        totalProfit += (load.revenue || 0) - (load.driverPay || 0);
      }

      // Calculate miles - only count what we actually know
      const loadTotalMiles = load.totalMiles || 0;
      totalMiles += loadTotalMiles;

      // For loaded/empty miles: use direct fields first, then segments
      // Don't assume values if not explicitly set
      if (load.loadedMiles !== null && load.loadedMiles !== undefined && load.loadedMiles > 0) {
        // Use direct loadedMiles field
        loadedMiles += load.loadedMiles;
      } else if (loadTotalMiles > 0) {
        // Fallback: Use total - empty if loaded is missing
        const calculatedLoaded = Math.max(0, loadTotalMiles - (load.emptyMiles || 0));
        loadedMiles += calculatedLoaded;
      }

      if (load.emptyMiles !== null && load.emptyMiles !== undefined && load.emptyMiles > 0) {
        // Use direct emptyMiles field
        emptyMiles += load.emptyMiles;
      } else if (load.loadedMiles !== null && load.loadedMiles !== undefined && loadTotalMiles > load.loadedMiles) {
        // Calculate empty miles as total - loaded (only if we have loadedMiles)
        emptyMiles += loadTotalMiles - load.loadedMiles;
      }

      // Check segments as fallback if no direct fields
      if ((!load.loadedMiles || load.loadedMiles === 0) && load.segments && load.segments.length > 0) {
        let segmentLoadedMiles = 0;
        let segmentEmptyMiles = 0;
        load.segments.forEach((segment) => {
          segmentLoadedMiles += segment.loadedMiles || 0;
          segmentEmptyMiles += segment.emptyMiles || 0;
        });
        if (segmentLoadedMiles > 0) {
          loadedMiles += segmentLoadedMiles;
        }
        if (segmentEmptyMiles > 0) {
          emptyMiles += segmentEmptyMiles;
        } else if (segmentLoadedMiles > 0 && loadTotalMiles > segmentLoadedMiles) {
          emptyMiles += loadTotalMiles - segmentLoadedMiles;
        }
      }
    });

    // Calculate averages (guard against division by zero)
    const averageMilesPerLoad = totalLoads > 0 ? totalMiles / totalLoads : 0;
    const averageRevenuePerLoad = totalLoads > 0 ? totalRevenue / totalLoads : 0;
    const averageProfitPerLoad = totalLoads > 0 ? totalProfit / totalLoads : 0;

    // Calculate utilization rate (loaded miles / total miles) as percentage
    const utilizationRate = totalMiles > 0 ? (loadedMiles / totalMiles) * 100 : 0;

    // Calculate RPM (Revenue Per Mile) - fixed calculations
    const rpmLoadedMiles = loadedMiles > 0 ? totalRevenue / loadedMiles : null;
    const rpmEmptyMiles = emptyMiles > 0 ? totalRevenue / emptyMiles : null;
    const rpmTotalMiles = totalMiles > 0 ? totalRevenue / totalMiles : null;

    // Projected operational costs from SystemConfig metrics
    const fuelPrice = systemConfig?.averageFuelPrice || 0;
    const mpg = systemConfig?.averageMpg || 1;
    const maintenanceCpm = systemConfig?.maintenanceCpm || 0;
    const fixedCostPerDay = systemConfig?.fixedCostPerDay || 0;

    const projectedFuelCost = mpg > 0 ? (totalMiles / mpg) * fuelPrice : 0;
    const projectedMaintenanceCost = totalMiles * maintenanceCpm;
    // Estimate days: assume average load takes 1 day per 500 miles
    const estimatedDays = totalMiles > 0 ? Math.ceil(totalMiles / 500) : totalLoads;
    const projectedFixedCosts = estimatedDays * fixedCostPerDay;
    const projectedTotalOpCost = projectedFuelCost + projectedMaintenanceCost + projectedFixedCosts;
    const projectedNetProfit = totalRevenue - totalDriverPay - projectedTotalOpCost;
    const projectedAvgProfitPerLoad = totalLoads > 0 ? projectedNetProfit / totalLoads : 0;

    const statistics = {
      totalLoads,
      totalMiles,
      loadedMiles,
      emptyMiles,
      totalRevenue,
      totalDriverPay,
      totalProfit,
      totalFuelAdvance: Math.round(totalFuelAdvance * 100) / 100,
      totalLoadExpenses: Math.round(totalLoadExpenses * 100) / 100,
      averageMilesPerLoad: Math.round(averageMilesPerLoad),
      averageRevenuePerLoad: Math.round(averageRevenuePerLoad * 100) / 100,
      averageProfitPerLoad: Math.round(averageProfitPerLoad * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      rpmLoadedMiles: rpmLoadedMiles ? Math.round(rpmLoadedMiles * 100) / 100 : null,
      rpmEmptyMiles: rpmEmptyMiles ? Math.round(rpmEmptyMiles * 100) / 100 : null,
      rpmTotalMiles: rpmTotalMiles ? Math.round(rpmTotalMiles * 100) / 100 : null,
      // Projected costs from operational metrics
      projected: {
        fuelCost: Math.round(projectedFuelCost * 100) / 100,
        maintenanceCost: Math.round(projectedMaintenanceCost * 100) / 100,
        fixedCosts: Math.round(projectedFixedCosts * 100) / 100,
        totalOpCost: Math.round(projectedTotalOpCost * 100) / 100,
        netProfit: Math.round(projectedNetProfit * 100) / 100,
        avgProfitPerLoad: Math.round(projectedAvgProfitPerLoad * 100) / 100,
        metricsConfigured: fuelPrice > 0 || maintenanceCpm > 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Error fetching load statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch load statistics',
        },
      },
      { status: 500 }
    );
  }
}
