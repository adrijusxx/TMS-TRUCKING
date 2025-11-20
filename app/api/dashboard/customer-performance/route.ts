import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

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

    // Build base filter with MC number if applicable
    const baseFilter = await buildMcNumberWhereClause(session, request);

    // Get all customers
    const customers = await prisma.customer.findMany({
      where: {
        ...baseFilter,
        isActive: true,
        deletedAt: null,
      },
      include: {
        loads: {
          where: {
            ...(baseFilter.mcNumber ? { mcNumber: baseFilter.mcNumber } : {}),
            deletedAt: null,
          },
          select: {
            id: true,
            revenue: true,
            status: true,
            deliveredAt: true,
            deliveryDate: true,
            pickupDate: true,
          },
        },
      },
    });

    const totalCustomers = customers.length;

    // Calculate performance metrics for each customer
    const customerPerformance = customers.map((customer) => {
      const allLoads = customer.loads;
      const loadsCompleted = allLoads.filter((l) => 
        ['DELIVERED', 'INVOICED', 'PAID'].includes(l.status)
      ).length;
      const totalRevenue = allLoads.reduce((sum, l) => sum + (l.revenue || 0), 0);
      const averageRevenuePerLoad =
        allLoads.length > 0 ? totalRevenue / allLoads.length : 0;

      // Calculate on-time rate (only for completed loads)
      const completedLoads = allLoads.filter((l) => 
        ['DELIVERED', 'INVOICED', 'PAID'].includes(l.status) && l.deliveredAt
      );
      const onTimeLoads = completedLoads.filter((l) => {
        if (!l.deliveredAt || !l.deliveryDate) return false;
        const delivered = new Date(l.deliveredAt);
        const expected = new Date(l.deliveryDate);
        // Consider on-time if delivered within 24 hours of expected
        return delivered <= new Date(expected.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      const onTimeRate = completedLoads.length > 0 ? (onTimeLoads / completedLoads.length) * 100 : 0;

      return {
        id: customer.id,
        name: customer.name,
        revenue: totalRevenue,
        loadsCompleted, // Count of completed loads
        totalLoads: allLoads.length, // Total loads (all statuses)
        averageRevenuePerLoad,
        onTimeRate,
      };
    });

    // Get active customers (customers with at least one load in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const activeCustomers = customerPerformance.filter((c) => {
      const customer = customers.find((cust) => cust.id === c.id);
      if (!customer) return false;
      // Check if customer has any loads with pickupDate or deliveryDate in last 90 days
      const recentLoads = customer.loads.filter((l) => {
        const pickupDate = l.pickupDate ? new Date(l.pickupDate) : null;
        const deliveryDate = l.deliveryDate ? new Date(l.deliveryDate) : null;
        return (pickupDate && pickupDate >= ninetyDaysAgo) || 
               (deliveryDate && deliveryDate >= ninetyDaysAgo) ||
               (l.deliveredAt && new Date(l.deliveredAt) >= ninetyDaysAgo);
      });
      return recentLoads.length > 0;
    }).length;

    // Calculate totals
    const totalRevenue = customerPerformance.reduce((sum, c) => sum + c.revenue, 0);
    const averageRevenuePerCustomer =
      totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Get top customers (by revenue) - include all customers with at least 1 load
    const topCustomers = customerPerformance
      .filter((c) => {
        const customer = customers.find((cust) => cust.id === c.id);
        return customer && customer.loads.length >= 1; // At least 1 load (any status)
      })
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

