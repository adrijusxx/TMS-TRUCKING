import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';
import { createTrailerSchema } from '@/lib/validations/trailer';
import { z } from 'zod';
import { getTrailerFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { TrailerQueryManager } from '@/lib/managers/TrailerQueryManager';

/**
 * GET /api/trailers
 * List all trailers with load statistics
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

    if (!hasPermission(session.user.role as any, 'trailers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const mcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const mcNumberIdFilter = searchParams.get('mcNumberId');
    const skipStats = searchParams.get('skipStats') === 'true' || limit >= 500;

    const roleFilter = getTrailerFilter(
      createFilterContext(session.user.id, session.user.role as any, session.user.companyId)
    );
    const includeDeleted = parseIncludeDeleted(request);
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

    const where: any = {
      ...mcWhere,
      ...roleFilter,
      ...(deletedFilter && { ...deletedFilter }),
    };

    if (mcNumberIdFilter) {
      where.mcNumberId = mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned' ? null : mcNumberIdFilter;
    }

    if (search) {
      const searchOr = [
        { trailerNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    const [trailers, total] = await Promise.all([
      prisma.trailer.findMany({
        where,
        include: {
          mcNumber: { select: { id: true, number: true, companyName: true } },
          assignedTruck: { select: { id: true, truckNumber: true } },
          operatorDriver: {
            select: {
              id: true, driverNumber: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trailer.count({ where }),
    ]);

    // Fetch load statistics via manager
    const trailerIds = trailers.map(t => t.id);
    const trailerNumbers = trailers.map(t => t.trailerNumber);
    const statsMap = await TrailerQueryManager.getTrailerLoadStats(trailerIds, trailerNumbers, skipStats);

    // Transform and filter
    const trailersWithStats = trailers.map(t => TrailerQueryManager.transformListItem(t, statsMap, skipStats));
    const filteredTrailers = trailersWithStats.map(t => filterSensitiveFields(t, session.user.role as any));

    return NextResponse.json({
      success: true,
      data: filteredTrailers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching trailers:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch trailers' } },
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

    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to create trailers' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createTrailerSchema.parse(body);

    // Check duplicates
    const existingTrailer = await prisma.trailer.findFirst({
      where: { trailerNumber: validated.trailerNumber, companyId: session.user.companyId, deletedAt: null },
    });
    if (existingTrailer) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Trailer number already exists' } },
        { status: 409 }
      );
    }

    if (validated.vin && validated.vin.trim()) {
      const existingVIN = await prisma.trailer.findFirst({
        where: { vin: validated.vin.trim(), companyId: session.user.companyId, deletedAt: null },
      });
      if (existingVIN) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'VIN already exists' } },
          { status: 409 }
        );
      }
    }

    // MC number assignment
    const { McStateManager } = await import('@/lib/managers/McStateManager');
    let assignedMcNumberId: string | null = null;

    if (validated.mcNumberId) {
      if (await McStateManager.canAccessMc(session, validated.mcNumberId)) {
        const isValid = await prisma.mcNumber.count({
          where: { id: validated.mcNumberId, companyId: session.user.companyId, deletedAt: null },
        });
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_MC_NUMBER', message: 'MC number not found or does not belong to your company' } },
            { status: 400 }
          );
        }
        assignedMcNumberId = validated.mcNumberId;
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to the selected MC number' } },
          { status: 403 }
        );
      }
    } else {
      assignedMcNumberId = await McStateManager.determineActiveCreationMc(session, request);
      if (!assignedMcNumberId) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'MC number is required and no default could be determined.' } },
          { status: 400 }
        );
      }
    }

    const toDate = (val: any) => val ? (val instanceof Date ? val : new Date(val)) : null;
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
        registrationExpiry: toDate(validated.registrationExpiry),
        insuranceExpiry: toDate(validated.insuranceExpiry),
        inspectionExpiry: toDate(validated.inspectionExpiry),
        mcNumberId: assignedMcNumberId,
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: trailer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Trailer creation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
