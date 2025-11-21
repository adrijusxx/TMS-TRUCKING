import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createShiftSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  shiftType: z.enum(['DAY', 'NIGHT', 'WEEKEND', 'HOLIDAY']),
  handoffNotes: z.string().optional().nullable(),
});

/**
 * GET /api/fleet/on-call/shifts
 * List on-call shifts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) },
        },
      ];
    }

    const shifts = await prisma.onCallShift.findMany({
      where,
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
      orderBy: {
        startDate: 'asc',
      },
    });

    // Format response
    const formattedShifts = shifts.map((shift) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        shifts: formattedShifts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching on-call shifts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch on-call shifts',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fleet/on-call/shifts
 * Create a new on-call shift
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

    if (!hasPermission(session.user.role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createShiftSchema.parse(body);

    // Verify user belongs to company
    const user = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const shift = await prisma.onCallShift.create({
      data: {
        companyId: session.user.companyId,
        assignedToId: validatedData.userId,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        shiftType: validatedData.shiftType,
        notes: validatedData.handoffNotes || null,
        createdById: session.user.id,
      },
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

    console.error('Error creating on-call shift:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create on-call shift',
        },
      },
      { status: 500 }
    );
  }
}

