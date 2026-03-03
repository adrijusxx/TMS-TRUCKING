import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';
import { ReportManager } from '@/lib/managers/ReportManager';

/**
 * GET /api/analytics/driver-profitability
 *
 * Returns per-driver profitability: revenue, driverPay, expenses, netProfit,
 * margin, and revenuePerMile.
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

    const drivers = await ReportManager.driverProfitability(
      { companyId: loadMcWhere.companyId, mcNumberId: getMcNumberIdString(loadMcWhere) },
      { from: startDate, to: endDate }
    );

    // Compute summary
    const totalRevenue = drivers.reduce((s, d) => s + d.revenue, 0);
    const totalProfit = drivers.reduce((s, d) => s + d.netProfit, 0);
    const totalMiles = drivers.reduce((s, d) => s + d.miles, 0);

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        drivers,
        summary: {
          totalDrivers: drivers.length,
          totalRevenue,
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          avgMargin:
            drivers.length > 0
              ? parseFloat(
                  (drivers.reduce((s, d) => s + d.margin, 0) / drivers.length).toFixed(2)
                )
              : 0,
          totalMiles,
        },
      },
    });
  } catch (error) {
    logger.error('Driver profitability analytics error', { error });
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
  // If it's an array filter, pass the first one (ReportManager expects a single id)
  if ('in' in mcWhere.mcNumberId && mcWhere.mcNumberId.in.length > 0) {
    return mcWhere.mcNumberId.in[0];
  }
  return undefined;
}
