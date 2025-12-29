import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';
import { emitLoadAssigned, emitDispatchUpdated } from '@/lib/realtime/emitEvent';
import { notifyLoadAssigned } from '@/lib/notifications/triggers';

const assignLoadSchema = z.object({
  driverId: z.string().min(1, 'Driver is required').optional(),
  truckId: z.string().min(1, 'Truck is required').optional(),
}).refine((data) => data.driverId || data.truckId, {
  message: 'At least one of driver or truck must be provided',
  path: ['driverId'],
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const loadId = resolvedParams.id;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = assignLoadSchema.parse(body);

    // Verify load exists and belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Verify driver and truck belong to company (if provided)
    let driver = null;
    let truck = null;

    if (validated.driverId) {
      driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          companyId: session.user.companyId,
          isActive: true,
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
      truck = await prisma.truck.findFirst({
        where: {
          id: validated.truckId,
          companyId: session.user.companyId,
          isActive: true,
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

    // Prepare update data
    const updateData: any = {
      status: 'ASSIGNED',
      assignedAt: new Date(),
    };

    if (validated.driverId) {
      updateData.driverId = validated.driverId;
      
      // Calculate driver pay based on driver's pay type and rate
      if (driver) {
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
        
        // Only set driverPay if it's not already manually set or if it's 0
        if (!load.driverPay || load.driverPay === 0) {
          updateData.driverPay = calculatedPay;
        }
      }
    }

    if (validated.truckId) {
      updateData.truckId = validated.truckId;
    }

    // Update load with assignment
    const updatedLoad = await prisma.load.update({
      where: { id: loadId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
          },
        },
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
      },
    });

    // Create status history
    const assignmentNotes = [];
    if (driver) {
      assignmentNotes.push(`driver ${driver.driverNumber}`);
    }
    if (truck) {
      assignmentNotes.push(`truck ${truck.truckNumber}`);
    }

    await prisma.loadStatusHistory.create({
      data: {
        loadId: loadId,
        status: 'ASSIGNED',
        createdBy: session.user.id,
        notes: `Assigned to ${assignmentNotes.join(' and ')}`,
      },
    });

    // Update driver and truck status (if assigned)
    const updates = [];
    if (driver && validated.driverId) {
      updates.push(
        prisma.driver.update({
          where: { id: validated.driverId },
          data: { status: 'ON_DUTY' },
        })
      );
    }
    if (truck && validated.truckId) {
      updates.push(
        prisma.truck.update({
          where: { id: validated.truckId },
          data: { status: 'IN_USE' },
        })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Emit real-time events
    emitLoadAssigned(loadId, validated.driverId || '', updatedLoad);
    emitDispatchUpdated({ 
      type: 'load_assigned', 
      loadId, 
      driverId: validated.driverId,
      truckId: validated.truckId,
    });

    // Send notification
    if (validated.driverId) {
      await notifyLoadAssigned(loadId, validated.driverId);
    }

    return NextResponse.json({
      success: true,
      data: updatedLoad,
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

    console.error('Load assignment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

