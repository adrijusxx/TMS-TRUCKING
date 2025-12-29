import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { DetentionManager } from '@/lib/managers/DetentionManager';
import { z } from 'zod';

const updateStopSchema = z.object({
  actualArrival: z.string().datetime().optional().nullable(),
  actualDeparture: z.string().datetime().optional().nullable(),
  status: z.enum(['PENDING', 'EN_ROUTE', 'ARRIVED', 'LOADING', 'UNLOADING', 'COMPLETED', 'SKIPPED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
});

/**
 * PATCH /api/loads/[id]/stops/[stopId]
 * Update a load stop (arrival, departure, status, etc.)
 * 
 * CRITICAL: When actualDeparture is set, automatically calculate detention
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> }
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
    const { id: loadId, stopId } = resolvedParams;

    // Verify stop exists and belongs to company
    const stop = await prisma.loadStop.findFirst({
      where: {
        id: stopId,
        loadId: loadId,
        load: {
          companyId: session.user.companyId,
          deletedAt: null,
        },
      },
      include: {
        load: {
          select: {
            id: true,
            companyId: true,
            customerId: true,
            customer: {
              select: {
                id: true,
                detentionFreeTimeHours: true,
                detentionRate: true,
              },
            },
          },
        },
      },
    }) as any; // Type assertion to work around Prisma type inference issues

    if (!stop) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Stop not found' },
        },
        { status: 404 }
      );
    }

    // Check permission
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'loads.edit')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit stops',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateStopSchema.parse(body);

    // Prepare update data
    const updateData: any = {};
    
    if (validated.actualArrival !== undefined) {
      updateData.actualArrival = validated.actualArrival ? new Date(validated.actualArrival) : null;
    }
    
    if (validated.actualDeparture !== undefined) {
      updateData.actualDeparture = validated.actualDeparture ? new Date(validated.actualDeparture) : null;
    }
    
    if (validated.status !== undefined) {
      updateData.status = validated.status;
    }
    
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes;
    }

    // Update the stop
    const updatedStop = await prisma.loadStop.update({
      where: { id: stopId },
      data: updateData,
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            customer: {
              select: {
                id: true,
                detentionFreeTimeHours: true,
              },
            },
          },
        },
      },
    });

    // 🔥 CRITICAL: If actualDeparture was just set, calculate detention immediately
    let detentionResult = null;
    if (validated.actualDeparture !== undefined && updatedStop.actualDeparture) {
      const detentionManager = new DetentionManager();
      
      // Only calculate if we have both arrival and departure times
      if (updatedStop.actualArrival && updatedStop.actualDeparture && stop?.load?.customer) {
        const customer = stop.load.customer as {
          id: string;
          detentionFreeTimeHours?: number | null;
          detentionRate?: number | null;
        };
        const customerId: string = customer.id;
        detentionResult = await detentionManager.calculate(stopId, {
          freeTimeHours: customer?.detentionFreeTimeHours || undefined,
          customerId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        stop: updatedStop,
        detention: detentionResult,
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

    console.error('Stop update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

