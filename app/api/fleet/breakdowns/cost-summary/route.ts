import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/fleet/breakdowns/cost-summary
 * Get breakdown cost summary and analytics
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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const truckId = searchParams.get('truckId');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      reportedAt: {
        gte: startDate,
        lte: endDate,
      },
      totalCost: {
        gt: 0, // Only breakdowns with costs
      },
    };

    if (truckId) {
      where.truckId = truckId;
    }

    // Get all breakdowns with costs
    const breakdowns = await prisma.breakdown.findMany({
      where,
      select: {
        id: true,
        truckId: true,
        truck: {
          select: {
            truckNumber: true,
          },
        },
        breakdownType: true,
        totalCost: true,
        repairCost: true,
        towingCost: true,
        laborCost: true,
        partsCost: true,
        otherCosts: true,
        reportedAt: true,
      },
    });

    // Calculate summary
    const totalCost = breakdowns.reduce((sum, b) => sum + (b.totalCost || 0), 0);
    const breakdownCount = breakdowns.length;
    const averageCost = breakdownCount > 0 ? totalCost / breakdownCount : 0;

    // Group by type
    const byType: Record<string, { count: number; totalCost: number; averageCost: number }> = {};
    breakdowns.forEach((b) => {
      if (!byType[b.breakdownType]) {
        byType[b.breakdownType] = { count: 0, totalCost: 0, averageCost: 0 };
      }
      byType[b.breakdownType].count++;
      byType[b.breakdownType].totalCost += b.totalCost || 0;
    });
    Object.keys(byType).forEach((type) => {
      byType[type].averageCost = byType[type].totalCost / byType[type].count;
    });

    // Group by truck
    const byTruckMap: Record<string, { truckNumber: string; count: number; totalCost: number }> = {};
    breakdowns.forEach((b) => {
      if (!byTruckMap[b.truckId]) {
        byTruckMap[b.truckId] = {
          truckNumber: b.truck.truckNumber,
          count: 0,
          totalCost: 0,
        };
      }
      byTruckMap[b.truckId].count++;
      byTruckMap[b.truckId].totalCost += b.totalCost || 0;
    });
    const byTruck = Object.entries(byTruckMap)
      .map(([truckId, data]) => ({
        truckId,
        truckNumber: data.truckNumber,
        count: data.count,
        totalCost: data.totalCost,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Group by month
    const byMonthMap: Record<string, { count: number; totalCost: number }> = {};
    breakdowns.forEach((b) => {
      const month = new Date(b.reportedAt).toISOString().slice(0, 7); // YYYY-MM
      if (!byMonthMap[month]) {
        byMonthMap[month] = { count: 0, totalCost: 0 };
      }
      byMonthMap[month].count++;
      byMonthMap[month].totalCost += b.totalCost || 0;
    });
    const byMonth = Object.entries(byMonthMap)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalCost: data.totalCost,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate cost trend (compare first half vs second half of period)
    const periodDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const midDate = new Date(startDate.getTime() + (periodDays / 2) * 24 * 60 * 60 * 1000);

    const firstHalf = breakdowns.filter((b) => new Date(b.reportedAt) < midDate);
    const secondHalf = breakdowns.filter((b) => new Date(b.reportedAt) >= midDate);

    const firstHalfCost = firstHalf.reduce((sum, b) => sum + (b.totalCost || 0), 0);
    const secondHalfCost = secondHalf.reduce((sum, b) => sum + (b.totalCost || 0), 0);

    let costTrend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (firstHalfCost > 0) {
      trendPercentage = ((secondHalfCost - firstHalfCost) / firstHalfCost) * 100;
      if (trendPercentage > 5) {
        costTrend = 'up';
      } else if (trendPercentage < -5) {
        costTrend = 'down';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalCost,
        averageCost: Math.round(averageCost * 100) / 100,
        breakdownCount,
        byType,
        byTruck,
        byMonth,
        costTrend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
      },
    });
  } catch (error: any) {
    console.error('Error fetching breakdown cost summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown cost summary',
        },
      },
      { status: 500 }
    );
  }
}

