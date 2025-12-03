import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyLoadAssigned } from '@/lib/notifications/triggers';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';
import { emitLoadAssigned, emitDispatchUpdated } from '@/lib/realtime/emitEvent';

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
    let driver = null;
    if (validated.driverId) {
      driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
        select: {
          id: true,
          driverNumber: true,
          payType: true,
          payRate: true,
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
    if (!validated.driverId && !validated.truckId) {
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

    // Update each load individually to calculate driver pay
    const updatePromises = loads.map(async (load) => {
      const updateData: any = {};
      if (validated.driverId) updateData.driverId = validated.driverId;
      if (validated.truckId) updateData.truckId = validated.truckId;

      // Calculate driver pay if driver is being assigned and driverPay is not set
      if (validated.driverId && driver && (!load.driverPay || load.driverPay === 0)) {
        const calculatedPay = calculateDriverPay(
          {
            payType: driver.payType,
            payRate: driver.payRate,
          },
          {
            totalMiles: load.totalMiles,
            loadedMiles: load.loadedMiles,
            emptyMiles: load.emptyMiles,
            revenue: load.revenue,
          }
        );
        updateData.driverPay = calculatedPay;
      }

      return prisma.load.update({
        where: { id: load.id },
        data: updateData,
      });
    });

    await Promise.all(updatePromises);

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

    // Send notifications and emit real-time events for newly assigned loads
    if (validated.driverId) {
      const assignedLoads = await prisma.load.findMany({
        where: {
          id: { in: validated.loadIds },
          driverId: validated.driverId,
        },
        include: {
          customer: { select: { name: true } },
          driver: { select: { driverNumber: true } },
        },
      });

      for (const load of assignedLoads) {
        await notifyLoadAssigned(load.id, validated.driverId);
        emitLoadAssigned(load.id, validated.driverId, load);
      }
    }

    // Emit bulk assignment event
    emitDispatchUpdated({ 
      type: 'bulk_assigned', 
      loadIds: validated.loadIds,
      driverId: validated.driverId,
      truckId: validated.truckId,
      count: loads.length,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${loads.length} load(s)`,
      data: {
        updatedCount: loads.length,
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
            details: error.issues,
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

