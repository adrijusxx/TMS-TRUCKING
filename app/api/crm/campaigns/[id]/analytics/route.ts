/**
 * GET /api/crm/campaigns/[id]/analytics — Campaign performance analytics
 *
 * Returns detailed metrics for a campaign including funnel data,
 * send rates, response rates, and conversion rates.
 *
 * Query params:
 *   compare=id1,id2  — Compare with other campaigns (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CampaignAnalyticsManager } from '@/lib/managers/CampaignAnalyticsManager';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const compareParam = searchParams.get('compare');

    // Comparison mode
    if (compareParam) {
      const campaignIds = [id, ...compareParam.split(',').filter(Boolean)];
      const data = await CampaignAnalyticsManager.getCampaignComparison(
        session.user.companyId,
        campaignIds
      );
      return NextResponse.json({ success: true, data });
    }

    // Single campaign metrics
    const data = await CampaignAnalyticsManager.getCampaignMetrics(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    logger.error('Failed to fetch campaign analytics', { error });
    return NextResponse.json(
      { error: 'Failed to fetch campaign analytics' },
      { status: 500 }
    );
  }
}
