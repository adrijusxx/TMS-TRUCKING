import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/trucks/breakdown-stats
 * Get breakdown statistics for all trucks
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

    // Get breakdown stats per truck
    const breakdowns = await prisma.breakdown.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        truckId: true,
        reportedAt: true,
        breakdownType: true,
        priority: true,
        status: true,
      },
      orderBy: {
        reportedAt: 'desc',
      },
    });

    // Group by truck
    const truckStats: Record<
      string,
      {
        totalBreakdowns: number;
        lastBreakdownDate: Date | null;
        breakdownFrequency: number; // breakdowns per month
        highRisk: boolean; // 3+ breakdowns in last 6 months
        criticalBreakdowns: number;
      }
    > = {};

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    breakdowns.forEach((breakdown) => {
      if (!truckStats[breakdown.truckId]) {
        truckStats[breakdown.truckId] = {
          totalBreakdowns: 0,
          lastBreakdownDate: null,
          breakdownFrequency: 0,
          highRisk: false,
          criticalBreakdowns: 0,
        };
      }

      const stats = truckStats[breakdown.truckId];
      stats.totalBreakdowns++;

      if (!stats.lastBreakdownDate || breakdown.reportedAt > stats.lastBreakdownDate) {
        stats.lastBreakdownDate = breakdown.reportedAt;
      }

      if (breakdown.priority === 'CRITICAL') {
        stats.criticalBreakdowns++;
      }
    });

    // Calculate frequency and risk for each truck
    Object.keys(truckStats).forEach((truckId) => {
      const stats = truckStats[truckId];
      const recentBreakdowns = breakdowns.filter(
        (b) => b.truckId === truckId && b.reportedAt >= sixMonthsAgo
      ).length;

      // Calculate frequency (breakdowns per month over last 6 months)
      stats.breakdownFrequency = recentBreakdowns / 6;

      // High risk = 3+ breakdowns in last 6 months
      stats.highRisk = recentBreakdowns >= 3;
    });

    return NextResponse.json({
      success: true,
      data: truckStats,
    });
  } catch (error: any) {
    console.error('Error fetching truck breakdown stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch truck breakdown stats',
        },
      },
      { status: 500 }
    );
  }
}

