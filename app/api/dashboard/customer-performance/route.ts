import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Get customer performance summary
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

    // Get all customers
    const customers = await prisma.customer.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        loads: {
          where: {
            status: {
              in: ['DELIVERED', 'INVOICED', 'PAID'],
            },
            deletedAt: null,
          },
          select: {
            id: true,
            revenue: true,
            deliveredAt: true,
            deliveryDate: true,
          },
        },
      },
    });

    const totalCustomers = customers.length;

    // Calculate performance metrics for each customer
    const customerPerformance = customers.map((customer) => {
      const loadsCompleted = customer.loads.length;
      const totalRevenue = customer.loads.reduce((sum, l) => sum + (l.revenue || 0), 0);
      const averageRevenuePerLoad =
        loadsCompleted > 0 ? totalRevenue / loadsCompleted : 0;

      // Calculate on-time rate
      const onTimeLoads = customer.loads.filter((l) => {
        if (!l.deliveredAt || !l.deliveryDate) return false;
        const delivered = new Date(l.deliveredAt);
        const expected = new Date(l.deliveryDate);
        // Consider on-time if delivered within 24 hours of expected
        return delivered <= new Date(expected.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      const onTimeRate = loadsCompleted > 0 ? (onTimeLoads / loadsCompleted) * 100 : 0;

      return {
        id: customer.id,
        name: customer.name,
        revenue: totalRevenue,
        loadsCompleted,
        averageRevenuePerLoad,
        onTimeRate,
      };
    });

    // Get active customers (customers with at least one completed load in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const activeCustomers = customerPerformance.filter((c) => {
      const recentLoads = customers
        .find((cust) => cust.id === c.id)
        ?.loads.filter((l) => l.deliveredAt && new Date(l.deliveredAt) >= ninetyDaysAgo);
      return recentLoads && recentLoads.length > 0;
    }).length;

    // Calculate totals
    const totalRevenue = customerPerformance.reduce((sum, c) => sum + c.revenue, 0);
    const averageRevenuePerCustomer =
      totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Get top customers (by revenue)
    const topCustomers = customerPerformance
      .filter((c) => c.loadsCompleted >= 1) // At least 1 load
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        topCustomers,
        totalRevenue,
        averageRevenuePerCustomer,
      },
    });
  } catch (error) {
    console.error('Customer performance fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

