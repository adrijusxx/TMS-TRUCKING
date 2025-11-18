import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    // Get all active drivers
    const drivers = await prisma.driver.findMany({
      where: {
        companyId: session.user.companyId,
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
            status: {
              in: ['DELIVERED', 'INVOICED', 'PAID'],
            },
            deletedAt: null,
          },
          select: {
            id: true,
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
      const totalLoads = driver.loads.length;
      const completedLoads = driver.loads.filter((l) => l.deliveredAt).length;
      const onTimeLoads = driver.loads.filter((l) => {
        if (!l.deliveredAt || !l.deliveryDate) return false;
        const delivered = new Date(l.deliveredAt);
        const expected = new Date(l.deliveryDate);
        // Consider on-time if delivered within 24 hours of expected
        return delivered <= new Date(expected.getTime() + 24 * 60 * 60 * 1000);
      }).length;

      const completionRate = totalLoads > 0 ? (completedLoads / totalLoads) * 100 : 0;
      const onTimeRate = completedLoads > 0 ? (onTimeLoads / completedLoads) * 100 : 0;
      const totalRevenue = driver.loads.reduce((sum, l) => sum + (l.revenue || 0), 0);

      return {
        id: driver.id,
        name: `${driver.user.firstName} ${driver.user.lastName}`,
        driverNumber: driver.driverNumber,
        completionRate,
        onTimeRate,
        revenue: totalRevenue,
        totalLoads,
      };
    });

    // Get drivers with HOS violations (placeholder - would need actual HOS data)
    const driversWithViolations = 0; // TODO: Implement actual HOS violation check

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
    const topPerformers = driverPerformance
      .filter((d) => d.totalLoads >= 3) // At least 3 loads
      .filter((d) => d.completionRate >= 80 && d.onTimeRate >= 70) // Good performance
      .sort((a, b) => b.revenue - a.revenue)
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

