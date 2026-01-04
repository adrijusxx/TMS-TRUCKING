import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTruckSchema } from '@/lib/validations/truck';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { getTruckFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

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
    if (!hasPermission(session.user.role as any, 'trucks.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const equipmentType = searchParams.get('equipmentType');
    const licenseState = searchParams.get('licenseState');
    const mcNumberIdFilter = searchParams.get('mcNumberId');

    // Apply role-based filtering (separate from MC filtering)
    const roleFilter = getTruckFilter(
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

    // Extract OR clause from mcWhere if present (for MC filtering with null fallback)
    const mcOrClause = (mcWhere as any).OR;
    const { OR: _mcOr, ...mcWhereWithoutOr } = mcWhere as any;

    // Merge MC filter with role filter and deleted filter
    const where: any = {
      ...mcWhereWithoutOr,
      ...roleFilter,
      isActive: true,
      ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
    };

    // Handle explicit MC number filter from table filter (overrides default MC view)
    if (mcNumberIdFilter) {
      if (mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned') {
        where.mcNumberId = null;
      } else {
        where.mcNumberId = mcNumberIdFilter;
      }
    } else if (mcOrClause) {
      // Apply MC OR clause only if no explicit filter is set
      where.OR = mcOrClause;
    }

    if (status) {
      where.status = status;
    }

    if (make) {
      where.make = { contains: make, mode: 'insensitive' };
    }

    if (model) {
      where.model = { contains: model, mode: 'insensitive' };
    }

    if (equipmentType) {
      where.equipmentType = equipmentType;
    }

    if (licenseState) {
      where.state = { contains: licenseState, mode: 'insensitive' };
    }

    // Build search conditions
    if (search) {
      const searchConditions = [
        { truckNumber: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];

      // If there's already an OR clause (from MC filter), use AND to combine
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        where,
        select: {
          id: true,
          truckNumber: true,
          vin: true,
          licensePlate: true,
          make: true,
          model: true,
          year: true,
          equipmentType: true,
          status: true,
          isActive: true,
          deletedAt: true, // Include deletedAt for UI indicators
          odometerReading: true,
          mcNumber: {
            select: {
              id: true,
              number: true,
              companyName: true,
            },
          },
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
        },
        orderBy: { truckNumber: 'asc' },
        skip,
        take: limit,
      }),
      prisma.truck.count({ where }),
    ]);

    // Filter sensitive fields based on role
    const filteredTrucks = trucks.map((truck) =>
      filterSensitiveFields(truck, session.user.role as any)
    );

    return NextResponse.json({
      success: true,
      data: filteredTrucks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Truck list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
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

    // Check permission to create trucks
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'trucks.create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create trucks',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createTruckSchema.parse(body);

    // Check if truck number already exists within this company
    const existingTruck = await prisma.truck.findFirst({
      where: {
        companyId: session.user.companyId,
        truckNumber: validated.truckNumber
      },
    });

    if (existingTruck) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Truck number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Check if VIN already exists within this company
    const existingVIN = await prisma.truck.findFirst({
      where: {
        companyId: session.user.companyId,
        vin: validated.vin
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
    const registrationExpiry = validated.registrationExpiry instanceof Date
      ? validated.registrationExpiry
      : new Date(validated.registrationExpiry);
    const insuranceExpiry = validated.insuranceExpiry instanceof Date
      ? validated.insuranceExpiry
      : new Date(validated.insuranceExpiry);
    const inspectionExpiry = validated.inspectionExpiry instanceof Date
      ? validated.inspectionExpiry
      : new Date(validated.inspectionExpiry);

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

    const truck = await prisma.truck.create({
      data: {
        ...validated,
        registrationExpiry,
        insuranceExpiry,
        inspectionExpiry,
        companyId: session.user.companyId,
        mcNumberId: assignedMcNumberId, // Admin can choose, employee uses their default
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: truck,
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

    console.error('Truck creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

