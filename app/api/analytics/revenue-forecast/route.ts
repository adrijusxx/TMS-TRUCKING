import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check analytics permission (use database-backed check)
    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');
    const forecastMonths = parseInt(searchParams.get('forecastMonths') || '3');

    // Get historical revenue data (last N months)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const endDate = new Date();

    // Build MC filter - Load uses mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);

    // Include ALL loads for revenue forecast, not just completed ones
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        OR: [
          { pickupDate: { gte: startDate, lte: endDate } },
          { deliveryDate: { gte: startDate, lte: endDate } },
          { deliveredAt: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        pickupDate: true,
        deliveryDate: true,
        deliveredAt: true,
        revenue: true,
      },
    });

    // Group by month - use deliveredAt, deliveryDate, or pickupDate (in that order)
    const monthlyRevenue: Record<string, number> = {};
    loads.forEach((load) => {
      let date: Date | null = null;
      if (load.deliveredAt) {
        date = new Date(load.deliveredAt);
      } else if (load.deliveryDate) {
        date = new Date(load.deliveryDate);
      } else if (load.pickupDate) {
        date = new Date(load.pickupDate);
      }

      if (date) {
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(load.revenue) || 0);
      }
    });

    // Convert to array and sort
    const historicalData = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate trends
    let totalRevenue = 0;
    let monthCount = 0;
    let growthRate = 0;

    if (historicalData.length >= 2) {
      // Calculate average monthly revenue
      totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);
      monthCount = historicalData.length;
      const avgMonthlyRevenue = totalRevenue / monthCount;

      // Calculate growth rate (simple linear regression)
      const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
      const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;
      growthRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    } else if (historicalData.length === 1) {
      totalRevenue = historicalData[0].revenue;
      monthCount = 1;
    }

    const avgMonthlyRevenue = monthCount > 0 ? totalRevenue / monthCount : 0;

    // Generate forecast
    const forecast: Array<{ month: string; revenue: number; confidence: string }> = [];
    const lastMonth = historicalData[historicalData.length - 1];
    const baseRevenue = lastMonth ? lastMonth.revenue : avgMonthlyRevenue;

    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const month = forecastDate.toISOString().slice(0, 7);

      // Simple forecast: apply growth rate with some variance
      const projectedRevenue = baseRevenue * (1 + growthRate / 100) * Math.pow(1 + growthRate / 100, i - 1);

      // Add some variance based on historical volatility
      const variance = historicalData.length > 1
        ? calculateVariance(historicalData.map((d) => d.revenue))
        : 0.1;
      const confidence = variance < 0.15 ? 'high' : variance < 0.3 ? 'medium' : 'low';

      forecast.push({
        month,
        revenue: parseFloat(Math.max(0, projectedRevenue).toFixed(2)),
        confidence,
      });
    }

    // Calculate seasonality (if we have enough data)
    const seasonality = historicalData.length >= 12
      ? calculateSeasonality(historicalData)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        historical: historicalData,
        forecast,
        metrics: {
          averageMonthlyRevenue: parseFloat(avgMonthlyRevenue.toFixed(2)),
          totalHistoricalRevenue: parseFloat(totalRevenue.toFixed(2)),
          growthRate: parseFloat(growthRate.toFixed(2)),
          monthsAnalyzed: monthCount,
        },
        seasonality,
      },
    });
  } catch (error) {
    console.error('Revenue forecast error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0.1;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? stdDev / mean : 0.1;
}

function calculateSeasonality(data: Array<{ month: string; revenue: number }>): Record<string, number> {
  // Simple seasonality: average revenue by month number (1-12)
  const monthlyAverages: Record<number, number[]> = {};

  data.forEach((d) => {
    const monthNum = parseInt(d.month.split('-')[1]);
    if (!monthlyAverages[monthNum]) {
      monthlyAverages[monthNum] = [];
    }
    monthlyAverages[monthNum].push(d.revenue);
  });

  const overallAvg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
  const seasonality: Record<string, number> = {};

  for (let month = 1; month <= 12; month++) {
    if (monthlyAverages[month]) {
      const monthAvg = monthlyAverages[month].reduce((sum, v) => sum + v, 0) / monthlyAverages[month].length;
      seasonality[month.toString().padStart(2, '0')] = parseFloat(
        ((monthAvg / overallAvg - 1) * 100).toFixed(1)
      );
    }
  }

  return seasonality;
}

