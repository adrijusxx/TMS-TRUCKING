import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withPermission, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
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

export const GET = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const item = await prisma.inventoryItem.findFirst({
    where: {
      id,
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
    throw new NotFoundError('Inventory item');
  }

  return successResponse(item);
});

export const PATCH = withPermission('trucks.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateInventoryItemSchema.parse(body);

    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError('Inventory item');
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
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

    return successResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withPermission('trucks.delete', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const item = await prisma.inventoryItem.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
  });

  if (!item) {
    throw new NotFoundError('Inventory item');
  }

  await prisma.inventoryItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return successResponse({ message: 'Inventory item deleted successfully' });
});
