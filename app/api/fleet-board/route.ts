import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * GET /api/fleet-board
 * Get fleet overview with trucks and their status
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

    // Build base filter with MC number if applicable
    const baseFilter = await buildMcNumberWhereClause(session, request);

    // Get all trucks with their current loads
    const trucks = await prisma.truck.findMany({
      where: {
        ...baseFilter,
        isActive: true,
        deletedAt: null,
      },
      include: {
        currentDrivers: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        loads: {
          where: {
            ...(baseFilter.mcNumber ? { mcNumber: baseFilter.mcNumber } : {}),
            status: {
              in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
            },
            deletedAt: null,
          },
          select: {
            id: true,
            loadNumber: true,
            status: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
            pickupDate: true,
            deliveryDate: true,
          },
        },
        maintenanceRecords: {
          where: {
            completedDate: null,
            scheduledDate: {
              lte: new Date(),
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        truckNumber: 'asc',
      },
    });

    // Get summary stats
    const stats = {
      total: trucks.length,
      available: trucks.filter((t) => t.status === 'AVAILABLE').length,
      inUse: trucks.filter((t) => t.status === 'IN_USE').length,
      maintenance: trucks.filter((t) => t.status === 'MAINTENANCE').length,
      outOfService: trucks.filter((t) => t.status === 'OUT_OF_SERVICE').length,
      withLoads: trucks.filter((t) => t.loads.length > 0).length,
      withDrivers: trucks.filter((t) => t.currentDrivers.length > 0).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        trucks,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching fleet board:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch fleet board',
        },
      },
      { status: 500 }
    );
  }
}

