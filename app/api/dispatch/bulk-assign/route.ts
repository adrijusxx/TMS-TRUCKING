import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyLoadAssigned } from '@/lib/notifications/triggers';

const bulkAssignSchema = z.object({
  loadIds: z.array(z.string().cuid()).min(1, 'At least one load is required'),
  driverId: z.string().cuid().optional(),
  truckId: z.string().cuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = bulkAssignSchema.parse(body);

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

    // Verify driver and truck if provided
    if (validated.driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!driver) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Driver not found' },
          },
          { status: 404 }
        );
      }
    }

    if (validated.truckId) {
      const truck = await prisma.truck.findFirst({
        where: {
          id: validated.truckId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!truck) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Truck not found' },
          },
          { status: 404 }
        );
      }
    }

    // Update loads
    const updateData: any = {};
    if (validated.driverId) updateData.driverId = validated.driverId;
    if (validated.truckId) updateData.truckId = validated.truckId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Must provide either driverId or truckId',
          },
        },
        { status: 400 }
      );
    }

    const updated = await prisma.load.updateMany({
      where: {
        id: { in: validated.loadIds },
      },
      data: updateData,
    });

    // Create status history entries
    const statusHistoryEntries = validated.loadIds.map((loadId) => ({
      loadId,
      status: 'ASSIGNED' as const,
      notes: validated.driverId && validated.truckId
        ? `Bulk assigned to driver and truck`
        : validated.driverId
        ? 'Bulk assigned to driver'
        : 'Bulk assigned to truck',
      createdBy: session.user.id,
    }));

    await prisma.loadStatusHistory.createMany({
      data: statusHistoryEntries,
    });

    // Send notifications for newly assigned loads
    if (validated.driverId) {
      const assignedLoads = await prisma.load.findMany({
        where: {
          id: { in: validated.loadIds },
          driverId: validated.driverId,
        },
      });

      for (const load of assignedLoads) {
        await notifyLoadAssigned(load.id, validated.driverId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${updated.count} load(s)`,
      data: {
        updatedCount: updated.count,
        loadIds: validated.loadIds,
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
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Bulk assign error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

