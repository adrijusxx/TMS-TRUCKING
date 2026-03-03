import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { executeListQuery, type EntityQueryConfig } from '@/lib/managers/BaseQueryManager';

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

const locationQueryConfig: EntityQueryConfig = {
  prismaModel: 'location',
  searchFields: ['locationNumber', 'name', 'address', 'city'],
  equalityFilters: { type: 'type' },
  containsFilters: { city: 'city', state: 'state' },
  defaultOrderBy: { name: 'asc' },
  responseFormat: 'nested',
  dataKey: 'locations',
};

/**
 * GET /api/locations
 * List all locations
 */
export async function GET(request: NextRequest) {
  return executeListQuery(request, locationQueryConfig);
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

