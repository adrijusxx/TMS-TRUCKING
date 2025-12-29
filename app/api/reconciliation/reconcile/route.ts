import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reconcileSchema = z.object({
  invoiceId: z.string(),
  paymentId: z.string().optional(),
  reconciledAmount: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = reconcileSchema.parse(body);

    // Verify invoice belongs to the company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: validated.invoiceId,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        payments: true,
        reconciliations: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        },
        { status: 404 }
      );
    }

    // Verify payment if provided
    if (validated.paymentId) {
      const payment = await prisma.payment.findFirst({
        where: {
          id: validated.paymentId,
          invoiceId: validated.invoiceId,
        },
      });

      if (!payment) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Payment not found or does not belong to invoice' },
          },
          { status: 404 }
        );
      }
    }

    // Calculate total reconciled amount
    const totalReconciled = invoice.reconciliations.reduce(
      (sum, rec) => sum + rec.reconciledAmount,
      0
    );
    const newTotalReconciled = totalReconciled + validated.reconciledAmount;

    // Check if reconciled amount exceeds invoice balance
    if (newTotalReconciled > invoice.total) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Reconciled amount exceeds invoice total',
          },
        },
        { status: 400 }
      );
    }

    // Create reconciliation
    const reconciliation = await prisma.reconciliation.create({
      data: {
        invoiceId: validated.invoiceId,
        paymentId: validated.paymentId || null,
        reconciledAmount: validated.reconciledAmount,
        reconciledAt: new Date(),
        reconciledById: session.user.id,
        notes: validated.notes,
      },
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
        payment: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reconciledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update invoice reconciliation status
    let reconciliationStatus = 'NOT_RECONCILED';
    if (newTotalReconciled >= invoice.total) {
      reconciliationStatus = 'FULLY_RECONCILED';
    } else if (newTotalReconciled > 0) {
      reconciliationStatus = 'PARTIALLY_RECONCILED';
    }

    await prisma.invoice.update({
      where: { id: validated.invoiceId },
      data: {
        reconciliationStatus: reconciliationStatus as any,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: reconciliation,
        message: 'Reconciliation created successfully',
      },
      { status: 201 }
    );
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

    console.error('Reconcile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

