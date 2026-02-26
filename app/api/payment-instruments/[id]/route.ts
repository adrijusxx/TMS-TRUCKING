import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { updatePaymentInstrumentSchema } from '@/lib/validations/payment-instrument';
import { paymentInstrumentManager } from '@/lib/managers/PaymentInstrumentManager';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'payment_instruments.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const instrument = await prisma.paymentInstrument.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: { mcNumber: { select: { id: true, number: true } } },
    });

    if (!instrument) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment instrument not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: instrument });
  } catch (error) {
    console.error('GET /api/payment-instruments/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payment instrument' } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'payment_instruments.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

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
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment instrument not found' } },
        { status: 404 },
      );
    }

    const updated = await prisma.paymentInstrument.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/payment-instruments/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update payment instrument' } },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'payment_instruments.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await prisma.paymentInstrument.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment instrument not found' } },
        { status: 404 },
      );
    }

    await paymentInstrumentManager.deleteInstrument(id, session.user.companyId);
    return NextResponse.json({ success: true, message: 'Payment instrument deleted' });
  } catch (error) {
    console.error('DELETE /api/payment-instruments/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete payment instrument' } },
      { status: 500 },
    );
  }
}
