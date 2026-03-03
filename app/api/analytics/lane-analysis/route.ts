import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';
import { ReportManager } from '@/lib/managers/ReportManager';

/**
 * GET /api/analytics/lane-analysis
 *
 * Returns lane-level profitability by origin/destination pair.
 * Includes: load count, revenue, costs, netProfit, margin, avgRevenuePerLoad, revenuePerMile.
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

    const lanes = await ReportManager.laneAnalysis(
      { companyId: loadMcWhere.companyId, mcNumberId: getMcNumberIdString(loadMcWhere) },
      { from: startDate, to: endDate }
    );

    // Compute summary
    const totalLoads = lanes.reduce((s, l) => s + l.loads, 0);
    const totalRevenue = lanes.reduce((s, l) => s + l.revenue, 0);
    const totalProfit = lanes.reduce((s, l) => s + l.netProfit, 0);

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        lanes,
        summary: {
          totalLanes: lanes.length,
          totalLoads,
          totalRevenue,
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          avgMargin:
            lanes.length > 0
              ? parseFloat(
                  (lanes.reduce((s, l) => s + l.margin, 0) / lanes.length).toFixed(2)
                )
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Lane analysis analytics error', { error });
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
