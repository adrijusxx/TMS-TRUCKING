import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createLocationSchema = z.object({
  locationNumber: z.string().min(1, 'Location number is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum([
    'PICKUP',
    'DELIVERY',
    'TERMINAL',
    'WAREHOUSE',
    'CUSTOMER',
    'VENDOR',
    'REPAIR_SHOP',
    'FUEL_STOP',
    'REST_AREA',
    'SCALE',
  ]).default('PICKUP'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'Zip is required'),
  country: z.string().default('USA'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  operatingHours: z.any().optional().nullable(),
  notes: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
});

/**
 * GET /api/locations
 * List all locations
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
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { locationNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.location.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        locations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch locations',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/locations
 * Create a new location
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

    if (!hasPermission(session.user.role, 'customers.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);

    // Check if location number already exists
    const existing = await prisma.location.findFirst({
      where: {
        locationNumber: validatedData.locationNumber,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Location number already exists' } },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: location,
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

    console.error('Error creating location:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create location',
        },
      },
      { status: 500 }
    );
  }
}

