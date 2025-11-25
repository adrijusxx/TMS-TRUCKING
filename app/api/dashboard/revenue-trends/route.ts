import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

/**
 * Get revenue trends for the last 6 months
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

    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Build MC filter - Load uses mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);

    // Get loads grouped by month - include ALL loads, use pickupDate or deliveryDate
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        OR: [
          { pickupDate: { gte: sixMonthsAgo, lte: now } },
          { deliveryDate: { gte: sixMonthsAgo, lte: now } },
          { deliveredAt: { gte: sixMonthsAgo, lte: now } },
        ],
      },
      select: {
        revenue: true,
        pickupDate: true,
        deliveryDate: true,
        deliveredAt: true,
        status: true,
      },
    });

    // Group by month - use pickupDate, deliveryDate, or deliveredAt
    const monthlyData: Record<string, { revenue: number; loads: number }> = {};

    for (const load of loads) {
      // Determine which date to use for grouping
      let date: Date | null = null;
      if (load.deliveredAt) {
        date = new Date(load.deliveredAt);
      } else if (load.deliveryDate) {
        date = new Date(load.deliveryDate);
      } else if (load.pickupDate) {
        date = new Date(load.pickupDate);
      }
      
      if (!date) continue;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, loads: 0 };
      }

      monthlyData[monthKey].revenue += load.revenue || 0;
      monthlyData[monthKey].loads += 1;
    }

    // Convert to array and sort by month
    const trends = Object.entries(monthlyData)
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: data.revenue,
          loads: data.loads,
          sortKey: key,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Revenue trends fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

