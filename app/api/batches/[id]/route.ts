import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateBatchSchema = z.object({
  postStatus: z.enum(['UNPOSTED', 'POSTED', 'PAID']).optional(),
  mcNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                    customerNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    const invoiceCount = batch.items.length;
    const calculatedTotal = batch.items.reduce(
      (sum, item) => sum + (item.invoice.total || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...batch,
        invoiceCount,
        totalAmount: calculatedTotal,
      },
    });
  } catch (error) {
    console.error('Get batch error:', error);
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
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateBatchSchema.parse(body);

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    const updated = await prisma.invoiceBatch.update({
      where: { id: id },
      data: {
        ...(validated.postStatus && { postStatus: validated.postStatus }),
        ...(validated.mcNumber !== undefined && { mcNumber: validated.mcNumber }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            invoice: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        invoiceCount: updated.items.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Update batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to delete batches
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'invoices.delete')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete batches',
          },
        },
        { status: 403 }
      );
    }

    const batch = await prisma.invoiceBatch.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Batch not found' },
        },
        { status: 404 }
      );
    }

    // Only allow deletion of UNPOSTED batches
    if (batch.postStatus !== 'UNPOSTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only delete UNPOSTED batches',
          },
        },
        { status: 400 }
      );
    }

    await prisma.invoiceBatch.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

