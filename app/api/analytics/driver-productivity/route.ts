import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';
import { ReportManager } from '@/lib/managers/ReportManager';

/**
 * GET /api/analytics/driver-productivity
 *
 * Returns per-driver productivity metrics: loads/week, revenue/week, miles/week.
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

    const drivers = await ReportManager.driverProductivity(
      { companyId: loadMcWhere.companyId, mcNumberId: getMcNumberIdString(loadMcWhere) },
      { from: startDate, to: endDate }
    );

    // Compute summary
    const totalLoads = drivers.reduce((s, d) => s + d.loads, 0);
    const totalRevenue = drivers.reduce((s, d) => s + d.revenue, 0);
    const totalMiles = drivers.reduce((s, d) => s + d.miles, 0);
    const weeks = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 86400000))
    );

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        drivers: drivers.map((d) => ({
          ...d,
          loadsPerWeek: parseFloat(d.loadsPerWeek.toFixed(2)),
          revenuePerWeek: parseFloat(d.revenuePerWeek.toFixed(2)),
          milesPerWeek: parseFloat(d.milesPerWeek.toFixed(2)),
        })),
        summary: {
          totalDrivers: drivers.length,
          totalLoads,
          totalRevenue,
          totalMiles,
          periodWeeks: weeks,
          avgLoadsPerDriverPerWeek:
            drivers.length > 0
              ? parseFloat((totalLoads / drivers.length / weeks).toFixed(2))
              : 0,
          avgRevenuePerDriverPerWeek:
            drivers.length > 0
              ? parseFloat((totalRevenue / drivers.length / weeks).toFixed(2))
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Driver productivity analytics error', { error });
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
