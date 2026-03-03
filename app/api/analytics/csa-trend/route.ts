import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/analytics/csa-trend
 *
 * Returns CSA compliance score trends over time by BASIC category.
 * Data sourced from the CSAScore table (company-level, not MC-scoped).
 * Query params: startDate, endDate (default last 12 months)
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

    const { searchParams } = new URL(request.url);
    const companyId = session.user.companyId;

    // Default to 12-month window for CSA trends
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const scores = await prisma.cSAScore.findMany({
      where: {
        companyId,
        scoreDate: { gte: startDate, lte: endDate },
      },
      orderBy: { scoreDate: 'asc' },
      select: {
        id: true,
        scoreDate: true,
        basicCategory: true,
        percentile: true,
        score: true,
        previousPercentile: true,
        trend: true,
        violationCount: true,
      },
    });

    // Group by category
    const byCategory = new Map<
      string,
      Array<{
        date: string;
        percentile: number;
        score: number | null;
        trend: string | null;
        violationCount: number;
      }>
    >();

    for (const s of scores) {
      const category = s.basicCategory;
      const entries = byCategory.get(category) ?? [];
      entries.push({
        date: s.scoreDate.toISOString().split('T')[0],
        percentile: s.percentile,
        score: s.score,
        trend: s.trend,
        violationCount: s.violationCount,
      });
      byCategory.set(category, entries);
    }

    // Build per-category summary with latest values
    const categories = Array.from(byCategory.entries()).map(([category, entries]) => {
      const latest = entries[entries.length - 1];
      const earliest = entries[0];
      const totalViolations = entries.reduce((s, e) => s + e.violationCount, 0);

      // Threshold: percentile > 75 is critical, > 50 is warning
      let status: 'critical' | 'warning' | 'ok';
      if (latest.percentile > 75) status = 'critical';
      else if (latest.percentile > 50) status = 'warning';
      else status = 'ok';

      return {
        category,
        status,
        latestPercentile: latest.percentile,
        latestScore: latest.score,
        trend: latest.trend,
        percentileChange: parseFloat(
          (latest.percentile - earliest.percentile).toFixed(2)
        ),
        totalViolations,
        dataPoints: entries,
      };
    });

    // Overall summary
    const allLatest = categories.map((c) => c.latestPercentile);
    const avgPercentile =
      allLatest.length > 0
        ? parseFloat((allLatest.reduce((s, p) => s + p, 0) / allLatest.length).toFixed(2))
        : 0;
    const criticalCount = categories.filter((c) => c.status === 'critical').length;
    const warningCount = categories.filter((c) => c.status === 'warning').length;

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        categories,
        summary: {
          totalCategories: categories.length,
          avgPercentile,
          criticalCount,
          warningCount,
          okCount: categories.length - criticalCount - warningCount,
          totalViolations: categories.reduce((s, c) => s + c.totalViolations, 0),
        },
      },
    });
  } catch (error) {
    logger.error('CSA trend analytics error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
