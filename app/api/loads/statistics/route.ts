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

    // 6. Calculate statistics
    const loads = await prisma.load.findMany({
      where,
      select: {
        totalMiles: true,
        loadedMiles: true,
        emptyMiles: true,
        revenue: true,
        driverPay: true,
        profit: true,
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
    const totalMiles = loads.reduce((sum, load) => sum + (load.totalMiles || 0), 0);
    const totalRevenue = loads.reduce((sum, load) => sum + (load.revenue || 0), 0);
    const totalDriverPay = loads.reduce((sum, load) => sum + (load.driverPay || 0), 0);
    const totalProfit = loads.reduce((sum, load) => sum + (load.profit || 0), 0);

    // Calculate loaded and empty miles
    // First try to use direct fields from Load model, then fall back to segments
    let loadedMiles = 0;
    let emptyMiles = 0;
    loads.forEach((load) => {
      if (load.loadedMiles !== null && load.emptyMiles !== null) {
        // Use direct fields if available
        loadedMiles += load.loadedMiles || 0;
        emptyMiles += load.emptyMiles || 0;
      } else if (load.segments && load.segments.length > 0) {
        // Calculate from segments
        load.segments.forEach((segment) => {
          loadedMiles += segment.loadedMiles || 0;
          emptyMiles += segment.emptyMiles || 0;
        });
      } else {
        // Fallback: if no segments and no direct fields, assume all miles are loaded
        loadedMiles += load.totalMiles || 0;
      }
    });

    // Calculate averages
    const averageMilesPerLoad = totalLoads > 0 ? totalMiles / totalLoads : 0;
    const averageRevenuePerLoad = totalLoads > 0 ? totalRevenue / totalLoads : 0;
    const averageProfitPerLoad = totalLoads > 0 ? totalProfit / totalLoads : 0;

    // Calculate utilization rate (loaded miles / total miles)
    const utilizationRate = totalMiles > 0 ? (loadedMiles / totalMiles) * 100 : 0;

    const statistics = {
      totalLoads,
      totalMiles,
      loadedMiles,
      emptyMiles,
      totalRevenue,
      totalDriverPay,
      totalProfit,
      averageMilesPerLoad: Math.round(averageMilesPerLoad),
      averageRevenuePerLoad: Math.round(averageRevenuePerLoad * 100) / 100,
      averageProfitPerLoad: Math.round(averageProfitPerLoad * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
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

