import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTruckSchema } from '@/lib/validations/truck';
import { hasPermission } from '@/lib/permissions';
import { McStateManager } from '@/lib/managers/McStateManager';
import { getTruckFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';
import { handleApiError } from '@/lib/api/route-helpers';
import { executeListQuery, type EntityQueryConfig } from '@/lib/managers/BaseQueryManager';

const truckQueryConfig: EntityQueryConfig = {
  prismaModel: 'truck',
  viewPermission: 'trucks.view',
  useMcFilter: true,
  mcAllowNullFallback: true,
  searchFields: ['truckNumber', 'vin', 'licensePlate', 'make', 'model'],
  equalityFilters: { status: 'status', equipmentType: 'equipmentType' },
  containsFilters: { make: 'make', model: 'model', licenseState: 'state' },
  staticWhere: { isActive: true },
  defaultOrderBy: { truckNumber: 'asc' },
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
    deletedAt: true,
    odometerReading: true,
    mcNumber: { select: { id: true, number: true, companyName: true } },
    currentDrivers: {
      select: {
        id: true, driverNumber: true,
        user: { select: { firstName: true, lastName: true } },
      },
    },
    inspections: {
      where: { inspectionType: 'DOT_ANNUAL', deletedAt: null },
      orderBy: { nextInspectionDue: 'desc' },
      take: 1,
      select: { nextInspectionDue: true },
    },
    _count: { select: { documents: { where: { deletedAt: null } } } },
  },
  roleFilter: (session) =>
    getTruckFilter(
      createFilterContext(session.user.id, session.user.role as any, session.user.companyId)
    ),
  transformItem: (item, session) => {
    const withExtras = {
      ...item,
      nextInspectionDue: item.inspections?.[0]?.nextInspectionDue ?? null,
    };
    return filterSensitiveFields(withExtras, session.user.role as any);
  },
  responseFormat: 'standard',
};

export async function GET(request: NextRequest) {
  return executeListQuery(request, truckQueryConfig);
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
    return handleApiError(error);
  }
}

