import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity-log';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  loadIds: z.array(z.string().cuid()).min(1),
  updates: z.object({
    status: z.enum([
      'PENDING',
      'ASSIGNED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'LOADED',
      'EN_ROUTE_DELIVERY',
      'AT_DELIVERY',
      'DELIVERED',
      'INVOICED',
      'PAID',
    ]).optional(),
    driverId: z.string().cuid().nullable().optional(),
    truckId: z.string().cuid().nullable().optional(),
  }),
});

const bulkDeleteSchema = z.object({
  loadIds: z.array(z.string().cuid()).min(1),
});

/**
 * Bulk update loads
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    // Verify all loads belong to company
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (loads.length !== validated.loadIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LOADS',
            message: 'Some loads not found or do not belong to your company',
          },
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (validated.updates.status) {
      updateData.status = validated.updates.status;
    }
    if (validated.updates.driverId !== undefined) {
      updateData.driverId = validated.updates.driverId;
    }
    if (validated.updates.truckId !== undefined) {
      updateData.truckId = validated.updates.truckId;
    }

    // If status is being updated, create status history records
    if (validated.updates.status) {
      // Get existing loads to create history
      const loadsToUpdate = await prisma.load.findMany({
        where: {
          id: { in: validated.loadIds },
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
        },
      });

      // Create status history for each load
      await Promise.all(
        loadsToUpdate.map((load) =>
          prisma.loadStatusHistory.create({
            data: {
              loadId: load.id,
              status: validated.updates.status!,
              notes: 'Bulk status update',
              createdBy: session.user.id,
            },
          })
        )
      );
    }

    // Update loads
    const updated = await prisma.load.updateMany({
      where: {
        id: { in: validated.loadIds },
      },
      data: updateData,
    });

    // Create activity log
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Load',
      description: `Bulk updated ${updated.count} load(s)`,
      metadata: {
        loadIds: validated.loadIds,
        updates: validated.updates,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: updated.count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Bulk update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

/**
 * Bulk delete loads (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = bulkDeleteSchema.parse(body);

    // Verify loads belong to company (only get the ones that exist and aren't deleted)
    const loads = await prisma.load.findMany({
      where: {
        id: { in: validated.loadIds },
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const validLoadIds = loads.map((load) => load.id);

    if (validLoadIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_VALID_LOADS',
            message: 'No valid loads found to delete',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete loads (only the valid ones)
    const deleted = await prisma.load.updateMany({
      where: {
        id: { in: validLoadIds },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log if some loads were skipped
    if (validLoadIds.length < validated.loadIds.length) {
      console.log(`[Bulk Delete] Skipped ${validated.loadIds.length - validLoadIds.length} loads (already deleted or not found)`);
    }

    // Create activity log
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'Load',
      description: `Bulk deleted ${deleted.count} load(s)`,
      metadata: {
        loadIds: validated.loadIds,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleted.count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Bulk delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

