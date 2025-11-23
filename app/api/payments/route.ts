import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  fuelEntryId: z.string().cuid().optional(),
  breakdownId: z.string().cuid().optional(),
  type: z.enum(['INVOICE', 'FUEL', 'BREAKDOWN', 'OTHER']).default('INVOICE'),
  mcNumberId: z.string().cuid().optional(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().or(z.string()),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER', 'FACTOR', 'QUICK_PAY']),
  referenceNumber: z.string().optional(),
  receiptNumber: z.string().optional(),
  invoiceNumber: z.string().optional(), // Vendor invoice number
  hasReceipt: z.boolean().default(false),
  hasInvoice: z.boolean().default(false),
  documentIds: z.array(z.string()).optional(),
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

    const fuelEntryId = searchParams.get('fuelEntryId');
    const breakdownId = searchParams.get('breakdownId');
    const type = searchParams.get('type');
    const mcNumberId = searchParams.get('mcNumberId');

    const where: any = {
      OR: [
        // Invoice payments
        {
          invoice: {
            customer: {
              companyId: session.user.companyId,
            },
          },
        },
        // Fuel entry payments
        {
          fuelEntry: {
            truck: {
              companyId: session.user.companyId,
            },
          },
        },
        // Breakdown payments
        {
          breakdown: {
            companyId: session.user.companyId,
            deletedAt: null,
          },
        },
      ],
    };

    if (invoiceId) {
      where.invoiceId = invoiceId;
      // Simplify query when filtering by invoice
      where.OR = undefined;
      where.invoice = {
        customer: {
          companyId: session.user.companyId,
        },
      };
    }

    if (fuelEntryId) {
      where.fuelEntryId = fuelEntryId;
      // Simplify query when filtering by fuel entry
      where.OR = undefined;
      where.fuelEntry = {
        truck: {
          companyId: session.user.companyId,
        },
      };
    }

    if (breakdownId) {
      where.breakdownId = breakdownId;
      // Simplify query when filtering by breakdown
      where.OR = undefined;
      where.breakdown = {
        companyId: session.user.companyId,
        deletedAt: null,
      };
    }

    if (type) {
      where.type = type;
    }

    if (mcNumberId) {
      where.mcNumberId = mcNumberId;
    }

    if (search) {
      const searchConditions: any[] = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
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
          fuelEntry: {
            select: {
              id: true,
              date: true,
              totalCost: true,
              truck: {
                select: {
                  truckNumber: true,
                },
              },
            },
          },
          breakdown: {
            select: {
              id: true,
              breakdownNumber: true,
              totalCost: true,
            },
          },
          mcNumber: {
            select: {
              id: true,
              number: true,
              companyName: true,
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

    // Validate that at least one entity ID is provided based on type
    if (validated.type === 'INVOICE' && !validated.invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'invoiceId is required for INVOICE type payments' },
        },
        { status: 400 }
      );
    }

    if (validated.type === 'FUEL' && !validated.fuelEntryId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'fuelEntryId is required for FUEL type payments' },
        },
        { status: 400 }
      );
    }

    if (validated.type === 'BREAKDOWN' && !validated.breakdownId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'breakdownId is required for BREAKDOWN type payments' },
        },
        { status: 400 }
      );
    }

    // Verify invoice belongs to the company if provided
    let invoice = null;
    if (validated.invoiceId) {
      invoice = await prisma.invoice.findFirst({
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
    }

    // Verify fuel entry belongs to the company if provided
    if (validated.fuelEntryId) {
      const fuelEntry = await prisma.fuelEntry.findFirst({
        where: {
          id: validated.fuelEntryId,
          truck: {
            companyId: session.user.companyId,
          },
        },
      });

      if (!fuelEntry) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Fuel entry not found' },
          },
          { status: 404 }
        );
      }
    }

    // Verify breakdown belongs to the company if provided
    if (validated.breakdownId) {
      const breakdown = await prisma.breakdown.findFirst({
        where: {
          id: validated.breakdownId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!breakdown) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Breakdown not found' },
          },
          { status: 404 }
        );
      }
    }

    // Verify MC number belongs to company if provided
    if (validated.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: validated.mcNumberId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'MC Number not found' },
          },
          { status: 404 }
        );
      }
    }

    // Generate payment number
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: validated.invoiceId || null,
        fuelEntryId: validated.fuelEntryId || null,
        breakdownId: validated.breakdownId || null,
        type: validated.type,
        mcNumberId: validated.mcNumberId || null,
        paymentNumber,
        amount: validated.amount,
        paymentDate: typeof validated.paymentDate === 'string'
          ? new Date(validated.paymentDate)
          : new Date(),
        paymentMethod: validated.paymentMethod,
        referenceNumber: validated.referenceNumber,
        receiptNumber: validated.receiptNumber,
        invoiceNumber: validated.invoiceNumber, // Vendor invoice number
        hasReceipt: validated.hasReceipt,
        hasInvoice: validated.hasInvoice,
        documentIds: validated.documentIds || [],
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
        fuelEntry: {
          select: {
            id: true,
            date: true,
            totalCost: true,
          },
        },
        breakdown: {
          select: {
            id: true,
            breakdownNumber: true,
            totalCost: true,
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
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

    // Update invoice payment amount and status if it's an invoice payment
    if (invoice) {
      const newAmountPaid = (invoice.amountPaid || 0) + validated.amount;
      const newBalance = invoice.total - newAmountPaid;

      let newStatus = invoice.status;
      if (newBalance <= 0) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIAL';
      }

      await prisma.invoice.update({
        where: { id: validated.invoiceId! },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
        },
      });
    }

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

