import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { createPaymentInstrumentSchema } from '@/lib/validations/payment-instrument';
import { paymentInstrumentManager } from '@/lib/managers/PaymentInstrumentManager';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const mcNumberId = searchParams.get('mcNumberId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const mcWhere = await buildMcNumberWhereClause(session, request);

    const instruments = await prisma.paymentInstrument.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
        ...(!includeInactive && { isActive: true }),
        ...(mcWhere.mcNumberId
          ? { OR: [{ mcNumberId: mcWhere.mcNumberId }, { mcNumberId: null }] }
          : mcNumberId
          ? { OR: [{ mcNumberId }, { mcNumberId: null }] }
          : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        mcNumber: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json({ success: true, data: instruments });
  } catch (error) {
    console.error('GET /api/payment-instruments error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payment instruments' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'payment_instruments.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = createPaymentInstrumentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const instrument = await paymentInstrumentManager.createInstrument({
      companyId: session.user.companyId,
      ...validation.data,
    });

    return NextResponse.json({ success: true, data: instrument }, { status: 201 });
  } catch (error) {
    console.error('POST /api/payment-instruments error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment instrument' } },
      { status: 500 },
    );
  }
}
