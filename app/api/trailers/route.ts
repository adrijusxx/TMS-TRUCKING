import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * GET /api/trailers
 * List all trailers from the Trailer model with load statistics
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build base filter with MC number if applicable
    const baseFilter = await buildMcNumberWhereClause(session, request);

    // Build where clause
    const where: any = {
      ...baseFilter,
      deletedAt: null,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { trailerNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch trailers with relations
    const [trailers, total] = await Promise.all([
      prisma.trailer.findMany({
        where,
        include: {
          assignedTruck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
          operatorDriver: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.trailer.count({ where }),
    ]);

    // Log for debugging
    console.log(`[Trailers API] Found ${trailers.length} trailers for company ${session.user.companyId}, total: ${total}`);

    // Get load statistics for all trailers
    // Note: Loads might be linked by trailerId (relation) or trailerNumber (string)
    const trailerNumbers = trailers.map((t) => t.trailerNumber);
    const trailerIds = trailers.map((t) => t.id);
    
    // Initialize maps
    const loadCountMapById = new Map<string, number>();
    const activeLoadCountMapById = new Map<string, number>();
    const lastUsedMapById = new Map<string, Date>();
    const loadCountMapByNumber = new Map<string, number>();
    const activeLoadCountMapByNumber = new Map<string, number>();
    const lastUsedMapByNumber = new Map<string, Date>();

    // Only query loads if we have trailers
    if (trailerIds.length > 0) {
      try {
        // Get loads linked by trailerId (proper relation)
        const loadStatsById = await prisma.load.groupBy({
          by: ['trailerId'],
          where: {
            trailerId: { in: trailerIds },
            deletedAt: null,
          },
          _count: {
            id: true,
          },
          _max: {
            deliveryDate: true,
          },
        });

        // Get active load counts by trailerId
        const activeLoadStatsById = await prisma.load.groupBy({
          by: ['trailerId'],
          where: {
            trailerId: { in: trailerIds },
            deletedAt: null,
            status: {
              in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
            },
          },
          _count: {
            id: true,
          },
        });

        // Populate maps by trailerId
        loadStatsById.forEach((stat) => {
          if (stat.trailerId) {
            loadCountMapById.set(stat.trailerId, stat._count.id);
            if (stat._max.deliveryDate) {
              lastUsedMapById.set(stat.trailerId, stat._max.deliveryDate);
            }
          }
        });

        activeLoadStatsById.forEach((stat) => {
          if (stat.trailerId) {
            activeLoadCountMapById.set(stat.trailerId, stat._count.id);
          }
        });
      } catch (error) {
        console.error('Error fetching load stats by trailerId:', error);
      }
    }

    // Get loads linked by trailerNumber (string field) - only if not already linked by trailerId
    if (trailerNumbers.length > 0) {
      try {
        const loadStatsByNumber = await prisma.load.groupBy({
          by: ['trailerNumber'],
          where: {
            trailerNumber: { in: trailerNumbers },
            deletedAt: null,
            trailerId: null, // Only get loads not linked by relation
          },
          _count: {
            id: true,
          },
          _max: {
            deliveryDate: true,
          },
        });

        // Get active load counts by trailerNumber
        const activeLoadStatsByNumber = await prisma.load.groupBy({
          by: ['trailerNumber'],
          where: {
            trailerNumber: { in: trailerNumbers },
            deletedAt: null,
            trailerId: null, // Only get loads not linked by relation
            status: {
              in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
            },
          },
          _count: {
            id: true,
          },
        });

        // Populate maps by trailerNumber
        loadStatsByNumber.forEach((stat) => {
          if (stat.trailerNumber) {
            loadCountMapByNumber.set(stat.trailerNumber, stat._count.id);
            if (stat._max.deliveryDate) {
              lastUsedMapByNumber.set(stat.trailerNumber, stat._max.deliveryDate);
            }
          }
        });

        activeLoadStatsByNumber.forEach((stat) => {
          if (stat.trailerNumber) {
            activeLoadCountMapByNumber.set(stat.trailerNumber, stat._count.id);
          }
        });
      } catch (error) {
        console.error('Error fetching load stats by trailerNumber:', error);
      }
    }

    // Transform trailers to include load statistics
    const trailersWithStats = trailers.map((trailer) => {
      // Get counts from both trailerId and trailerNumber
      const loadCountById = loadCountMapById.get(trailer.id) || 0;
      const loadCountByNumber = loadCountMapByNumber.get(trailer.trailerNumber) || 0;
      const loadCount = loadCountById + loadCountByNumber;

      const activeLoadsById = activeLoadCountMapById.get(trailer.id) || 0;
      const activeLoadsByNumber = activeLoadCountMapByNumber.get(trailer.trailerNumber) || 0;
      const activeLoads = activeLoadsById + activeLoadsByNumber;

      // Get last used date from both sources
      const lastUsedById = lastUsedMapById.get(trailer.id);
      const lastUsedByNumber = lastUsedMapByNumber.get(trailer.trailerNumber);
      
      // Get the most recent date
      const dates = [lastUsedById, lastUsedByNumber].filter((d) => d !== null && d !== undefined) as Date[];
      const lastUsed = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;

      return {
        id: trailer.id,
        trailerNumber: trailer.trailerNumber,
        vin: trailer.vin,
        make: trailer.make,
        model: trailer.model,
        year: trailer.year,
        licensePlate: trailer.licensePlate,
        state: trailer.state,
        mcNumber: trailer.mcNumber,
        type: trailer.type,
        ownership: trailer.ownership,
        ownerName: trailer.ownerName,
        status: trailer.status,
        fleetStatus: trailer.fleetStatus,
        assignedTruck: trailer.assignedTruck
          ? {
              id: trailer.assignedTruck.id,
              truckNumber: trailer.assignedTruck.truckNumber,
            }
          : null,
        operatorDriver: trailer.operatorDriver
          ? {
              id: trailer.operatorDriver.id,
              driverNumber: trailer.operatorDriver.driverNumber,
              name: `${trailer.operatorDriver.user.firstName} ${trailer.operatorDriver.user.lastName}`,
            }
          : null,
        loadCount,
        activeLoads,
        lastUsed,
        registrationExpiry: trailer.registrationExpiry,
        insuranceExpiry: trailer.insuranceExpiry,
        inspectionExpiry: trailer.inspectionExpiry,
        isActive: trailer.isActive,
        createdAt: trailer.createdAt,
        updatedAt: trailer.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: trailersWithStats,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching trailers:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch trailers',
        },
      },
      { status: 500 }
    );
  }
}

