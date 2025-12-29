import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadSplitManager } from '@/lib/managers/LoadSplitManager';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

const splitLoadSchema = z.object({
  newDriverId: z.string().cuid().optional(),
  newTruckId: z.string().cuid().optional(),
  splitLocation: z.string().optional(),
  splitDate: z.string().datetime().or(z.string()),
  splitMiles: z.number().nonnegative().optional(), // Allow 0 for edge cases
  notes: z.string().optional(),
}).refine(data => data.newDriverId || data.newTruckId, {
  message: "At least one of newDriverId or newTruckId must be provided",
  path: ["newDriverId"],
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

    if (!hasPermission(session.user.role, 'loads.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id,
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

    const body = await request.json();
    const validated = splitLoadSchema.parse(body);

    // Verify new driver/truck belong to company if provided
    if (validated.newDriverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validated.newDriverId,
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

    if (validated.newTruckId) {
      const truck = await prisma.truck.findFirst({
        where: {
          id: validated.newTruckId,
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

    const splitDate = validated.splitDate
      ? new Date(validated.splitDate)
      : new Date();

    const result = await LoadSplitManager.splitLoad({
      loadId: id,
      newDriverId: validated.newDriverId,
      newTruckId: validated.newTruckId,
      splitLocation: validated.splitLocation,
      splitDate,
      splitMiles: validated.splitMiles,
      notes: validated.notes,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Load split successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Load split error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to split load',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id,
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

    const segments = await LoadSplitManager.getLoadSegmentsForAccounting(id);

    return NextResponse.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('Load segments fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch load segments',
        },
      },
      { status: 500 }
    );
  }
}

