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

    const drugTest = await prisma.drugAlcoholTest.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        testDate: new Date(body.testDate),
        testType: body.testType,
        result: body.result || body.testResult,
        labName: body.labName || body.testingFacility || null,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: drugTest,
    });
  } catch (error) {
    console.error('Error creating drug test:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create drug test',
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
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Drug test ID required' } },
        { status: 400 }
      );
    }

    const drugTest = await prisma.drugAlcoholTest.update({
      where: {
        id: body.id,
        driverId,
        companyId: session.user.companyId,
      },
      data: {
        testDate: body.testDate ? new Date(body.testDate) : undefined,
        testType: body.testType !== undefined ? body.testType : undefined,
        result: body.result !== undefined ? body.result : (body.testResult !== undefined ? body.testResult : undefined),
        labName: body.labName !== undefined ? body.labName : (body.testingFacility !== undefined ? body.testingFacility : undefined),
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
      },
    });

    return NextResponse.json({
      success: true,
      data: drugTest,
    });
  } catch (error) {
    console.error('Error updating drug test:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update drug test',
        },
      },
      { status: 500 }
    );
  }
}

