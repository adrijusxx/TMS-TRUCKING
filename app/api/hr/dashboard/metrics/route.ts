import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * Get HR dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Build MC filters for drivers (uses mcNumberId)
    const driverMcFilter = await buildMcNumberWhereClause(session, request);

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get active drivers (currently active - not terminated/inactive)
    const [currentActiveDrivers, lastMonthActiveDrivers, allActiveDrivers] = await Promise.all([
      // Current active drivers
      prisma.driver.count({
        where: {
          ...driverMcFilter,
          isActive: true,
          deletedAt: null,
          employeeStatus: { not: 'TERMINATED' },
        },
      }),
      // Active drivers last month
      prisma.driver.count({
        where: {
          ...driverMcFilter,
          isActive: true,
          deletedAt: null,
          employeeStatus: { not: 'TERMINATED' },
          createdAt: { lte: lastMonthEnd },
        },
      }),
      // All drivers for retention calculation (hired 12+ months ago and still active)
      prisma.driver.findMany({
        where: {
          ...driverMcFilter,
          isActive: true,
          deletedAt: null,
          employeeStatus: { not: 'TERMINATED' },
        },
        select: {
          id: true,
          hireDate: true,
        },
      }),
    ]);

    // Calculate driver change from last month
    const driverChange = currentActiveDrivers - lastMonthActiveDrivers;
    const driverChangePercent =
      lastMonthActiveDrivers > 0
        ? ((driverChange / lastMonthActiveDrivers) * 100).toFixed(1)
        : '0';

    // Calculate retention rate (drivers hired 12+ months ago who are still active)
    const driversHired12MonthsAgo = allActiveDrivers.filter((driver) => {
      if (!driver.hireDate) return false;
      const hireDate = new Date(driver.hireDate);
      return hireDate <= twelveMonthsAgo;
    }).length;

    const totalDrivers12MonthsAgo = await prisma.driver.count({
      where: {
        ...driverMcFilter,
        hireDate: { lte: twelveMonthsAgo },
        deletedAt: null,
      },
    });

    const retentionRate =
      totalDrivers12MonthsAgo > 0
        ? ((driversHired12MonthsAgo / totalDrivers12MonthsAgo) * 100).toFixed(1)
        : '0';

    // Calculate average settlement (average netPay per week from last 7 days)
    // Settlements are filtered through drivers (driver has mcNumberId)
    // First, get driver IDs that match the MC filter
    const settlementDriverIds = await prisma.driver.findMany({
      where: {
        ...driverMcFilter,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const driverIds = settlementDriverIds.length > 0 ? settlementDriverIds.map((d) => d.id) : [];

    const settlementsLastWeek =
      driverIds.length > 0
        ? await prisma.settlement.findMany({
            where: {
              driverId: { in: driverIds },
              status: { in: ['APPROVED', 'PAID'] },
              periodEnd: { gte: oneWeekAgo },
              // Settlement model doesn't have deletedAt field - settlements are financial records that should not be deleted
            },
            select: {
              netPay: true,
              periodStart: true,
              periodEnd: true,
            },
          })
        : [];

    const avgSettlement =
      settlementsLastWeek.length > 0
        ? settlementsLastWeek.reduce((sum, s) => sum + Number(s.netPay || 0), 0) /
          settlementsLastWeek.length
        : 0;

    // Calculate bonuses paid this month
    // Note: Bonuses may be tracked in a separate model or as positive adjustments
    // For now, we'll check if there's a bonus field in settlements or related models
    // This can be enhanced later once bonus tracking is fully implemented
    let bonusesPaid = 0;

    // Try to find bonuses in a separate bonus/incentive model if it exists
    // For now, return 0 as bonuses might be tracked differently or not yet implemented

    return NextResponse.json({
      success: true,
      data: {
        activeDrivers: {
          count: currentActiveDrivers,
          change: driverChange,
          changePercent: driverChangePercent,
          changeLabel: `${driverChange >= 0 ? '+' : ''}${driverChange} from last month`,
        },
        avgSettlement: {
          amount: Math.round(avgSettlement * 100) / 100,
          period: 'Per week',
        },
        retentionRate: {
          percentage: parseFloat(retentionRate),
          period: 'Last 12 months',
        },
        bonusesPaid: {
          amount: Math.round(bonusesPaid * 100) / 100,
          period: 'This month',
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching HR dashboard metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch HR dashboard metrics',
        },
      },
      { status: 500 }
    );
  }
}

