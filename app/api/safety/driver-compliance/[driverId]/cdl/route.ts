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

    // Check if CDL record already exists
    const existing = await prisma.cDLRecord.findUnique({
      where: { driverId },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'CDL record already exists. Use PATCH to update.' } },
        { status: 409 }
      );
    }

    const cdlRecord = await prisma.cDLRecord.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        cdlNumber: body.cdlNumber,
        expirationDate: new Date(body.expirationDate),
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        issueState: body.issueState,
        licenseClass: body.licenseClass || null,
        endorsements: body.endorsements || [],
        restrictions: body.restrictions || [],
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
      data: cdlRecord,
    });
  } catch (error) {
    console.error('Error creating CDL record:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create CDL record',
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

    const cdlRecord = await prisma.cDLRecord.update({
      where: {
        driverId,
      },
      data: {
        ...(body.cdlNumber !== undefined && { cdlNumber: body.cdlNumber }),
        expirationDate: body.expirationDate !== undefined 
          ? (body.expirationDate ? new Date(body.expirationDate) : undefined)
          : undefined,
        issueDate: body.issueDate !== undefined 
          ? (body.issueDate ? new Date(body.issueDate) : null)
          : undefined,
        ...(body.issueState !== undefined && { issueState: body.issueState }),
        ...(body.licenseClass !== undefined && { licenseClass: body.licenseClass }),
        ...(body.endorsements !== undefined && { endorsements: body.endorsements }),
        ...(body.restrictions !== undefined && { restrictions: body.restrictions }),
        ...(body.documentId !== undefined && { documentId: body.documentId }),
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
      data: cdlRecord,
    });
  } catch (error) {
    console.error('Error updating CDL record:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update CDL record',
        },
      },
      { status: 500 }
    );
  }
}

