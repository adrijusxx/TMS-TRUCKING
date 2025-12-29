import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createInspectionSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  driverId: z.string().optional().nullable(),
  inspectionType: z.enum([
    'DOT_ANNUAL',
    'DOT_LEVEL_1',
    'DOT_LEVEL_2',
    'DOT_LEVEL_3',
    'DOT_PRE_TRIP',
    'DOT_POST_TRIP',
    'STATE_INSPECTION',
    'COMPANY_INSPECTION',
    'PMI',
    'SAFETY_INSPECTION',
  ]),
  inspectionDate: z.string().datetime(),
  performedBy: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.enum(['PASSED', 'FAILED', 'CONDITIONAL', 'OUT_OF_SERVICE', 'PENDING']).default('PASSED'),
  defects: z.number().int().nonnegative().default(0),
  defectDetails: z.string().optional().nullable(),
  oosStatus: z.boolean().default(false),
  oosItems: z.string().optional().nullable(),
  oosSeverity: z.string().optional().nullable(),
  odometerReading: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  inspectorNotes: z.string().optional().nullable(),
  nextInspectionDue: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/inspections
 * List all inspections
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
    const driverId = searchParams.get('driverId');
    const inspectionType = searchParams.get('inspectionType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (truckId) where.truckId = truckId;
    if (driverId) where.driverId = driverId;
    if (inspectionType) where.inspectionType = inspectionType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.inspectionDate = {};
      if (startDate) {
        where.inspectionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.inspectionDate.lte = new Date(endDate);
      }
    }
    if (search) {
      where.OR = [
        { inspectionNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { truck: { truckNumber: { contains: search, mode: 'insensitive' } } },
        { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { driver: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
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
          driver: {
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
          inspectionDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inspection.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        inspections,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch inspections',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inspections
 * Create a new inspection
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
    const validatedData = createInspectionSchema.parse(body);

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

    // Generate inspection number
    const year = new Date().getFullYear();
    const count = await prisma.inspection.count({
      where: {
        companyId: session.user.companyId,
        inspectionNumber: {
          startsWith: `INS-${year}-`,
        },
      },
    });
    const inspectionNumber = `INS-${year}-${String(count + 1).padStart(6, '0')}`;

    // Convert date strings to Date objects
    const inspectionData: any = {
      ...validatedData,
      inspectionNumber,
      inspectionDate: new Date(validatedData.inspectionDate),
      driverId: validatedData.driverId || null,
    };
    if (validatedData.nextInspectionDue) {
      inspectionData.nextInspectionDue = new Date(validatedData.nextInspectionDue);
    }

    const inspection = await prisma.inspection.create({
      data: inspectionData,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
          },
        },
        driver: {
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
    });

    return NextResponse.json(
      {
        success: true,
        data: inspection,
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
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating inspection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create inspection',
        },
      },
      { status: 500 }
    );
  }
}

