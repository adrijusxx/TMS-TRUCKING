import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleApiError, successResponse } from '@/lib/api/route-helpers';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { updatePaymentInstrumentSchema } from '@/lib/validations/payment-instrument';
import { paymentInstrumentManager } from '@/lib/managers/PaymentInstrumentManager';

export const GET = withPermission('payment_instruments.view', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const instrument = await prisma.paymentInstrument.findFirst({
    where: { id, companyId: session.user.companyId, deletedAt: null },
    include: { mcNumber: { select: { id: true, number: true } } },
  });

  if (!instrument) {
    throw new NotFoundError('Payment instrument');
  }

  return successResponse(instrument);
});

export const PATCH = withPermission('payment_instruments.edit', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updatePaymentInstrumentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const existing = await prisma.paymentInstrument.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Payment instrument');
    }

    const updated = await prisma.paymentInstrument.update({
      where: { id },
      data: validation.data,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withPermission('payment_instruments.delete', async (
  request: NextRequest,
  session: any,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const existing = await prisma.paymentInstrument.findFirst({
    where: { id, companyId: session.user.companyId, deletedAt: null },
  });
  if (!existing) {
    throw new NotFoundError('Payment instrument');
  }

  await paymentInstrumentManager.deleteInstrument(id, session.user.companyId);
  return successResponse({ message: 'Payment instrument deleted' });
});
