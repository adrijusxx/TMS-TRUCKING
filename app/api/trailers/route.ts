import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';
import { createTrailerSchema } from '@/lib/validations/trailer';
import { z } from 'zod';
import { getTrailerFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

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
    const mcViewMode = searchParams.get('mc'); // 'all', 'current', or specific MC ID
    const isAdmin = session.user?.role === 'ADMIN';

    // Build base filter with MC number if applicable
    let baseFilter: any = await buildMcNumberWhereClause(session, request);
    
    // Convert mcNumber (string) to mcNumberId (foreign key) for trailers
    // Trailers use mcNumberId relation, not mcNumber string field
    if (baseFilter.mcNumber && typeof baseFilter.mcNumber === 'string') {
      const mcNumberValue = baseFilter.mcNumber;
      // Look up the MC Number record by its number value
      const mcRecord = await prisma.mcNumber.findFirst({
        where: {
          companyId: session.user.companyId,
          number: mcNumberValue,
          deletedAt: null,
        },
        select: { id: true },
      });
      
      if (mcRecord) {
        // Replace mcNumber with mcNumberId
        delete baseFilter.mcNumber;
        baseFilter.mcNumberId = mcRecord.id;
      } else {
        // MC number not found, remove the filter
        delete baseFilter.mcNumber;
      }
    }
    
    // Get user's MC number from session to handle company name matching
    const userMcNumber = (session.user as any)?.mcNumber || baseFilter.mcNumber;
    const userMcNumberId = (session.user as any)?.mcNumberId || baseFilter.mcNumberId;
    
    // Admin-only: Override MC filter based on view mode
    if (isAdmin && mcViewMode === 'all') {
      // Remove MC number filter to show all MCs (admin only)
      if (baseFilter.mcNumber) {
        delete baseFilter.mcNumber;
      }
      if (baseFilter.OR) {
        delete baseFilter.OR;
      }
    } else if (isAdmin && mcViewMode && mcViewMode !== 'current' && mcViewMode !== null) {
      // Filter by specific MC number ID (admin selecting specific MC)
      // Handle both "mc:ID" format and plain ID format
      const mcId = mcViewMode.startsWith('mc:') ? mcViewMode.substring(3) : mcViewMode;
      
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcId },
        select: { number: true, companyId: true, companyName: true },
      });
      
      if (mcNumberRecord) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { companyId: true, userCompanies: { select: { companyId: true } } },
        });
        const accessibleCompanyIds = [
          user?.companyId,
          ...(user?.userCompanies?.map((uc) => uc.companyId) || []),
        ].filter(Boolean) as string[];
        
        if (accessibleCompanyIds.includes(mcNumberRecord.companyId)) {
          // Build filter using mcNumberId (foreign key) - trailers now use mcNumberId, not mcNumber string
          // Since we have the MC ID, we can directly filter by it
          baseFilter = {
            ...baseFilter,
            mcNumberId: mcId, // Filter by mcNumberId foreign key
          };
          
          // Remove any old mcNumber filter if it exists
          if (baseFilter.mcNumber) {
            delete baseFilter.mcNumber;
          }
        }
      }
    }
    // Ensure we're using mcNumberId, not mcNumber (trailers use foreign key relation)
    if (baseFilter.mcNumber && !baseFilter.mcNumberId) {
      // This shouldn't happen after the conversion above, but handle it as a safety check
      delete baseFilter.mcNumber;
    }
    
    // For non-admin users: Handle MC number matching for trailers
    // Trailers now use mcNumberId (foreign key), not mcNumber (string)
    if (!isAdmin && userMcNumberId) {
      // Filter by mcNumberId foreign key
      baseFilter = {
        ...baseFilter,
        mcNumberId: userMcNumberId,
      };
      
      // Remove any old mcNumber filter if it exists
      if (baseFilter.mcNumber) {
        delete baseFilter.mcNumber;
      }
    } else if (!isAdmin && baseFilter.mcNumber) {
      // Legacy: If buildMcNumberWhereClause returned mcNumber (string), we need to resolve it to mcNumberId
      // This shouldn't happen after migration, but handle it for safety
      const mcNumberValue = baseFilter.mcNumber;
      const mcRecord = await prisma.mcNumber.findFirst({
        where: {
          companyId: session.user.companyId,
          OR: [
            { number: mcNumberValue },
            { companyName: { contains: mcNumberValue, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        select: { id: true },
      });
      
      if (mcRecord) {
        baseFilter = {
          ...baseFilter,
          mcNumberId: mcRecord.id,
        };
      }
      
      // Remove old mcNumber filter
      delete baseFilter.mcNumber;
    }

    // Build where clause
    // Apply role-based filtering
    const { mcNumberId } = await getCurrentMcNumber(session, request);
    const roleFilter = getTrailerFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId,
        mcNumberId ?? undefined
      )
    );

    // Merge role filter with base filter
    if (roleFilter.mcNumberId && baseFilter.mcNumberId) {
      // Both have mcNumberId, keep baseFilter's (from MC selection)
      delete roleFilter.mcNumberId;
    }

    const where: any = {
      ...baseFilter,
      ...roleFilter,
      deletedAt: null,
    };

    // Add search filter - merge with existing OR conditions if any
    if (search) {
      const searchOr = [
        { trailerNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];
      
      // If baseFilter already has OR conditions (for MC number matching), combine them with AND
      if (where.OR) {
        // MC number OR conditions must be satisfied AND search OR conditions must be satisfied
        where.AND = [
          { OR: where.OR }, // MC number matching (numeric or company name)
          { OR: searchOr }, // Search conditions
        ];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    // Fetch trailers with relations
    const [trailers, total] = await Promise.all([
      prisma.trailer.findMany({
        where,
        include: {
          mcNumber: {
            select: {
              id: true,
              number: true,
              companyName: true,
            },
          },
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
    // Summary log only (reduced verbosity)
    if (trailers.length === 0 && total === 0) {
      // Only log if no trailers found at all (might indicate a filter issue)
      console.log(`[Trailers API] No trailers found (total: ${total})`);
    }

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
        mcNumber: trailer.mcNumber?.number || null, // Extract number from relation
        mcNumberId: trailer.mcNumberId, // Include mcNumberId for reference
        mcNumberRecord: trailer.mcNumber ? {
          id: trailer.mcNumber.id,
          number: trailer.mcNumber.number,
          companyName: trailer.mcNumber.companyName,
        } : null,
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

    // Filter sensitive fields based on role
    const filteredTrailers = trailersWithStats.map((trailer) =>
      filterSensitiveFields(trailer, session.user.role as any)
    );

    return NextResponse.json({
      success: true,
      data: filteredTrailers,
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to create trailers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create trailers',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createTrailerSchema.parse(body);

    // Check if trailer number already exists
    const existingTrailer = await prisma.trailer.findFirst({
      where: {
        trailerNumber: validated.trailerNumber,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (existingTrailer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Trailer number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Validate MC number exists and belongs to company
    if (validated.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: validated.mcNumberId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_MC_NUMBER',
              message: 'MC number not found or does not belong to your company',
            },
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'MC number is required',
          },
        },
        { status: 400 }
      );
    }

    // Convert dates
    const registrationExpiry = validated.registrationExpiry
      ? (validated.registrationExpiry instanceof Date
          ? validated.registrationExpiry
          : new Date(validated.registrationExpiry))
      : null;
    const insuranceExpiry = validated.insuranceExpiry
      ? (validated.insuranceExpiry instanceof Date
          ? validated.insuranceExpiry
          : new Date(validated.insuranceExpiry))
      : null;
    const inspectionExpiry = validated.inspectionExpiry
      ? (validated.inspectionExpiry instanceof Date
          ? validated.inspectionExpiry
          : new Date(validated.inspectionExpiry))
      : null;

    const trailer = await prisma.trailer.create({
      data: {
        trailerNumber: validated.trailerNumber,
        vin: validated.vin || null,
        make: validated.make,
        model: validated.model,
        year: validated.year || null,
        licensePlate: validated.licensePlate || null,
        state: validated.state || null,
        type: validated.type || null,
        ownership: validated.ownership || null,
        ownerName: validated.ownerName || null,
        assignedTruckId: validated.assignedTruckId || null,
        operatorDriverId: validated.operatorDriverId || null,
        status: validated.status || null,
        fleetStatus: validated.fleetStatus || null,
        registrationExpiry,
        insuranceExpiry,
        inspectionExpiry,
        mcNumberId: validated.mcNumberId,
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: trailer,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Trailer creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

