import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';
import { ReportManager } from '@/lib/managers/ReportManager';

/**
 * GET /api/analytics/on-time-delivery
 *
 * Returns on-time delivery metrics: total loads, on-time, late, noData, onTimeRate.
 * Also includes a per-customer breakdown.
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

    // Use ReportManager for overall metrics
    const mcCtx = {
      companyId: loadMcWhere.companyId,
      mcNumberId: getMcNumberIdString(loadMcWhere),
    };
    const overallMetrics = await ReportManager.onTimeDelivery(mcCtx, {
      from: startDate,
      to: endDate,
    });

    // Per-customer breakdown for additional insight
    const loadWhere: Prisma.LoadWhereInput = {
      ...loadMcWhere,
      deletedAt: null,
      deliveryDate: { gte: startDate, lte: endDate },
      status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] },
    };
    const loads = await prisma.load.findMany({
      where: loadWhere,
      select: {
        deliveryDate: true,
        deliveredAt: true,
        customer: { select: { id: true, name: true } },
      },
    });

    const byCustomer = new Map<
      string,
      { name: string; onTime: number; late: number; noData: number }
    >();

    for (const load of loads) {
      const custId = load.customer?.id ?? 'unknown';
      const entry = byCustomer.get(custId) ?? {
        name: load.customer?.name ?? 'Unknown',
        onTime: 0,
        late: 0,
        noData: 0,
      };

      if (!load.deliveredAt || !load.deliveryDate) {
        entry.noData++;
      } else if (new Date(load.deliveredAt) <= new Date(load.deliveryDate)) {
        entry.onTime++;
      } else {
        entry.late++;
      }

      byCustomer.set(custId, entry);
    }

    const customerBreakdown = Array.from(byCustomer.entries())
      .map(([customerId, c]) => {
        const tracked = c.onTime + c.late;
        return {
          customerId,
          name: c.name,
          totalLoads: c.onTime + c.late + c.noData,
          onTime: c.onTime,
          late: c.late,
          noData: c.noData,
          onTimeRate: tracked > 0 ? parseFloat(((c.onTime / tracked) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.totalLoads - a.totalLoads);

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        overall: {
          ...overallMetrics,
          onTimeRate: parseFloat(overallMetrics.onTimeRate.toFixed(2)),
        },
        byCustomer: customerBreakdown,
      },
    });
  } catch (error) {
    logger.error('On-time delivery analytics error', { error });
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
