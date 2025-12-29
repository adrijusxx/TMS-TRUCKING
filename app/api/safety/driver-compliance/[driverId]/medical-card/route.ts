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

    const medicalCard = await prisma.medicalCard.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        cardNumber: body.cardNumber,
        expirationDate: new Date(body.expirationDate),
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        medicalExaminerName: body.medicalExaminerName || null,
        medicalExaminerCertificateNumber: body.medicalExaminerCertificateNumber || null,
        waiverInformation: body.waiverInformation || null,
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
      data: medicalCard,
    });
  } catch (error) {
    console.error('Error creating medical card:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create medical card',
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
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Medical card ID required' } },
        { status: 400 }
      );
    }

    const medicalCard = await prisma.medicalCard.update({
      where: {
        id: body.id,
        driverId,
        companyId: session.user.companyId,
      },
      data: {
        ...(body.cardNumber !== undefined && { cardNumber: body.cardNumber }),
        expirationDate: body.expirationDate !== undefined 
          ? (body.expirationDate ? new Date(body.expirationDate) : undefined)
          : undefined,
        issueDate: body.issueDate !== undefined 
          ? (body.issueDate ? new Date(body.issueDate) : null)
          : undefined,
        ...(body.medicalExaminerName !== undefined && { medicalExaminerName: body.medicalExaminerName }),
        ...(body.medicalExaminerCertificateNumber !== undefined && { medicalExaminerCertificateNumber: body.medicalExaminerCertificateNumber }),
        ...(body.waiverInformation !== undefined && { waiverInformation: body.waiverInformation }),
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
      data: medicalCard,
    });
  } catch (error) {
    console.error('Error updating medical card:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update medical card',
        },
      },
      { status: 500 }
    );
  }
}

