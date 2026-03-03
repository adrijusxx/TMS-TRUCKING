import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/analytics/customer-profitability
 *
 * Returns customer profitability data including margin, rating, and payment metrics.
 * Query params: startDate, endDate (default last 30 days)
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

    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    // Fetch loads with customer data
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        deliveryDate: { gte: startDate, lte: endDate },
      },
      select: {
        revenue: true,
        driverPay: true,
        totalExpenses: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
            paymentTerms: true,
          },
        },
      },
    });

    // Fetch invoices for avg payment days calculation
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: session.user.companyId,
        invoiceDate: { gte: startDate, lte: endDate },
        paidDate: { not: null },
      },
      select: {
        customerId: true,
        invoiceDate: true,
        paidDate: true,
      },
    });

    // Build payment days map by customer
    const paymentDaysMap = new Map<string, number[]>();
    for (const inv of invoices) {
      if (!inv.paidDate) continue;
      const days = Math.floor(
        (new Date(inv.paidDate).getTime() - new Date(inv.invoiceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const existing = paymentDaysMap.get(inv.customerId) ?? [];
      existing.push(days);
      paymentDaysMap.set(inv.customerId, existing);
    }

    // Aggregate by customer
    const byCustomer = new Map<
      string,
      {
        name: string;
        paymentTerms: number;
        totalLoads: number;
        totalRevenue: number;
        totalDriverPay: number;
        totalExpenses: number;
      }
    >();

    for (const load of loads) {
      const custId = load.customer?.id ?? 'unknown';
      const existing = byCustomer.get(custId) ?? {
        name: load.customer?.name ?? 'Unknown',
        paymentTerms: load.customer?.paymentTerms ?? 30,
        totalLoads: 0,
        totalRevenue: 0,
        totalDriverPay: 0,
        totalExpenses: 0,
      };
      existing.totalLoads += 1;
      existing.totalRevenue += Number(load.revenue ?? 0);
      existing.totalDriverPay += Number(load.driverPay ?? 0);
      existing.totalExpenses += Number(load.totalExpenses ?? 0);
      byCustomer.set(custId, existing);
    }

    // Build results with derived metrics
    const customers = Array.from(byCustomer.entries()).map(([customerId, c]) => {
      const netProfit = c.totalRevenue - c.totalDriverPay - c.totalExpenses;
      const margin = c.totalRevenue > 0 ? (netProfit / c.totalRevenue) * 100 : 0;
      const avgRevenuePerLoad = c.totalLoads > 0 ? c.totalRevenue / c.totalLoads : 0;

      // Average payment days
      const paymentDays = paymentDaysMap.get(customerId) ?? [];
      const avgPaymentDays =
        paymentDays.length > 0
          ? paymentDays.reduce((s, d) => s + d, 0) / paymentDays.length
          : null;

      // Rating based on margin
      let rating: 'A' | 'B' | 'C';
      if (margin > 20) rating = 'A';
      else if (margin >= 10) rating = 'B';
      else rating = 'C';

      return {
        customerId,
        name: c.name,
        totalLoads: c.totalLoads,
        totalRevenue: c.totalRevenue,
        avgRevenuePerLoad: parseFloat(avgRevenuePerLoad.toFixed(2)),
        totalDriverPay: c.totalDriverPay,
        totalExpenses: c.totalExpenses,
        netProfit: parseFloat(netProfit.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
        paymentTerms: c.paymentTerms,
        avgPaymentDays: avgPaymentDays !== null ? parseFloat(avgPaymentDays.toFixed(1)) : null,
        rating,
      };
    });

    // Sort by revenue descending
    customers.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        customers,
        summary: {
          totalCustomers: customers.length,
          totalRevenue: customers.reduce((s, c) => s + c.totalRevenue, 0),
          totalProfit: customers.reduce((s, c) => s + c.netProfit, 0),
          avgMargin:
            customers.length > 0
              ? parseFloat(
                  (customers.reduce((s, c) => s + c.margin, 0) / customers.length).toFixed(2)
                )
              : 0,
          ratingBreakdown: {
            A: customers.filter((c) => c.rating === 'A').length,
            B: customers.filter((c) => c.rating === 'B').length,
            C: customers.filter((c) => c.rating === 'C').length,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Customer profitability analytics error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
