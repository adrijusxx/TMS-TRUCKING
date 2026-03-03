import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';
import { ReportManager } from '@/lib/managers/ReportManager';

/**
 * GET /api/analytics/pnl
 *
 * Returns a Profit & Loss statement for the given date range.
 * Includes: totalRevenue, costOfSales (driverPay + expenses), netProfit, margin,
 * loadCount, and revenueByCustomer breakdown.
 * Query params: startDate, endDate (default last 30 days)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const pnl = await ReportManager.profitAndLoss(
      { companyId: loadMcWhere.companyId, mcNumberId: getMcNumberIdString(loadMcWhere) },
      { from: startDate, to: endDate }
    );

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        totalRevenue: pnl.totalRevenue,
        costOfSales: {
          driverPay: pnl.costOfSales.driverPay,
          expenses: pnl.costOfSales.expenses,
          total: pnl.costOfSales.driverPay + pnl.costOfSales.expenses,
        },
        grossProfit: pnl.totalRevenue - pnl.costOfSales.driverPay - pnl.costOfSales.expenses,
        netProfit: pnl.netProfit,
        margin: parseFloat(pnl.margin.toFixed(2)),
        loadCount: pnl.loadCount,
        revenueByCustomer: pnl.revenueByCustomer.map((c) => ({
          ...c,
          revenue: parseFloat(c.revenue.toFixed(2)),
        })),
      },
    });
  } catch (error) {
    logger.error('P&L analytics error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/** Extract a single mcNumberId string from the where clause (if present). */
function getMcNumberIdString(
  mcWhere: { companyId: string; mcNumberId?: string | { in: string[] } }
): string | undefined {
  if (!mcWhere.mcNumberId) return undefined;
  if (typeof mcWhere.mcNumberId === 'string') return mcWhere.mcNumberId;
  if ('in' in mcWhere.mcNumberId && mcWhere.mcNumberId.in.length > 0) {
    return mcWhere.mcNumberId.in[0];
  }
  return undefined;
}
