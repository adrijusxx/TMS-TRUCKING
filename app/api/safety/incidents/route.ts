import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createSafetyIncidentSchema = z.object({
  driverId: z.string().optional().nullable(),
  truckId: z.string().optional().nullable(),
  loadId: z.string().optional().nullable(),
  incidentType: z.enum([
    'ACCIDENT',
    'COLLISION',
    'ROLLOVER',
    'FIRE',
    'SPILL',
    'INJURY',
    'FATALITY',
    'HAZMAT_INCIDENT',
    'EQUIPMENT_FAILURE',
    'DRIVER_ERROR',
    'OTHER',
  ]),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL', 'FATAL']).default('MINOR'),
  date: z.string().datetime(),
  time: z.string().optional().nullable(),
  location: z.string().min(1, 'Location is required'),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  contributingFactors: z.string().optional().nullable(),
  weatherConditions: z.string().optional().nullable(),
  roadConditions: z.string().optional().nullable(),
  injuriesInvolved: z.boolean().default(false),
  fatalitiesInvolved: z.boolean().default(false),
  vehicleDamage: z.string().optional().nullable(),
  propertyDamage: z.string().optional().nullable(),
  dotReportable: z.boolean().default(false),
  dotReportNumber: z.string().optional().nullable(),
  policeReportNumber: z.string().optional().nullable(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  insuranceClaimNumber: z.string().optional().nullable(),
});

/**
 * GET /api/safety/incidents
 * List all safety incidents
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
    const incidentType = searchParams.get('incidentType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const truckId = searchParams.get('truckId');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (incidentType) where.incidentType = incidentType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (truckId) where.truckId = truckId;

    const [incidents, total] = await Promise.all([
      prisma.safetyIncident.findMany({
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
          truck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
          load: {
            select: {
              id: true,
              loadNumber: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.safetyIncident.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching safety incidents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch safety incidents',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/safety/incidents
 * Create a new safety incident
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

    if (!hasPermission(session.user.role, 'trucks.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSafetyIncidentSchema.parse(body);

    // Generate incident number
    const year = new Date().getFullYear();
    const count = await prisma.safetyIncident.count({
      where: {
        companyId: session.user.companyId,
        incidentNumber: {
          startsWith: `SAF-${year}-`,
        },
      },
    });
    const incidentNumber = `SAF-${year}-${String(count + 1).padStart(6, '0')}`;

    const incident = await prisma.safetyIncident.create({
      data: {
        ...validatedData,
        incidentNumber,
        companyId: session.user.companyId,
        date: new Date(validatedData.date),
        driverId: validatedData.driverId || null,
        truckId: validatedData.truckId || null,
        loadId: validatedData.loadId || null,
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
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        load: {
          select: {
            id: true,
            loadNumber: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: incident,
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

    console.error('Error creating safety incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create safety incident',
        },
      },
      { status: 500 }
    );
  }
}

