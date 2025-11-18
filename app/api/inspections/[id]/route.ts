import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateInspectionSchema = z.object({
  truckId: z.string().min(1).optional(),
  driverId: z.string().optional().nullable(),
  inspectionType: z.enum([
    'DOT_ANNUAL',
    'DOT_LEVEL_1',
    'DOT_LEVEL_2',
    'DOT_LEVEL_3',
    'DOT_PRE_TRIP',
    'DOT_POST_TRIP',
    'STATE_INSPECTION',
    'COMPANY_INSPECTION',
    'PMI',
    'SAFETY_INSPECTION',
  ]).optional(),
  inspectionDate: z.string().datetime().optional(),
  performedBy: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.enum(['PASSED', 'FAILED', 'CONDITIONAL', 'OUT_OF_SERVICE', 'PENDING']).optional(),
  defects: z.number().int().nonnegative().optional(),
  defectDetails: z.string().optional().nullable(),
  oosStatus: z.boolean().optional(),
  oosItems: z.string().optional().nullable(),
  oosSeverity: z.string().optional().nullable(),
  odometerReading: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  inspectorNotes: z.string().optional().nullable(),
  nextInspectionDue: z.string().datetime().optional().nullable(),
});

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

    const resolvedParams = await params;
    const inspection = await prisma.inspection.findFirst({
      where: {
        id: resolvedParams.id,
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
        documents: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Inspection not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inspection,
    });
  } catch (error: any) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch inspection',
        },
      },
      { status: 500 }
    );
  }
}

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

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateInspectionSchema.parse(body);

    // Verify inspection belongs to company
    const existing = await prisma.inspection.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Inspection not found' } },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData };
    if (validatedData.inspectionDate) {
      updateData.inspectionDate = new Date(validatedData.inspectionDate);
    }
    if (validatedData.nextInspectionDue !== undefined) {
      updateData.nextInspectionDue = validatedData.nextInspectionDue
        ? new Date(validatedData.nextInspectionDue)
        : null;
    }

    const inspection = await prisma.inspection.update({
      where: { id: resolvedParams.id },
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
      },
    });

    return NextResponse.json({
      success: true,
      data: inspection,
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

    console.error('Error updating inspection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update inspection',
        },
      },
      { status: 500 }
    );
  }
}

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

    const resolvedParams = await params;
    const inspection = await prisma.inspection.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Inspection not found' } },
        { status: 404 }
      );
    }

    await prisma.inspection.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Inspection deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete inspection',
        },
      },
      { status: 500 }
    );
  }
}

