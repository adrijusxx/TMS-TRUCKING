import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createTruckSchema } from '@/lib/validations/truck';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause, getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { getTruckFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const equipmentType = searchParams.get('equipmentType');
    const licenseState = searchParams.get('licenseState');
    const mcViewMode = searchParams.get('mc'); // 'all', 'current', 'multi', or specific MC ID
    const isAdmin = session.user?.role === 'ADMIN';

    // Check if multi-MC mode is active
    const mcState = await McStateManager.getMcState(session, request);
    const isMultiMode = mcState.viewMode === 'multi' || mcViewMode === 'multi';

    // Build base where clause with MC number filtering if applicable
    let baseFilter: any;
    if (isMultiMode && mcState.mcNumberIds.length > 0) {
      // Use multi-MC filtering
      baseFilter = await buildMultiMcNumberWhereClause(session, request);
    } else {
      // Use single MC or all MCs filtering
      baseFilter = await buildMcNumberWhereClause(session, request);
    }
    
    // Convert mcNumber (string) to mcNumberId (foreign key) for trucks
    // Trucks use mcNumberId relation, not mcNumber string field
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

    // Apply role-based filtering
    const { mcNumberId } = await getCurrentMcNumber(session, request);
    const roleFilter = getTruckFilter(
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
    
    // Admin-only: Override MC filter based on view mode
    if (isAdmin && mcViewMode === 'all') {
      // Remove MC number filter to show all MCs (admin only)
      if (baseFilter.mcNumber) {
        delete baseFilter.mcNumber;
      }
      if (baseFilter.mcNumberId) {
        delete baseFilter.mcNumberId;
      }
    } else if (isAdmin && mcViewMode && mcViewMode !== 'current' && mcViewMode !== 'multi' && mcViewMode !== null) {
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
          // Trucks now use mcNumberId (foreign key), not mcNumber (string)
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
    // Non-admin users: always use baseFilter (their assigned MC)

    // Merge role filter
    const where: any = {
      ...baseFilter,
      ...roleFilter,
      isActive: true,
      deletedAt: null,
    };

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

    if (search) {
      where.OR = [
        { truckNumber: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        where,
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

    // Check if truck number already exists
    const existingTruck = await prisma.truck.findUnique({
      where: { truckNumber: validated.truckNumber },
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

    // Check if VIN already exists
    const existingVIN = await prisma.truck.findUnique({
      where: { vin: validated.vin },
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

    const truck = await prisma.truck.create({
      data: {
        ...validated,
        registrationExpiry,
        insuranceExpiry,
        inspectionExpiry,
        companyId: session.user.companyId,
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

