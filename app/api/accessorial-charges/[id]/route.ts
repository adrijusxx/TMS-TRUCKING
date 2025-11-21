import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AccessorialChargeStatus } from '@prisma/client';

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
    const charge = await prisma.accessorialCharge.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            customer: {
              select: {
                name: true,
                customerNumber: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!charge) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Accessorial charge not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: charge,
    });
  } catch (error) {
    console.error('Accessorial charge fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
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

    const resolvedParams = await params;
    const body = await request.json();
    const {
      status,
      amount,
      description,
      notes,
      approve,
      deny,
      linkToInvoice,
      invoiceId,
    } = body;

    const existingCharge = await prisma.accessorialCharge.findFirst({
      where: {
        id: resolvedParams.id,
        companyId: session.user.companyId,
      },
    });

    if (!existingCharge) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Accessorial charge not found' },
        },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Handle approval
    if (approve === true) {
      updateData.status = AccessorialChargeStatus.APPROVED;
      updateData.approvedById = session.user.id;
      updateData.approvedAt = new Date();
    }

    // Handle denial
    if (deny === true) {
      updateData.status = AccessorialChargeStatus.DENIED;
    }

    // Update other fields
    if (status !== undefined) {
      updateData.status = status;
    }
    if (amount !== undefined) {
      updateData.amount = amount;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (linkToInvoice === true && invoiceId) {
      updateData.invoiceId = invoiceId;
      updateData.status = AccessorialChargeStatus.BILLED;
    }

    const updatedCharge = await prisma.accessorialCharge.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        load: {
          select: {
            id: true,
            loadNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCharge,
    });
  } catch (error) {
    console.error('Update accessorial charge error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

