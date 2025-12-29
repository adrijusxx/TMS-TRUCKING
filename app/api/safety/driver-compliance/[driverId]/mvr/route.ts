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

    const mvrRecord = await prisma.mVRRecord.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        pullDate: new Date(body.pullDate),
        state: body.state,
        nextPullDueDate: new Date(body.nextPullDueDate),
        documentId: body.documentId || null,
      },
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
        violations: true,
      },
    });

    // Add violations if provided
    if (body.violations && Array.isArray(body.violations)) {
      await Promise.all(
        body.violations.map((violation: any) =>
          prisma.mVRViolation.create({
            data: {
              mvrRecordId: mvrRecord.id,
              violationCode: violation.violationCode,
              violationDescription: violation.violationDescription,
              violationDate: new Date(violation.violationDate),
              state: violation.state,
              points: violation.points || null,
              isNew: violation.isNew || false,
            },
          })
        )
      );
    }

    const updated = await prisma.mVRRecord.findUnique({
      where: { id: mvrRecord.id },
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
        violations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error creating MVR record:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create MVR record',
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
        { success: false, error: { code: 'INVALID_REQUEST', message: 'MVR record ID required' } },
        { status: 400 }
      );
    }

    const mvrRecord = await prisma.mVRRecord.update({
      where: {
        id: body.id,
        driverId,
        companyId: session.user.companyId,
      },
      data: {
        pullDate: body.pullDate ? new Date(body.pullDate) : undefined,
        state: body.state !== undefined ? body.state : undefined,
        nextPullDueDate: body.nextPullDueDate ? new Date(body.nextPullDueDate) : undefined,
        documentId: body.documentId !== undefined ? body.documentId : undefined,
      },
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
        violations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: mvrRecord,
    });
  } catch (error) {
    console.error('Error updating MVR record:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update MVR record',
        },
      },
      { status: 500 }
    );
  }
}

