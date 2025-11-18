import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateSafetyTrainingSchema = z.object({
  driverId: z.string().min(1).optional(),
  trainingType: z.enum([
    'DEFENSIVE_DRIVING',
    'HAZMAT',
    'HOURS_OF_SERVICE',
    'ELD_TRAINING',
    'FIRST_AID',
    'CPR',
    'FIRE_SAFETY',
    'BACKING_SAFETY',
    'LOAD_SECUREMENT',
    'DOCK_SAFETY',
    'OTHER',
  ]).optional(),
  trainingName: z.string().min(1).optional(),
  trainingDate: z.string().datetime().optional(),
  completionDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  provider: z.string().optional().nullable(),
  instructor: z.string().optional().nullable(),
  certificateNumber: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED']).optional(),
  completed: z.boolean().optional(),
  passed: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable(),
  score: z.number().nonnegative().optional().nullable(),
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
    const training = await prisma.safetyTraining.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
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
        certificate: true,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Safety training not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: training,
    });
  } catch (error: any) {
    console.error('Error fetching safety training:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch safety training',
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

    if (!hasPermission(session.user.role, 'drivers.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateSafetyTrainingSchema.parse(body);

    const existing = await prisma.safetyTraining.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Safety training not found' } },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData };
    if (validatedData.trainingDate) {
      updateData.trainingDate = new Date(validatedData.trainingDate);
    }
    if (validatedData.completionDate !== undefined) {
      updateData.completionDate = validatedData.completionDate ? new Date(validatedData.completionDate) : null;
    }
    if (validatedData.expiryDate !== undefined) {
      updateData.expiryDate = validatedData.expiryDate ? new Date(validatedData.expiryDate) : null;
    }

    const training = await prisma.safetyTraining.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
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
      data: training,
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

    console.error('Error updating safety training:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update safety training',
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

    if (!hasPermission(session.user.role, 'drivers.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const training = await prisma.safetyTraining.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Safety training not found' } },
        { status: 404 }
      );
    }

    await prisma.safetyTraining.update({
      where: { id: resolvedParams.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Safety training deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting safety training:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete safety training',
        },
      },
      { status: 500 }
    );
  }
}

