import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * GET /api/accounting/reports/profit-loss?start=YYYY-MM-DD&end=YYYY-MM-DD
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

    const mcWhere = await buildMcNumberWhereClause(session, request);
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

    const where = {
      ...mcWhere,
      deletedAt: null,
      ...(Object.keys(dateFilter).length > 0 ? { deliveryDate: dateFilter } : {}),
    };

    const [loadAgg, factoringAgg] = await Promise.all([
      prisma.load.aggregate({
        where,
        _sum: {
          revenue: true,
          driverPay: true,
          totalExpenses: true,
          netProfit: true,
          totalMiles: true,
        },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          customer: { companyId: session.user.companyId },
          factoringStatus: { not: 'NOT_FACTORED' },
          ...(startDate ? { invoiceDate: dateFilter } : {}),
        },
        _sum: { factoringFee: true },
      }),
    ]);

    const revenue = loadAgg._sum.revenue || 0;
    const driverPay = loadAgg._sum.driverPay || 0;
    const totalExpenses = loadAgg._sum.totalExpenses || 0;
    const grossProfit = revenue - driverPay - totalExpenses;
    const factoringFees = factoringAgg._sum.factoringFee || 0;
    const netProfit = grossProfit - factoringFees;
    const totalMiles = loadAgg._sum.totalMiles || 0;

    return NextResponse.json({
      success: true,
      data: {
        revenue,
        driverPay,
        totalExpenses,
        grossProfit,
        factoringFees,
        netProfit,
        loadCount: loadAgg._count,
        revenuePerMile: totalMiles > 0 ? Number((revenue / totalMiles).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    console.error('P&L report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } },
      { status: 500 }
    );
  }
}
