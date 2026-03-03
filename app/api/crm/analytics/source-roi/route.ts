/**
 * GET /api/crm/analytics/source-roi — Lead source ROI analytics
 *
 * Query params:
 *   from=ISO    — start date filter (optional)
 *   to=ISO      — end date filter (optional)
 *   top=N       — return only top N sources (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { LeadSourceAnalytics } from '@/lib/managers/LeadSourceAnalytics';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const topParam = searchParams.get('top');

    const dateRange = {
      ...(fromParam ? { from: new Date(fromParam) } : {}),
      ...(toParam ? { to: new Date(toParam) } : {}),
    };
    const hasRange = fromParam || toParam;

    if (topParam) {
      const limit = Math.max(1, Math.min(50, Number(topParam) || 10));
      const data = await LeadSourceAnalytics.getTopSources(
        session.user.companyId,
        limit
      );
      return NextResponse.json({ success: true, data });
    }

    const data = await LeadSourceAnalytics.getSourceROI(
      session.user.companyId,
      hasRange ? dateRange : undefined
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch source ROI', { error });
    return NextResponse.json(
      { error: 'Failed to fetch source ROI analytics' },
      { status: 500 }
    );
  }
}
