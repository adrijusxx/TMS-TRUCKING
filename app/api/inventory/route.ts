import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createInventoryItemSchema = z.object({
  itemNumber: z.string().min(1, 'Item number is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  partNumber: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  unit: z.string().default('EA'),
  quantityOnHand: z.number().nonnegative().default(0),
  reorderPoint: z.number().nonnegative().default(0),
  maxStock: z.number().nonnegative().optional().nullable(),
  minStock: z.number().nonnegative().optional().nullable(),
  unitCost: z.number().nonnegative(),
  warehouseLocation: z.string().optional().nullable(),
  binLocation: z.string().optional().nullable(),
  preferredVendorId: z.string().optional().nullable(),
});

/**
 * GET /api/inventory
 * List all inventory items
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
    const category = searchParams.get('category');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { itemNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          preferredVendor: {
            select: {
              id: true,
              name: true,
              vendorNumber: true,
            },
          },
        },
        orderBy: {
          itemNumber: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch inventory',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item
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
    const validatedData = createInventoryItemSchema.parse(body);

    // Check if item number already exists
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        itemNumber: validatedData.itemNumber,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Item number already exists' } },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        ...validatedData,
        companyId: session.user.companyId,
        preferredVendorId: validatedData.preferredVendorId || null,
      },
      include: {
        preferredVendor: {
          select: {
            id: true,
            name: true,
            vendorNumber: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: item,
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

    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create inventory item',
        },
      },
      { status: 500 }
    );
  }
}

