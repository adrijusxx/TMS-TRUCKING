import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';

/**
 * Get driver performance summary
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

    // Build MC filters - Driver uses mcNumberId, Load uses mcNumberId
    const driverFilter = await buildMcNumberIdWhereClause(session, request);
    const loadMcWhere = await buildMcNumberWhereClause(session, request);

    // Get all active drivers
    const drivers = await prisma.driver.findMany({
      where: {
        ...driverFilter,
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        loads: {
          where: {
            ...loadMcWhere,
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            deliveredAt: true,
            deliveryDate: true,
            revenue: true,
          },
        },
      },
    });

    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE').length;
    const onDutyDrivers = drivers.filter((d) => d.status === 'ON_DUTY').length;
    const offDutyDrivers = drivers.filter((d) => d.status === 'OFF_DUTY').length;

    // Calculate performance metrics for each driver
    const driverPerformance = drivers.map((driver) => {
      const allLoads = driver.loads || [];
      const totalLoads = allLoads.length;
      const completedLoads = allLoads.filter((l: any) => 
        ['DELIVERED', 'INVOICED', 'PAID'].includes(l.status)
      ).length;
      
      // Calculate on-time rate only for completed loads
      const completedLoadsWithDates = allLoads.filter((l: any) => 
        ['DELIVERED', 'INVOICED', 'PAID'].includes(l.status) && l.deliveredAt && l.deliveryDate
      );
      const onTimeLoads = completedLoadsWithDates.filter((l: any) => {
        if (!l.deliveredAt || !l.deliveryDate) return false;
        const delivered = new Date(l.deliveredAt);
        const expected = new Date(l.deliveryDate);
        // Consider on-time if delivered within 24 hours of expected
        return delivered <= new Date(expected.getTime() + 24 * 60 * 60 * 1000);
      }).length;

      const completionRate = totalLoads > 0 ? (completedLoads / totalLoads) * 100 : 0;
      const onTimeRate = completedLoadsWithDates.length > 0 ? (onTimeLoads / completedLoadsWithDates.length) * 100 : 0;
      const totalRevenue = allLoads.reduce((sum: number, l: any) => sum + (l.revenue || 0), 0);

      return {
        id: driver.id,
        name: `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`,
        driverNumber: driver.driverNumber,
        completionRate,
        onTimeRate,
        revenue: totalRevenue,
        totalLoads,
      };
    });

    // Get drivers with HOS violations
    // Count unique drivers with violations in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const violationsCount = await prisma.hOSViolation.groupBy({
      by: ['driverId'],
      where: {
        companyId: session.user.companyId,
        violationDate: {
          gte: thirtyDaysAgo,
        },
        driver: {
          ...driverFilter,
          isActive: true,
          deletedAt: null,
        },
      },
    });
    
    const driversWithViolations = violationsCount.length;

    // Calculate averages
    const averageCompletionRate =
      driverPerformance.length > 0
        ? driverPerformance.reduce((sum, d) => sum + d.completionRate, 0) /
          driverPerformance.length
        : 0;
    const averageOnTimeRate =
      driverPerformance.length > 0
        ? driverPerformance.reduce((sum, d) => sum + d.onTimeRate, 0) /
          driverPerformance.length
        : 0;

    // Get top performers (by revenue, with good completion and on-time rates)
    // If no drivers meet the criteria, show top by revenue
    const topPerformers = driverPerformance
      .filter((d) => d.totalLoads >= 1) // At least 1 load
      .sort((a, b) => {
        // Sort by revenue first
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }
        // Then by completion rate
        return b.completionRate - a.completionRate;
      })
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalDrivers,
        availableDrivers,
        onDutyDrivers,
        offDutyDrivers,
        topPerformers,
        driversWithViolations,
        averageCompletionRate,
        averageOnTimeRate,
      },
    });
  } catch (error) {
    console.error('Driver performance fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

