import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BreakdownSLAManager } from '@/lib/managers/BreakdownSLAManager';

/**
 * GET /api/fleet/breakdowns/sla
 *
 * Returns SLA metrics for breakdown cases.
 *
 * Query params:
 * - breakdownId (optional): track SLA for a single breakdown
 * - startDate (optional): start of date range (default: 30 days ago)
 * - endDate (optional): end of date range (default: now)
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

    const { searchParams } = new URL(request.url);
    const breakdownId = searchParams.get('breakdownId');

    // Single breakdown SLA tracking
    if (breakdownId) {
      const sla = await BreakdownSLAManager.trackSLA(breakdownId);
      return NextResponse.json({ success: true, data: sla });
    }

    // Fleet-wide SLA metrics
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const metrics = await BreakdownSLAManager.getSLAMetrics(
      session.user.companyId,
      startDate,
      endDate
    );

    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error('Error fetching SLA metrics:', error);

    if (error?.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch SLA metrics',
        },
      },
      { status: 500 }
    );
  }
}
