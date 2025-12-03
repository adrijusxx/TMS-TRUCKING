import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberIdWhereClause, buildMcNumberWhereClause } from '@/lib/mc-number-filter';
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

    // Build MC filters - Truck uses mcNumberId, Load uses mcNumberId
    // Wrap in try-catch to make MC filtering optional
    let truckFilter: any = { companyId: session.user.companyId };
    let loadWhere: any = {
      companyId: session.user.companyId,
      status: {
        in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
      },
      deletedAt: null,
    };

    try {
      truckFilter = await buildMcNumberIdWhereClause(session, request);
      const loadMcWhere = await buildMcNumberWhereClause(session, request);
      
      // Build load filter for include (Load uses mcNumberId)
      // For admin "all" view, loadMcWhere only has companyId (no mcNumberId)
      // For single MC view, loadMcWhere has both companyId and mcNumberId
      loadWhere = {
        ...loadMcWhere, // This includes companyId, and mcNumberId if not "all" view
        status: {
          in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
        },
        deletedAt: null,
      };
    } catch (mcError) {
      // Log but don't fail - MC filtering is optional for security
      console.warn('MC number filter failed for fleet board, continuing without MC filter:', mcError);
      // truckFilter and loadWhere already have default companyId values above
    }

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
          where: loadWhere,
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
            nextServiceDate: {
              lte: new Date(),
            },
          },
          select: {
            id: true,
            type: true,
            nextServiceDate: true,
          },
          orderBy: {
            nextServiceDate: 'asc',
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

