import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';

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

    // Build base filter with MC number ID for trucks (Truck uses mcNumberId relation)
    const truckFilter = await buildMcNumberIdWhereClause(session, request);
    
    // Get MC state to get MC number string for Load filtering (Load uses mcNumber string)
    const mcState = await McStateManager.getMcState(session, request);
    const loadMcFilter = mcState.viewMode === 'all' 
      ? {} 
      : mcState.mcNumber 
        ? { mcNumber: mcState.mcNumber } 
        : {};

    // Get all trucks with their current loads
    const trucks = await prisma.truck.findMany({
      where: {
        ...truckFilter,
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
            ...loadMcFilter,
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

