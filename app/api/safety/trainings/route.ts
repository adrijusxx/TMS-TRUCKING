import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createSafetyTrainingSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  trainingType: z.enum([
    'DEFENSIVE_DRIVING',
    'HAZMAT',
    'HOURS_OF_SERVICE',
    'ELD_TRAINING',
    'FIRST_AID',
    'CPR',
    'FIRE_SAFETY',
    'BACKING_SAFETY',
    'LOAD_SECUREMENT',
    'DOCK_SAFETY',
    'OTHER',
  ]),
  trainingName: z.string().min(1, 'Training name is required'),
  trainingDate: z.string().datetime(),
  completionDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  provider: z.string().optional().nullable(),
  instructor: z.string().optional().nullable(),
  certificateNumber: z.string().optional().nullable(),
  completed: z.boolean().default(false),
  passed: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable(),
  score: z.number().nonnegative().optional().nullable(),
});

/**
 * GET /api/safety/trainings
 * List all safety trainings
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
    const driverId = searchParams.get('driverId');
    const trainingType = searchParams.get('trainingType');
    const status = searchParams.get('status');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (driverId) where.driverId = driverId;
    if (trainingType) where.trainingType = trainingType;
    if (status) where.status = status;

    const [trainings, total] = await Promise.all([
      prisma.safetyTraining.findMany({
        where,
        include: {
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
          trainingDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.safetyTraining.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trainings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching safety trainings:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch safety trainings',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/safety/trainings
 * Create a new safety training
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

    if (!hasPermission(session.user.role, 'drivers.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSafetyTrainingSchema.parse(body);

    // Verify driver belongs to company
    const driver = await prisma.driver.findFirst({
      where: {
        id: validatedData.driverId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } },
        { status: 404 }
      );
    }

    const training = await prisma.safetyTraining.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        trainingDate: new Date(validatedData.trainingDate),
        completionDate: validatedData.completionDate ? new Date(validatedData.completionDate) : null,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      },
      include: {
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
        data: training,
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

    console.error('Error creating safety training:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create safety training',
        },
      },
      { status: 500 }
    );
  }
}

