import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/services/safety/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType') || 'INCIDENT_TRENDS';
    const months = parseInt(searchParams.get('months') || '12');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - months));
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = new AnalyticsService(prisma, session.user.companyId);

    switch (reportType) {
      case 'INCIDENT_TRENDS': {
        const data = await analytics.getIncidentTrends(months);
        return NextResponse.json({ data, reportType });
      }
      case 'COMPLIANCE_STATUS': {
        const data = await analytics.getComplianceStatusReport();
        return NextResponse.json({ data, reportType });
      }
      case 'COST_ANALYSIS': {
        const [incidentCosts, claimCosts, costTrends] = await Promise.all([
          analytics.getIncidentCosts(start, end),
          analytics.getClaimCosts(start, end),
          analytics.getCostTrends(months),
        ]);
        return NextResponse.json({ data: { incidentCosts, claimCosts, costTrends }, reportType });
      }
      case 'DRIVER_PERFORMANCE': {
        const data = await analytics.getCostPerDriver(start, end);
        return NextResponse.json({ data, reportType });
      }
      case 'CSA_TRENDS': {
        const csaScores = await prisma.cSAScore.findMany({
          where: { companyId: session.user.companyId },
          orderBy: { scoreDate: 'asc' },
          take: months * 7,
        });
        return NextResponse.json({ data: csaScores, reportType });
      }
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
