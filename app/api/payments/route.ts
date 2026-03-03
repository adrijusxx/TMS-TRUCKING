import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { z } from 'zod';
import { PaymentQueryManager } from '@/lib/managers/PaymentQueryManager';

const createPaymentSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  fuelEntryId: z.string().cuid().optional(),
  breakdownId: z.string().cuid().optional(),
  type: z.enum(['INVOICE', 'FUEL', 'BREAKDOWN', 'OTHER']).default('INVOICE'),
  mcNumberId: z.string().cuid().optional(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().or(z.string()),
  paymentMethod: z.enum(['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER', 'FACTOR', 'QUICK_PAY']),
  paymentInstrumentId: z.string().optional().nullable(),
  referenceNumber: z.string().optional(),
  receiptNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
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
    const mcNumberIdParam = searchParams.get('mcNumberId');

    const mcWhere = await buildMcNumberWhereClause(session, request);

    const where: any = {
      OR: [
        { invoice: { customer: { companyId: session.user.companyId } } },
        { fuelEntry: { truck: { companyId: session.user.companyId } } },
        { breakdown: { companyId: session.user.companyId, deletedAt: null } },
      ],
    };

    if (mcWhere.mcNumberId) where.mcNumberId = mcWhere.mcNumberId;

    if (invoiceId) {
      where.invoiceId = invoiceId;
      where.OR = undefined;
      where.invoice = { customer: { companyId: session.user.companyId } };
    }
    if (fuelEntryId) {
      where.fuelEntryId = fuelEntryId;
      where.OR = undefined;
      where.fuelEntry = { truck: { companyId: session.user.companyId } };
    }
    if (breakdownId) {
      where.breakdownId = breakdownId;
      where.OR = undefined;
      where.breakdown = { companyId: session.user.companyId, deletedAt: null };
    }
    if (type) where.type = type;
    if (mcNumberIdParam) where.mcNumberId = mcNumberIdParam;

    if (search) {
      const searchConditions: any[] = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: PaymentQueryManager.paymentInclude,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Payment list error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
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

    // Verify referenced entities
    const verification = await PaymentQueryManager.verifyEntities(validated, session.user.companyId);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: verification.statusCode || 400 }
      );
    }

    const invoice = verification.data?.invoice;

    // Resolve MC number
    const assignedMcNumberId = await PaymentQueryManager.resolveMcNumberId(
      validated, session.user.companyId, session, request
    );

    if (validated.mcNumberId && !assignedMcNumberId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'MC Number not found' } },
        { status: 404 }
      );
    }

    // Generate payment number and create
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: validated.invoiceId || null,
        fuelEntryId: validated.fuelEntryId || null,
        breakdownId: validated.breakdownId || null,
        type: validated.type,
        mcNumberId: assignedMcNumberId || null,
        paymentNumber,
        amount: validated.amount,
        paymentDate: typeof validated.paymentDate === 'string' ? new Date(validated.paymentDate) : new Date(),
        paymentMethod: validated.paymentMethod,
        referenceNumber: validated.referenceNumber,
        receiptNumber: validated.receiptNumber,
        invoiceNumber: validated.invoiceNumber,
        paymentInstrumentId: validated.paymentInstrumentId || null,
        hasReceipt: validated.hasReceipt,
        hasInvoice: validated.hasInvoice,
        documentIds: validated.documentIds || [],
        notes: validated.notes,
        createdById: session.user.id,
      },
      include: PaymentQueryManager.paymentInclude,
    });

    // Update invoice balance
    await PaymentQueryManager.updateInvoiceAfterPayment(invoice, validated.amount);

    return NextResponse.json(
      { success: true, data: payment, message: 'Payment recorded successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Create payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
