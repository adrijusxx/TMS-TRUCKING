import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { generateBreakdownCaseNumber } from '@/lib/utils/breakdown-numbering';
import { z } from 'zod';

const createBreakdownSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  loadId: z.string().optional(),
  driverId: z.string().optional(),
  mcNumberId: z.string().cuid().optional(),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  odometerReading: z.number().nonnegative().optional(),
  breakdownType: z.enum([
    'ENGINE_FAILURE',
    'TRANSMISSION_FAILURE',
    'BRAKE_FAILURE',
    'TIRE_FLAT',
    'TIRE_BLOWOUT',
    'ELECTRICAL_ISSUE',
    'COOLING_SYSTEM',
    'FUEL_SYSTEM',
    'SUSPENSION',
    'ACCIDENT_DAMAGE',
    'WEATHER_RELATED',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(1, 'Description is required'),
  serviceProvider: z.string().optional(),
  serviceContact: z.string().optional(),
  serviceAddress: z.string().optional(),
  telematicsSnapshot: z.any().optional(),
});

/**
 * GET /api/breakdowns
 * List all breakdowns for the company
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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const truckId = searchParams.get('truckId');
    const driverId = searchParams.get('driverId');
    const breakdownType = searchParams.get('breakdownType');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (truckId) {
      where.truckId = truckId;
    }
    if (driverId) {
      where.driverId = driverId;
    }
    if (breakdownType) {
      where.breakdownType = breakdownType;
    }
    if (startDate || endDate) {
      where.reportedAt = {};
      if (startDate) {
        where.reportedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.reportedAt.lte = new Date(endDate);
      }
    }
    if (search) {
      where.OR = [
        { breakdownNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { truck: { truckNumber: { contains: search, mode: 'insensitive' } } },
        { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { driver: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [breakdowns, total] = await Promise.all([
      prisma.breakdown.findMany({
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
          load: {
            select: {
              id: true,
              loadNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          mcNumber: {
            select: {
              id: true,
              number: true,
              companyName: true,
            },
          },
          payments: {
            select: {
              id: true,
              paymentNumber: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
              type: true,
            },
          },
        },
        orderBy: {
          reportedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.breakdown.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        breakdowns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching breakdowns:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdowns',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/breakdowns
 * Create a new breakdown
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
    const validatedData = createBreakdownSchema.parse(body);

    // Verify MC number belongs to company if provided
    if (validatedData.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: validatedData.mcNumberId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'MC Number not found' },
          },
          { status: 404 }
        );
      }
    }

    // Generate breakdown case number in BD-YYYY-XXXX format
    const breakdownNumber = await generateBreakdownCaseNumber(session.user.companyId);

    const breakdownData: any = {
      truckId: validatedData.truckId,
      location: validatedData.location,
      odometerReading: validatedData.odometerReading ?? 0, // Required field, default to 0 if somehow missing
      breakdownType: validatedData.breakdownType,
      description: validatedData.description,
      priority: validatedData.priority ?? 'MEDIUM',
      loadId: validatedData.loadId ?? undefined,
      driverId: validatedData.driverId ?? undefined,
      mcNumberId: validatedData.mcNumberId ?? undefined,
      address: validatedData.address ?? undefined,
      city: validatedData.city ?? undefined,
      state: validatedData.state ?? undefined,
      zip: validatedData.zip ?? undefined,
      latitude: validatedData.latitude ?? undefined,
      longitude: validatedData.longitude ?? undefined,
      serviceProvider: validatedData.serviceProvider ?? undefined,
      serviceContact: validatedData.serviceContact ?? undefined,
      serviceAddress: validatedData.serviceAddress ?? undefined,
      breakdownNumber,
      companyId: session.user.companyId,
      reportedBy: session.user.id,
      status: 'REPORTED',
      telematicsSnapshot: validatedData.telematicsSnapshot ?? undefined,
    };

    // Add optional fields if they exist in the validated data
    if ('problem' in body && body.problem) {
      breakdownData.problem = body.problem;
    }
    if ('problemCategory' in body && body.problemCategory) {
      breakdownData.problemCategory = body.problemCategory;
    }

    const breakdown = await prisma.breakdown.create({
      data: breakdownData,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
          },
        },
        load: {
          select: {
            id: true,
            loadNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: breakdown,
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

    console.error('Error creating breakdown:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create breakdown',
        },
      },
      { status: 500 }
    );
  }
}

