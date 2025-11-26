import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'drivers.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { driverId } = await params;
    const body = await request.json();

    const annualReview = await prisma.annualReview.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        reviewDate: new Date(body.reviewDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(body.reviewDate),
        reviewYear: body.reviewYear || new Date(body.reviewDate).getFullYear(),
        status: body.status || 'PENDING',
        reviewerId: body.reviewerId || null,
        reviewNotes: body.reviewNotes || body.notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: annualReview,
    });
  } catch (error) {
    console.error('Error creating annual review:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create annual review',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(session.user.role as any, 'drivers.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { driverId } = await params;
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Annual review ID required' } },
        { status: 400 }
      );
    }

    const annualReview = await prisma.annualReview.update({
      where: {
        id: body.id,
        driverId,
        companyId: session.user.companyId,
      },
      data: {
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : undefined) : undefined,
        reviewYear: body.reviewYear !== undefined ? body.reviewYear : undefined,
        status: body.status !== undefined ? body.status : undefined,
        reviewerId: body.reviewerId !== undefined ? body.reviewerId : undefined,
        reviewNotes: body.reviewNotes !== undefined ? body.reviewNotes : (body.notes !== undefined ? body.notes : undefined),
      },
    });

    return NextResponse.json({
      success: true,
      data: annualReview,
    });
  } catch (error) {
    console.error('Error updating annual review:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update annual review',
        },
      },
      { status: 500 }
    );
  }
}

