import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum([
    'CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER',
    'FACTOR', 'QUICK_PAY', 'EFS', 'COMDATA', 'CASHAPP', 'ZELLE', 'VENMO',
  ]),
  paymentDate: z.string().datetime().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  hasReceipt: z.boolean().optional(),
  hasInvoice: z.boolean().optional(),
  receiptNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
});

async function generatePaymentNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const lastPayment = await prisma.payment.findFirst({
    where: { paymentNumber: { startsWith: `PAY-${year}-` } },
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true },
  });

  let sequence = 1;
  if (lastPayment) {
    const match = lastPayment.paymentNumber.match(/PAY-\d{4}-(\d+)/);
    if (match) sequence = parseInt(match[1]) + 1;
  }

  return `PAY-${year}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * GET /api/breakdowns/[id]/payments
 * Get all payments for a breakdown
 */
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

    const { id } = await params;

    // Verify breakdown belongs to company
    const breakdown = await prisma.breakdown.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });

    if (!breakdown) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' } },
        { status: 404 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: { breakdownId: id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      data: { payments, totalPaid },
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/breakdowns/[id]/payments
 * Add a payment to a breakdown
 */
export async function POST(
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

    if (!hasPermission(session.user.role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Verify breakdown belongs to company
    const breakdown = await prisma.breakdown.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true, mcNumberId: true },
    });

    if (!breakdown) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Breakdown not found' } },
        { status: 404 }
      );
    }

    const paymentNumber = await generatePaymentNumber(session.user.companyId);

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        breakdownId: id,
        type: 'BREAKDOWN',
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : new Date(),
        referenceNumber: validatedData.referenceNumber,
        notes: validatedData.notes,
        hasReceipt: validatedData.hasReceipt ?? false,
        hasInvoice: validatedData.hasInvoice ?? false,
        receiptNumber: validatedData.receiptNumber,
        invoiceNumber: validatedData.invoiceNumber,
        mcNumberId: breakdown.mcNumberId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}












