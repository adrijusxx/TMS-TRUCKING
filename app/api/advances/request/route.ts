import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DriverAdvanceManager } from '@/lib/managers/DriverAdvanceManager';
import { z } from 'zod';

const advanceRequestSchema = z.object({
  driverId: z.string().cuid(),
  amount: z.number().positive().max(10000),
  loadId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Request a driver advance
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

    const body = await request.json();
    const validated = advanceRequestSchema.parse(body);

    // Verify driver belongs to company
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

    // If loadId provided, verify it belongs to the driver
    if (validated.loadId) {
      const load = await prisma.load.findFirst({
        where: {
          id: validated.loadId,
          driverId: validated.driverId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!load) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_LOAD', message: 'Load not found or not assigned to driver' },
          },
          { status: 400 }
        );
      }
    }

    // Request advance
    const advanceManager = new DriverAdvanceManager();
    const advance = await advanceManager.requestAdvance({
      driverId: validated.driverId,
      amount: validated.amount,
      loadId: validated.loadId,
      notes: validated.notes,
    });

    return NextResponse.json({
      success: true,
      data: advance,
    });
  } catch (error: any) {
    console.error('Error requesting advance:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to request advance',
        },
      },
      { status: 500 }
    );
  }
}





