import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentDate: z.string().datetime().or(z.string()).optional(),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER']).optional(),
  referenceNumber: z.string().optional().nullable(),
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

    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
        invoice: {
          customer: {
            companyId: session.user.companyId,
          },
        },
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reconciliations: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
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
    const validated = updatePaymentSchema.parse(body);

    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
        invoice: {
          customer: {
            companyId: session.user.companyId,
          },
        },
      },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment not found' },
        },
        { status: 404 }
      );
    }

    // If amount is being updated, recalculate invoice amounts (only if payment has an invoice)
    if (validated.amount !== undefined && validated.amount !== payment.amount && payment.invoice && payment.invoiceId) {
      const amountDifference = validated.amount - payment.amount;
      const newAmountPaid = (payment.invoice.amountPaid || 0) + amountDifference;
      const newBalance = payment.invoice.total - newAmountPaid;

      let newStatus = payment.invoice.status;
      if (newBalance <= 0) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIAL';
      }

      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paidDate: newBalance <= 0 ? new Date() : payment.invoice.paidDate || undefined,
        },
      });
    }

    const updated = await prisma.payment.update({
      where: { id: id },
      data: {
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.paymentDate && { paymentDate: new Date(validated.paymentDate) }),
        ...(validated.paymentMethod && { paymentMethod: validated.paymentMethod }),
        ...(validated.referenceNumber !== undefined && { referenceNumber: validated.referenceNumber || undefined }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
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
        createdBy: {
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
      data: updated,
      message: 'Payment updated successfully',
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

    console.error('Update payment error:', error);
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

    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
        invoice: {
          customer: {
            companyId: session.user.companyId,
          },
        },
      },
      include: {
        invoice: true,
        reconciliations: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment not found' },
        },
        { status: 404 }
      );
    }

    // Check if payment is reconciled
    if (payment.reconciliations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RECONCILED',
            message: 'Cannot delete a reconciled payment',
          },
        },
        { status: 400 }
      );
    }

    // Recalculate invoice amounts (only if payment has an invoice)
    if (payment.invoice && payment.invoiceId) {
      const newAmountPaid = Math.max(0, (payment.invoice.amountPaid || 0) - payment.amount);
      const newBalance = payment.invoice.total - newAmountPaid;

      let newStatus = payment.invoice.status;
      if (newAmountPaid === 0) {
        newStatus = 'SENT';
      } else if (newBalance > 0) {
        newStatus = 'PARTIAL';
      }

      // Delete payment and update invoice
      await prisma.$transaction([
        prisma.payment.delete({
          where: { id: id },
        }),
        prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balance: newBalance,
            status: newStatus,
            paidDate: newAmountPaid === 0 ? undefined : payment.invoice?.paidDate || undefined,
          },
        }),
      ]);
    } else {
      // Delete payment without invoice update
      await prisma.payment.delete({
        where: { id: id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

