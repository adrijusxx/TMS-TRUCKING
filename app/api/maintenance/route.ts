import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createMaintenanceSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  type: z.enum([
    'OIL_CHANGE',
    'TIRE_ROTATION',
    'BRAKE_SERVICE',
    'INSPECTION',
    'REPAIR',
    'PMI',
    'ENGINE',
    'TRANSMISSION',
    'OTHER',
  ]),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nonnegative(),
  mileage: z.number().nonnegative(),
  scheduledDate: z.string().datetime().optional().nullable(),
  completedDate: z.string().datetime().optional().nullable(),
  vendor: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/maintenance
 * List all maintenance records
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const truckId = searchParams.get('truckId');
    const type = searchParams.get('type');

    const where: any = {
      truck: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
    };

    if (truckId) {
      where.truckId = truckId;
    }
    if (type) {
      where.type = type;
    }

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          truck: {
            select: {
              id: true,
              truckNumber: true,
              make: true,
              model: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching maintenance records:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch maintenance records',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maintenance
 * Create a new maintenance record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // Verify truck belongs to company
    const truck = await prisma.truck.findFirst({
      where: {
        id: validatedData.truckId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!truck) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Truck not found' } },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects
    const recordData: any = { ...validatedData };
    if (validatedData.scheduledDate) {
      recordData.scheduledDate = new Date(validatedData.scheduledDate);
    }
    if (validatedData.completedDate) {
      recordData.completedDate = new Date(validatedData.completedDate);
    }

    const record = await prisma.maintenanceRecord.create({
      data: recordData,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
          },
        },
      },
    });

    // Update truck's last/next maintenance if completed
    if (record.completedDate) {
      await prisma.truck.update({
        where: { id: truck.id },
        data: {
          lastMaintenance: record.completedDate,
          odometerReading: record.mileage,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating maintenance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create maintenance record',
        },
      },
      { status: 500 }
    );
  }
}

