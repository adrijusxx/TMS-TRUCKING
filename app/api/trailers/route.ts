import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { hasPermission } from '@/lib/permissions';
import { createTrailerSchema } from '@/lib/validations/trailer';
import { z } from 'zod';
import { getTrailerFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

/**
 * GET /api/trailers
 * List all trailers from the Trailer model with load statistics
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'trailers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const mcNumberIdFilter = searchParams.get('mcNumberId');
    const skipStats = searchParams.get('skipStats') === 'true' || limit >= 500; // Skip stats for large preloads

    // Apply role-based filtering (separate from MC filtering)
    const roleFilter = getTrailerFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );
    // Parse includeDeleted parameter (admins only)
    const includeDeleted = parseIncludeDeleted(request);

    // Build deleted records filter (admins can include deleted records if requested)
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

    // Merge MC filter with role filter and deleted filter
    const where: any = {
      ...mcWhere,
      ...roleFilter,
      ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
    };

    // Handle explicit MC number filter from table filter (overrides default MC view)
    if (mcNumberIdFilter) {
      if (mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned') {
        where.mcNumberId = null;
      } else {
        where.mcNumberId = mcNumberIdFilter;
      }
    }

    // Add search filter - merge with existing OR conditions if any
    if (search) {
      const searchOr = [
        { trailerNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];

      // Add search OR conditions
      if (where.OR) {
        // If there are existing OR conditions, combine them with AND
        where.AND = [
          { OR: where.OR },
          { OR: searchOr },
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


    // Get load statistics for all trailers (skip if skipStats is true for performance)
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

    // Only query loads if we have trailers and stats are not skipped
    if (!skipStats && trailerIds.length > 0) {
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
    if (!skipStats && trailerNumbers.length > 0) {
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

    // Transform trailers to include load statistics (or skip if skipStats is true)
    const trailersWithStats = trailers.map((trailer) => {
      // Get counts from both trailerId and trailerNumber (or use defaults if stats skipped)
      const loadCountById = skipStats ? 0 : loadCountMapById.get(trailer.id) || 0;
      const loadCountByNumber = skipStats ? 0 : loadCountMapByNumber.get(trailer.trailerNumber) || 0;
      const loadCount = loadCountById + loadCountByNumber;

      const activeLoadsById = skipStats ? 0 : activeLoadCountMapById.get(trailer.id) || 0;
      const activeLoadsByNumber = skipStats ? 0 : activeLoadCountMapByNumber.get(trailer.trailerNumber) || 0;
      const activeLoads = activeLoadsById + activeLoadsByNumber;

      // Get last used date from both sources (or null if stats skipped)
      const lastUsedById = skipStats ? null : lastUsedMapById.get(trailer.id);
      const lastUsedByNumber = skipStats ? null : lastUsedMapByNumber.get(trailer.trailerNumber);

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
        mcNumber: trailer.mcNumber ? {
          id: trailer.mcNumber.id,
          number: trailer.mcNumber.number,
          companyName: trailer.mcNumber.companyName,
        } : null,
        mcNumberId: trailer.mcNumberId, // Include mcNumberId for reference
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
            name: trailer.operatorDriver.user ? `${trailer.operatorDriver.user.firstName} ${trailer.operatorDriver.user.lastName}` : 'Unknown',
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

    // 5. Filter Sensitive Fields based on role
    const filteredTrailers = trailersWithStats.map((trailer) =>
      filterSensitiveFields(trailer, session.user.role as any)
    );

    // 6. Return Success Response
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

    // Check if VIN already exists (only if VIN is provided)
    if (validated.vin && validated.vin.trim()) {
      const existingVIN = await prisma.trailer.findFirst({
        where: {
          vin: validated.vin.trim(),
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (existingVIN) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'VIN already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Determine MC number assignment
    // Rule: Explicit -> Context -> User Default -> Company Default
    const { McStateManager } = await import('@/lib/managers/McStateManager');
    let assignedMcNumberId: string | null = null;

    if (validated.mcNumberId) {
      if (await McStateManager.canAccessMc(session, validated.mcNumberId)) {
        // Validate MC number exists and belongs to company
        const isValid = await prisma.mcNumber.count({
          where: { id: validated.mcNumberId, companyId: session.user.companyId, deletedAt: null }
        });
        if (!isValid) {
          return NextResponse.json({
            success: false,
            error: { code: 'INVALID_MC_NUMBER', message: 'MC number not found or does not belong to your company' }
          }, { status: 400 });
        }
        assignedMcNumberId = validated.mcNumberId;
      } else {
        return NextResponse.json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have access to the selected MC number' }
        }, { status: 403 });
      }
    } else {
      // Fallback Logic
      assignedMcNumberId = await McStateManager.determineActiveCreationMc(session, request);
      if (!assignedMcNumberId) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'MC number is required and no default (Company or User) could be determined. Please assign an MC number explicitly.',
          },
        }, { status: 400 });
      }
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

    // Only set VIN if it's provided and not empty
    // This prevents unique constraint violations with null VINs
    const vinValue = validated.vin && validated.vin.trim() ? validated.vin.trim() : null;

    const trailer = await prisma.trailer.create({
      data: {
        trailerNumber: validated.trailerNumber,
        vin: vinValue,
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
        status: (validated.status as any) || undefined,
        fleetStatus: validated.fleetStatus || null,
        registrationExpiry,
        insuranceExpiry,
        inspectionExpiry,
        mcNumberId: assignedMcNumberId,
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

