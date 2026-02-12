import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');
    const forecastMonths = parseInt(searchParams.get('forecastMonths') || '3');

    // Fetch historical data
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1); // Start of month

    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        pickupDate: { gte: startDate },
        status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] }
      },
      select: {
        revenue: true,
        pickupDate: true
      }
    });

    // Group by month
    const monthlyRevenue = new Map<string, number>();

    // Initialize months ensuring 0 if no data
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue.set(key, 0);
    }

    for (const load of loads) {
      if (load.pickupDate) {
        const d = new Date(load.pickupDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue.has(key)) {
          monthlyRevenue.set(key, (monthlyRevenue.get(key) || 0) + Number(load.revenue));
        }
      }
    }

    const historical = Array.from(monthlyRevenue.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Simple Linear Regression for forecasting
    // x = month index, y = revenue
    const n = historical.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    historical.forEach((item, index) => {
      sumX += index;
      sumY += item.revenue;
      sumXY += index * item.revenue;
      sumXX += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    const lastMonthDate = new Date();

    for (let i = 1; i <= forecastMonths; i++) {
      const nextIndex = n - 1 + i;
      // Forecast value = mx + c
      // If slope is negative, we project decline.
      // Improve: Add seasonality or moving average if needed.
      let projectedRevenue = slope * nextIndex + intercept;
      // Baseline constraint: Don't project negative revenue
      projectedRevenue = Math.max(0, projectedRevenue);

      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Simple confidence interval simulation
      // In real app, calculate standard error
      let confidence = 'medium';
      if (n >= 12) confidence = 'high';
      if (n < 4) confidence = 'low';

      forecast.push({
        month: monthKey,
        revenue: projectedRevenue,
        confidence
      });
    }

    // Metrics
    const totalRev = historical.reduce((sum, item) => sum + item.revenue, 0);
    const avgRev = n > 0 ? totalRev / n : 0;
    // Growth rate: (Last Month - First Month) / First Month
    const firstMonthRev = historical[0]?.revenue || 0;
    const lastMonthRev = historical[historical.length - 1]?.revenue || 0;
    const growthRate = firstMonthRev > 0
      ? ((lastMonthRev - firstMonthRev) / firstMonthRev) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        historical,
        forecast,
        metrics: {
          averageMonthlyRevenue: avgRev,
          growthRate,
          totalHistoricalRevenue: totalRev,
          monthsAnalyzed: n
        }
      }
    });

  } catch (error: any) {
    console.error('Revenue forecast error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
