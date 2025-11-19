import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const groupBy = searchParams.get('groupBy') || 'day';
    const customerId = searchParams.get('customerId');

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
      OR: [
        { pickupDate: { gte: startDate, lte: endDate } },
        { deliveryDate: { gte: startDate, lte: endDate } },
        { deliveredAt: { gte: startDate, lte: endDate } },
      ],
    };

    if (customerId) {
      where.customerId = customerId;
    }

    // Get all loads in the date range
    const loads = await prisma.load.findMany({
      where,
      select: {
        revenue: true,
        pickupDate: true,
        deliveryDate: true,
        deliveredAt: true,
        customerId: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate summary
    const totalRevenue = loads.reduce((sum, load) => sum + load.revenue, 0);
    const totalLoads = loads.length;
    const averageRevenue = totalLoads > 0 ? totalRevenue / totalLoads : 0;

    // Group by date
    const breakdown: Record<string, { revenue: number; loads: number }> = {};

    loads.forEach((load) => {
      // Use deliveredAt, deliveryDate, or pickupDate (in that order)
      let date: Date | null = null;
      if (load.deliveredAt) {
        date = new Date(load.deliveredAt);
      } else if (load.deliveryDate) {
        date = new Date(load.deliveryDate);
      } else if (load.pickupDate) {
        date = new Date(load.pickupDate);
      }
      
      if (!date) return;

      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!breakdown[key]) {
        breakdown[key] = { revenue: 0, loads: 0 };
      }
      breakdown[key].revenue += load.revenue;
      breakdown[key].loads += 1;
    });

    // Convert to array and sort
    const breakdownArray = Object.entries(breakdown)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        loads: data.loads,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalLoads,
          averageRevenue: parseFloat(averageRevenue.toFixed(2)),
        },
        breakdown: breakdownArray,
      },
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

