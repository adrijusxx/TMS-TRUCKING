import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const markPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().or(z.string()),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Mark a payment on an invoice (creates payment and updates invoice)
 * This is a convenience endpoint that combines payment creation and invoice update
 */
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
    const validated = markPaymentSchema.parse(body);

    // Verify invoice belongs to the company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: validated.invoiceId,
        customer: {
          companyId: session.user.companyId,
        },
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

    // Generate payment number
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Calculate new invoice amounts
    const newAmountPaid = (invoice.amountPaid || 0) + validated.amount;
    const newBalance = invoice.total - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL';
    }

    // Create payment and update invoice in a transaction
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: validated.invoiceId,
          paymentNumber,
          amount: validated.amount,
          paymentDate: new Date(validated.paymentDate),
          paymentMethod: validated.paymentMethod,
          referenceNumber: validated.referenceNumber,
          notes: validated.notes,
          createdById: session.user.id,
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
      }),
      prisma.invoice.update({
        where: { id: validated.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: 'Payment marked successfully',
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

    console.error('Mark payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

