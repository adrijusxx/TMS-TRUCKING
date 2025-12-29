import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';

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

    // Build MC filters - Truck uses mcNumberId, Load uses mcNumberId
    const truckFilter = await buildMcNumberIdWhereClause(session, request);
    const loadMcWhere = await buildMcNumberWhereClause(session, request);

    // Get all active trucks
    const trucks = await prisma.truck.findMany({
      where: {
        ...truckFilter,
        isActive: true,
        deletedAt: null,
      },
      include: {
        loads: {
          where: {
            ...loadMcWhere,
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            revenue: true,
            deliveredAt: true,
            pickupDate: true,
          },
        },
        maintenanceRecords: {
          where: {
            nextServiceDate: {
              lte: new Date(),
            },
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
    const truckPerformance = trucks.map((truck: any) => {
      const allLoads = truck.loads || [];
      const loadsCompleted = allLoads.filter((l: any) => 
        ['DELIVERED', 'INVOICED', 'PAID'].includes(l.status)
      ).length;
      const totalRevenue = allLoads.reduce((sum: number, l: any) => sum + (l.revenue || 0), 0);

      // Calculate utilization rate based on total loads (all statuses)
      // Count loads in last 30 days for better utilization metric
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentLoads = allLoads.filter((l: any) => {
        const pickupDate = l.pickupDate ? new Date(l.pickupDate) : null;
        return pickupDate && pickupDate >= thirtyDaysAgo;
      }).length;
      
      // Utilization: percentage of time truck has loads (simplified)
      const utilizationRate = recentLoads > 0 ? Math.min(100, (recentLoads / 30) * 100) : 0;

      return {
        id: truck.id,
        truckNumber: truck.truckNumber,
        make: truck.make,
        model: truck.model,
        revenue: totalRevenue,
        loadsCompleted,
        utilizationRate,
        needsMaintenance: (truck.maintenanceRecords || []).length > 0,
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
      .filter((t) => {
        const truck = trucks.find((tr: any) => tr.id === t.id);
        return truck && (truck.loads || []).length >= 1; // At least 1 load (any status)
      })
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

