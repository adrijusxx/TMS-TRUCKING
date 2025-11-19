import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().or(z.string()),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const invoiceId = searchParams.get('invoiceId');
    const search = searchParams.get('search');

    const where: any = {
      invoice: {
        customer: {
          companyId: session.user.companyId,
        },
      },
    };

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
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
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Payment list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

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
    const validated = createPaymentSchema.parse(body);

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

    // Create payment
    const payment = await prisma.payment.create({
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
    });

    // Update invoice payment amount and status
    const newAmountPaid = (invoice.amountPaid || 0) + validated.amount;
    const newBalance = invoice.total - newAmountPaid;

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await prisma.invoice.update({
      where: { id: validated.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: 'Payment recorded successfully',
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

    console.error('Create payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

