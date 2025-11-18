import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get truck performance summary
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

    // Get all active trucks
    const trucks = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        loads: {
          where: {
            status: {
              in: ['DELIVERED', 'INVOICED', 'PAID'],
            },
            deletedAt: null,
          },
          select: {
            id: true,
            revenue: true,
            deliveredAt: true,
          },
        },
        maintenanceRecords: {
          where: {
            scheduledDate: {
              lte: new Date(),
            },
            completedDate: null, // Only records that haven't been completed
          },
          select: {
            id: true,
          },
        },
      },
    });

    const totalTrucks = trucks.length;
    const availableTrucks = trucks.filter((t) => t.status === 'AVAILABLE').length;
    const inUseTrucks = trucks.filter((t) => t.status === 'IN_USE').length;
    const maintenanceTrucks = trucks.filter((t) => t.status === 'MAINTENANCE').length;

    // Calculate performance metrics for each truck
    const truckPerformance = trucks.map((truck) => {
      const loadsCompleted = truck.loads.length;
      const totalRevenue = truck.loads.reduce((sum, l) => sum + (l.revenue || 0), 0);

      // Calculate utilization rate (simplified - would use actual days in service)
      // For now, use loads completed as a proxy
      const utilizationRate = loadsCompleted > 0 ? Math.min(100, (loadsCompleted / 10) * 100) : 0;

      return {
        id: truck.id,
        truckNumber: truck.truckNumber,
        make: truck.make,
        model: truck.model,
        revenue: totalRevenue,
        loadsCompleted,
        utilizationRate,
        needsMaintenance: truck.maintenanceRecords.length > 0,
      };
    });

    // Get trucks needing maintenance
    const trucksNeedingMaintenance = truckPerformance.filter((t) => t.needsMaintenance).length;

    // Calculate average utilization
    const averageUtilizationRate =
      truckPerformance.length > 0
        ? truckPerformance.reduce((sum, t) => sum + t.utilizationRate, 0) /
          truckPerformance.length
        : 0;

    // Get top performers (by revenue and utilization)
    const topPerformers = truckPerformance
      .filter((t) => t.loadsCompleted >= 3) // At least 3 loads
      .sort((a, b) => {
        // Sort by revenue first, then utilization
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }
        return b.utilizationRate - a.utilizationRate;
      })
      .slice(0, 5)
      .map(({ needsMaintenance, ...rest }) => rest); // Remove needsMaintenance from response

    return NextResponse.json({
      success: true,
      data: {
        totalTrucks,
        availableTrucks,
        inUseTrucks,
        maintenanceTrucks,
        trucksNeedingMaintenance,
        topPerformers,
        averageUtilizationRate,
      },
    });
  } catch (error) {
    console.error('Truck performance fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

