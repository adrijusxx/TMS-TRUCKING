import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateBreakdownSchema = z.object({
  status: z
    .enum(['REPORTED', 'DISPATCHED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'RESOLVED', 'CANCELLED'])
    .optional(),
  location: z.string().optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  odometerReading: z.number().nonnegative().optional().nullable(),
  breakdownType: z
    .enum([
      'ENGINE_FAILURE',
      'TRANSMISSION_FAILURE',
      'BRAKE_FAILURE',
      'TIRE_FLAT',
      'TIRE_BLOWOUT',
      'ELECTRICAL_ISSUE',
      'COOLING_SYSTEM',
      'FUEL_SYSTEM',
      'SUSPENSION',
      'ACCIDENT_DAMAGE',
      'WEATHER_RELATED',
      'OTHER',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  problem: z.string().optional().nullable(),
  problemCategory: z.string().optional().nullable(),
  description: z.string().optional(),
  serviceProvider: z.string().optional().nullable(),
  serviceContact: z.string().optional().nullable(),
  serviceAddress: z.string().optional().nullable(),
  repairCost: z.number().nonnegative().optional().nullable(),
  towingCost: z.number().nonnegative().optional().nullable(),
  laborCost: z.number().nonnegative().optional().nullable(),
  partsCost: z.number().nonnegative().optional().nullable(),
  otherCosts: z.number().nonnegative().optional().nullable(),
  dispatchedAt: z.string().datetime().optional().nullable(),
  arrivedAt: z.string().datetime().optional().nullable(),
  repairStartedAt: z.string().datetime().optional().nullable(),
  repairCompletedAt: z.string().datetime().optional().nullable(),
  truckReadyAt: z.string().datetime().optional().nullable(),
  resolution: z.string().optional().nullable(),
  repairNotes: z.string().optional().nullable(),
  technicianNotes: z.string().optional().nullable(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional().nullable(),
  // Driver chargeability
  isDriverChargeable: z.boolean().optional(),
  driverChargeNotes: z.string().optional().nullable(),
});

/**
 * GET /api/breakdowns/[id]
 * Get a single breakdown
 */
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

    const { id } = await params;
    const breakdown = await prisma.breakdown.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
            year: true,
            vin: true,
            licensePlate: true,
          },
        },
        load: {
          select: {
            id: true,
            loadNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        documents: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            type: true,
            title: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            type: true,
            referenceNumber: true,
            notes: true,
            hasReceipt: true,
            hasInvoice: true,
            documentIds: true,
            mcNumber: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
          },
        },
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        },
      },
    });

    if (!breakdown) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Breakdown not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: breakdown,
    });
  } catch (error: any) {
    console.error('Error fetching breakdown:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/breakdowns/[id]
 * Update a breakdown
 */
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBreakdownSchema.parse(body);

    // Calculate total cost if cost fields are provided
    let totalCost = undefined;
    if (
      validatedData.repairCost !== undefined ||
      validatedData.towingCost !== undefined ||
      validatedData.laborCost !== undefined ||
      validatedData.partsCost !== undefined ||
      validatedData.otherCosts !== undefined
    ) {
      const existing = await prisma.breakdown.findUnique({
        where: { id },
        select: {
          repairCost: true,
          towingCost: true,
          laborCost: true,
          partsCost: true,
          otherCosts: true,
        },
      });

      const repairCost = validatedData.repairCost ?? existing?.repairCost ?? 0;
      const towingCost = validatedData.towingCost ?? existing?.towingCost ?? 0;
      const laborCost = validatedData.laborCost ?? existing?.laborCost ?? 0;
      const partsCost = validatedData.partsCost ?? existing?.partsCost ?? 0;
      const otherCosts = validatedData.otherCosts ?? existing?.otherCosts ?? 0;

      totalCost = repairCost + towingCost + laborCost + partsCost + otherCosts;
    }

    // Calculate downtime if timestamps are provided
    let downtimeHours = undefined;
    if (validatedData.repairCompletedAt || validatedData.truckReadyAt) {
      const existing = await prisma.breakdown.findUnique({
        where: { id },
        select: {
          reportedAt: true,
          repairCompletedAt: true,
          truckReadyAt: true,
        },
      });

      const startTime = existing?.reportedAt || new Date();
      const endTime =
        validatedData.truckReadyAt
          ? new Date(validatedData.truckReadyAt)
          : validatedData.repairCompletedAt
            ? new Date(validatedData.repairCompletedAt)
            : existing?.truckReadyAt || existing?.repairCompletedAt;

      if (endTime) {
        downtimeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      }
    }

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData };
    if (validatedData.dispatchedAt) updateData.dispatchedAt = new Date(validatedData.dispatchedAt);
    if (validatedData.arrivedAt) updateData.arrivedAt = new Date(validatedData.arrivedAt);
    if (validatedData.repairStartedAt)
      updateData.repairStartedAt = new Date(validatedData.repairStartedAt);
    if (validatedData.repairCompletedAt)
      updateData.repairCompletedAt = new Date(validatedData.repairCompletedAt);
    if (validatedData.truckReadyAt) updateData.truckReadyAt = new Date(validatedData.truckReadyAt);

    if (totalCost !== undefined) updateData.totalCost = totalCost;
    if (downtimeHours !== undefined) updateData.downtimeHours = downtimeHours;

    const breakdown = await prisma.breakdown.update({
      where: {
        id,
        companyId: session.user.companyId,
      },
      data: updateData,
      include: {
        truck: {
          select: {
            id: true,
            truckNumber: true,
            make: true,
            model: true,
          },
        },
        load: {
          select: {
            id: true,
            loadNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: breakdown,
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

    console.error('Error updating breakdown:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update breakdown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/breakdowns/[id]
 * Soft delete a breakdown
 */
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

    const { id } = await params;
    await prisma.breakdown.update({
      where: {
        id,
        companyId: session.user.companyId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Breakdown deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting breakdown:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete breakdown',
        },
      },
      { status: 500 }
    );
  }
}

