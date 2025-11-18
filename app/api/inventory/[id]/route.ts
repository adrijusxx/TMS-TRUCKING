import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateInventoryItemSchema = z.object({
  itemNumber: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  partNumber: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  unit: z.string().optional(),
  quantityOnHand: z.number().nonnegative().optional(),
  reorderPoint: z.number().nonnegative().optional(),
  maxStock: z.number().nonnegative().optional().nullable(),
  minStock: z.number().nonnegative().optional().nullable(),
  unitCost: z.number().nonnegative().optional(),
  warehouseLocation: z.string().optional().nullable(),
  binLocation: z.string().optional().nullable(),
  preferredVendorId: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        preferredVendor: {
          select: {
            id: true,
            name: true,
            vendorNumber: true,
          },
        },
        transactions: {
          orderBy: {
            transactionDate: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Inventory item not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch inventory item',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateInventoryItemSchema.parse(body);

    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Inventory item not found' } },
        { status: 404 }
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: validatedData,
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

    return NextResponse.json({
      success: true,
      data: item,
    });
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

    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update inventory item',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role, 'trucks.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Inventory item not found' } },
        { status: 404 }
      );
    }

    await prisma.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete inventory item',
        },
      },
      { status: 500 }
    );
  }
}

