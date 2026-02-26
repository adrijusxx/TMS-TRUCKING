import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/services/safety/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - months));
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = new AnalyticsService(prisma, session.user.companyId);

    const [incidentCosts, claimCosts, costPerDriver, costTrends] = await Promise.all([
      analytics.getIncidentCosts(start, end),
      analytics.getClaimCosts(start, end),
      analytics.getCostPerDriver(start, end),
      analytics.getCostTrends(months),
    ]);

    const totalCost = incidentCosts.total + claimCosts.total;

    return NextResponse.json({
      data: {
        totalCost,
        incidentCosts,
        claimCosts,
        costPerDriver,
        costTrends,
        period: { start, end, months },
      },
    });
  } catch (error) {
    console.error('Error fetching cost analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch cost analytics' }, { status: 500 });
  }
}
