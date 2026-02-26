import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { FactoringStatus } from '@prisma/client';

/**
 * GET /api/accounting/reports/factoring?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns factoring summary for the given period.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const baseWhere = {
      customer: { companyId },
      factoringStatus: { not: FactoringStatus.NOT_FACTORED } as const,
      ...(Object.keys(dateFilter).length > 0 ? { submittedToFactorAt: dateFilter } : {}),
    };

    const [submitted, funded, released, fees] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...baseWhere, factoringStatus: FactoringStatus.SUBMITTED_TO_FACTOR },
        _count: true,
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { ...baseWhere, factoringStatus: FactoringStatus.FUNDED },
        _count: true,
        _sum: { advanceAmount: true, reserveAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...baseWhere, factoringStatus: FactoringStatus.RESERVE_RELEASED },
        _sum: { reserveAmount: true },
      }),
      prisma.invoice.aggregate({
        where: baseWhere,
        _sum: { factoringFee: true },
      }),
    ]);

    const fundedAmount = funded._sum.advanceAmount || 0;
    const totalFeesPaid = fees._sum.factoringFee || 0;
    const reserveHeld = funded._sum.reserveAmount || 0;
    const reserveReleased = released._sum.reserveAmount || 0;

    return NextResponse.json({
      success: true,
      data: {
        submittedCount: submitted._count || 0,
        submittedAmount: submitted._sum.total || 0,
        fundedCount: funded._count || 0,
        fundedAmount,
        reserveHeld,
        reserveReleased,
        totalFeesPaid,
        netAfterFactoring: fundedAmount + reserveReleased - totalFeesPaid,
      },
    });
  } catch (error) {
    console.error('Factoring report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } },
      { status: 500 }
    );
  }
}
