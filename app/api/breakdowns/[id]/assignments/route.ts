import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const assignmentSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  role: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/breakdowns/[id]/assignments
 * Get all assignments for a breakdown
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

    // Verify breakdown belongs to company
    const breakdown = await prisma.breakdown.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });

    if (!breakdown) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' } },
        { status: 404 }
      );
    }

    const assignments = await prisma.breakdownAssignment.findMany({
      where: { breakdownId: id, isActive: true },
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
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/breakdowns/[id]/assignments
 * Add a user assignment to a breakdown
 */
export async function POST(
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
    const validatedData = assignmentSchema.parse(body);

    // Verify breakdown belongs to company
    const breakdown = await prisma.breakdown.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });

    if (!breakdown) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' } },
        { status: 404 }
      );
    }

    // Verify user belongs to company
    const user = await prisma.user.findFirst({
      where: { id: validatedData.userId, companyId: session.user.companyId, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.breakdownAssignment.findUnique({
      where: { breakdownId_userId: { breakdownId: id, userId: validatedData.userId } },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const updated = await prisma.breakdownAssignment.update({
          where: { id: existing.id },
          data: { isActive: true, role: validatedData.role, notes: validatedData.notes },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
            },
          },
        });
        return NextResponse.json({ success: true, data: updated });
      }
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'User already assigned' } },
        { status: 400 }
      );
    }

    const assignment = await prisma.breakdownAssignment.create({
      data: {
        breakdownId: id,
        userId: validatedData.userId,
        role: validatedData.role,
        notes: validatedData.notes,
        assignedBy: session.user.id,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/breakdowns/[id]/assignments
 * Remove a user assignment (soft delete)
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

    if (!hasPermission(session.user.role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' } },
        { status: 400 }
      );
    }

    await prisma.breakdownAssignment.update({
      where: { breakdownId_userId: { breakdownId: id, userId } },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: { message: 'Assignment removed' } });
  } catch (error: any) {
    console.error('Error removing assignment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}











