import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignDriverSchema = z.object({
  currentTruckId: z.string().cuid().nullable().optional(),
  currentTrailerId: z.string().cuid().nullable().optional(),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission - dispatchers and admins can change assignments
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (role !== 'ADMIN' && role !== 'DISPATCHER') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators and dispatchers can change driver assignments',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = assignDriverSchema.parse(body);

    // Get existing driver
    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        currentTrailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
      },
    });

    if (!existingDriver) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
        },
        { status: 404 }
      );
    }

    const oldTruckId = existingDriver.currentTruckId;
    const oldTrailerId = existingDriver.currentTrailerId;
    const newTruckId = validated.currentTruckId || null;
    const newTrailerId = validated.currentTrailerId || null;

    // Verify truck if provided
    if (newTruckId) {
      const truck = await prisma.truck.findFirst({
        where: {
          id: newTruckId,
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

    // Verify trailer if provided
    if (newTrailerId) {
      const trailer = await prisma.trailer.findFirst({
        where: {
          id: newTrailerId,
          companyId: session.user.companyId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!trailer) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Trailer not found' },
          },
          { status: 404 }
        );
      }
    }

    // Update driver assignment
    const updateData: any = {};
    if (validated.currentTruckId !== undefined) {
      updateData.currentTruckId = validated.currentTruckId;
    }
    if (validated.currentTrailerId !== undefined) {
      updateData.currentTrailerId = validated.currentTrailerId;
    }

    // Create truck history if truck changed
    if (oldTruckId !== newTruckId) {
      const now = new Date();
      
      // Close old truck assignment if it existed
      if (oldTruckId) {
        await prisma.driverTruckHistory.updateMany({
          where: {
            driverId: id,
            truckId: oldTruckId,
            dropOffDate: null, // Only update active assignments
          },
          data: {
            dropOffDate: now,
            isActive: false,
          },
        });
      }

      // Create new truck assignment history
      if (newTruckId) {
        await prisma.driverTruckHistory.create({
          data: {
            driverId: id,
            truckId: newTruckId,
            date: now,
            pickupDate: now,
            isActive: true,
            note: validated.reason || 'Assignment changed',
          },
        });
      }

      // Handle auto-split loads if truck changed
      if (oldTruckId !== newTruckId) {
        try {
          const { LoadSplitManager } = await import('@/lib/managers/LoadSplitManager');
          await LoadSplitManager.autoSplitOnTruckChange({
            driverId: id,
            oldTruckId: oldTruckId || undefined,
            newTruckId: newTruckId || undefined,
            changeDate: now,
          });
        } catch (splitError) {
          console.error('Auto-split error on truck change:', splitError);
          // Don't fail the update if auto-split fails
        }
      }
    }

    // Create trailer history if trailer changed
    if (oldTrailerId !== newTrailerId) {
      const now = new Date();
      
      // Close old trailer assignment if it existed
      if (oldTrailerId) {
        await prisma.driverTrailerHistory.updateMany({
          where: {
            driverId: id,
            trailerId: oldTrailerId,
            dropOffDate: null, // Only update active assignments
          },
          data: {
            dropOffDate: now,
          },
        });
      }

      // Create new trailer assignment history
      if (newTrailerId) {
        await prisma.driverTrailerHistory.create({
          data: {
            driverId: id,
            trailerId: newTrailerId,
            pickupDate: now,
          },
        });
      }
    }

    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: updateData,
      include: {
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        currentTrailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDriver,
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

    console.error('Driver assignment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

























