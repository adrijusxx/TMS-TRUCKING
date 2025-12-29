import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addInvoicesSchema = z.object({
  invoiceIds: z.array(z.string()).min(1),
});

const removeInvoicesSchema = z.object({
  invoiceIds: z.array(z.string()).min(1),
});

export async function POST(
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
    const validated = addInvoicesSchema.parse(body);

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

    if (batch.postStatus !== 'UNPOSTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only add invoices to UNPOSTED batches',
          },
        },
        { status: 400 }
      );
    }

    // Verify invoices belong to the company
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: validated.invoiceIds },
        customer: {
          companyId: session.user.companyId,
        },
      },
    });

    if (invoices.length !== validated.invoiceIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INVOICES',
            message: 'Some invoices not found or do not belong to your company',
          },
        },
        { status: 400 }
      );
    }

    // Check if invoices are already in a batch
    const existingBatchItems = await prisma.invoiceBatchItem.findMany({
      where: {
        invoiceId: { in: validated.invoiceIds },
      },
    });

    if (existingBatchItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVOICES_IN_BATCH',
            message: 'Some invoices are already in a batch',
          },
        },
        { status: 400 }
      );
    }

    // Add invoices to batch
    await prisma.invoiceBatchItem.createMany({
      data: validated.invoiceIds.map((invoiceId) => ({
        batchId: id,
        invoiceId,
      })),
    });

    // Recalculate total amount
    const batchWithItems = await prisma.invoiceBatch.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (batchWithItems) {
      const totalAmount = batchWithItems.items.reduce(
        (sum, item) => sum + (item.invoice.total || 0),
        0
      );

      await prisma.invoiceBatch.update({
        where: { id },
        data: { totalAmount },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invoices added to batch successfully',
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

    console.error('Add invoices to batch error:', error);
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

    const { searchParams } = new URL(request.url);
    const invoiceIdsParam = searchParams.get('invoiceIds');

    if (!invoiceIdsParam) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'invoiceIds query parameter is required',
          },
        },
        { status: 400 }
      );
    }

    const invoiceIds = invoiceIdsParam.split(',');

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

    if (batch.postStatus !== 'UNPOSTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only remove invoices from UNPOSTED batches',
          },
        },
        { status: 400 }
      );
    }

    // Remove invoices from batch
    await prisma.invoiceBatchItem.deleteMany({
      where: {
        batchId: id,
        invoiceId: { in: invoiceIds },
      },
    });

    // Recalculate total amount
    const batchWithItems = await prisma.invoiceBatch.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (batchWithItems) {
      const totalAmount = batchWithItems.items.reduce(
        (sum, item) => sum + (item.invoice.total || 0),
        0
      );

      await prisma.invoiceBatch.update({
        where: { id },
        data: { totalAmount },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invoices removed from batch successfully',
    });
  } catch (error) {
    console.error('Remove invoices from batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

