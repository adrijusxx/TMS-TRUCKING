import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createVendorSchema = z.object({
  vendorNumber: z.string().min(1, 'Vendor number is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum([
    'SUPPLIER',
    'PARTS_VENDOR',
    'SERVICE_PROVIDER',
    'FUEL_VENDOR',
    'REPAIR_SHOP',
    'TIRE_SHOP',
    'OTHER',
  ]).default('SUPPLIER'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  billingCity: z.string().optional().nullable(),
  billingState: z.string().optional().nullable(),
  billingZip: z.string().optional().nullable(),
  billingEmail: z.string().email().optional().nullable(),
  paymentTerms: z.number().int().nonnegative().default(30),
  creditLimit: z.number().nonnegative().optional().nullable(),
  taxId: z.string().optional().nullable(),
  w9OnFile: z.boolean().default(false),
});

/**
 * GET /api/vendors
 * List all vendors
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

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { vendorNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          contacts: {
            where: {
              isPrimary: true,
            },
            take: 1,
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch vendors',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendors
 * Create a new vendor
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
    const validatedData = createVendorSchema.parse(body);

    // Check if vendor number already exists
    const existing = await prisma.vendor.findFirst({
      where: {
        vendorNumber: validatedData.vendorNumber,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Vendor number already exists' } },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
      },
      include: {
        contacts: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: vendor,
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

    console.error('Error creating vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create vendor',
        },
      },
      { status: 500 }
    );
  }
}

