import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { ScorecardService } from '@/lib/services/safety/ScorecardService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;
    const { searchParams } = new URL(request.url);
    const includeTrend = searchParams.get('includeTrend') === 'true';
    const trendMonths = parseInt(searchParams.get('trendMonths') || '6');

    const service = new ScorecardService(prisma, session.user.companyId);
    const scorecard = await service.calculateDriverScore(driverId);

    let trend = null;
    if (includeTrend) {
      trend = await service.calculateDriverScoreTrend(driverId, trendMonths);
    }

    return NextResponse.json({ data: { ...scorecard, trend } });
  } catch (error) {
    console.error('Error calculating driver scorecard:', error);
    return NextResponse.json({ error: 'Failed to calculate scorecard' }, { status: 500 });
  }
}
