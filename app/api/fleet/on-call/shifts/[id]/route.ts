import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateShiftSchema = z.object({
  userId: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  shiftType: z.enum(['DAY', 'NIGHT', 'WEEKEND', 'HOLIDAY']).optional(),
  handoffNotes: z.string().optional().nullable(),
});

/**
 * PATCH /api/fleet/on-call/shifts/[id]
 * Update an on-call shift
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
    const validatedData = updateShiftSchema.parse(body);

    // Verify shift belongs to company
    const existingShift = await prisma.onCallShift.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingShift) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Shift not found' } },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.userId) updateData.assignedToId = validatedData.userId;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.shiftType) updateData.shiftType = validatedData.shiftType;
    if (validatedData.handoffNotes !== undefined) updateData.notes = validatedData.handoffNotes;

    const shift = await prisma.onCallShift.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        shift: {
          id: shift.id,
          userId: shift.assignedToId,
          userName: shift.assignedTo ? `${shift.assignedTo.firstName} ${shift.assignedTo.lastName}` : 'Unassigned',
          userEmail: shift.assignedTo?.email || null,
          userPhone: shift.assignedTo?.phone || null,
          startDate: shift.startDate.toISOString(),
          endDate: shift.endDate.toISOString(),
          shiftType: shift.shiftType,
          handoffNotes: shift.notes,
          createdAt: shift.createdAt.toISOString(),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
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

    console.error('Error updating on-call shift:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update on-call shift',
        },
      },
      { status: 500 }
    );
  }
}

