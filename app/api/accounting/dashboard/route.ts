import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { InvoiceStatus, LoadStatus, SettlementStatus } from '@prisma/client';

/**
 * GET /api/accounting/dashboard
 * Returns aggregated accounting metrics for the dashboard.
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

    const companyId = session.user.companyId;
    const mcWhere = await buildMcNumberWhereClause(session, request);
    const now = new Date();

    // Date boundaries
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Run all queries in parallel
    const [
      arAging,
      weekRevenue,
      lastWeekRevenue,
      pendingSettlements,
      pendingAdvances,
      pendingInvoicing,
      pendingSettlement,
      billingHolds,
      factoringStats,
    ] = await Promise.all([
      // AR Aging: group invoices by days outstanding
      getArAging(companyId),
      // This week revenue
      prisma.load.aggregate({
        where: { ...mcWhere, deletedAt: null, deliveryDate: { gte: weekStart } },
        _sum: { revenue: true, netProfit: true },
      }),
      // Last week revenue
      prisma.load.aggregate({
        where: { ...mcWhere, deletedAt: null, deliveryDate: { gte: lastWeekStart, lt: weekStart } },
        _sum: { revenue: true, netProfit: true },
      }),
      // Pending settlement approvals
      prisma.settlement.aggregate({
        where: { driver: { companyId }, status: SettlementStatus.PENDING },
        _count: true,
        _sum: { netPay: true },
      }),
      // Pending advance requests
      prisma.driverAdvance.aggregate({
        where: { driver: { companyId }, approvalStatus: 'PENDING' },
        _count: true,
        _sum: { amount: true },
      }),
      // Loads ready for invoicing
      prisma.load.count({
        where: { ...mcWhere, deletedAt: null, status: LoadStatus.DELIVERED, invoicedAt: null, isBillingHold: false },
      }),
      // Loads ready for settlement
      prisma.load.count({
        where: { ...mcWhere, deletedAt: null, readyForSettlement: true, status: { in: [LoadStatus.INVOICED, LoadStatus.DELIVERED] } },
      }),
      // Billing holds
      prisma.load.count({
        where: { ...mcWhere, deletedAt: null, isBillingHold: true },
      }),
      // Factoring summary
      getFactoringSummary(companyId),
    ]);

    const weeklyRevenue = weekRevenue._sum.revenue || 0;
    const weeklyProfit = weekRevenue._sum.netProfit || 0;
    const lastWeeklyRevenue = lastWeekRevenue._sum.revenue || 0;
    const profitMargin = weeklyRevenue > 0 ? (weeklyProfit / weeklyRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        arAging,
        weeklyRevenue,
        weeklyProfit,
        lastWeeklyRevenue,
        revenueChange: lastWeeklyRevenue > 0
          ? ((weeklyRevenue - lastWeeklyRevenue) / lastWeeklyRevenue) * 100
          : 0,
        profitMargin,
        pendingSettlements: {
          count: pendingSettlements._count || 0,
          totalAmount: pendingSettlements._sum?.netPay || 0,
        },
        pendingAdvances: {
          count: pendingAdvances._count || 0,
          totalAmount: pendingAdvances._sum?.amount || 0,
        },
        pendingInvoicing,
        pendingSettlement,
        billingHolds,
        factoring: factoringStats,
      },
    });
  } catch (error) {
    console.error('Error fetching accounting dashboard:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } },
      { status: 500 }
    );
  }
}

async function getArAging(companyId: string) {
  const unpaid = await prisma.invoice.findMany({
    where: {
      customer: { companyId },
      status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE, InvoiceStatus.INVOICED] },
      balance: { gt: 0 },
    },
    select: { balance: true, dueDate: true },
  });

  const now = Date.now();
  const buckets = { current: 0, days30: 0, days60: 0, days90plus: 0 };

  for (const inv of unpaid) {
    const daysOverdue = inv.dueDate
      ? Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000)
      : 0;
    const bal = inv.balance || 0;

    if (daysOverdue <= 0) buckets.current += bal;
    else if (daysOverdue <= 30) buckets.days30 += bal;
    else if (daysOverdue <= 60) buckets.days60 += bal;
    else buckets.days90plus += bal;
  }

  return {
    current: Number(buckets.current.toFixed(2)),
    days30: Number(buckets.days30.toFixed(2)),
    days60: Number(buckets.days60.toFixed(2)),
    days90plus: Number(buckets.days90plus.toFixed(2)),
    total: Number((buckets.current + buckets.days30 + buckets.days60 + buckets.days90plus).toFixed(2)),
  };
}

async function getFactoringSummary(companyId: string) {
  const [submitted, funded, reserveHeld] = await Promise.all([
    prisma.invoice.aggregate({
      where: { customer: { companyId }, factoringStatus: 'SUBMITTED_TO_FACTOR' },
      _count: true,
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { customer: { companyId }, factoringStatus: 'FUNDED' },
      _count: true,
      _sum: { advanceAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { customer: { companyId }, factoringStatus: 'FUNDED' },
      _sum: { reserveAmount: true },
    }),
  ]);

  return {
    submittedCount: submitted._count || 0,
    submittedAmount: submitted._sum.total || 0,
    fundedCount: funded._count || 0,
    fundedAmount: funded._sum.advanceAmount || 0,
    reserveHeld: reserveHeld._sum.reserveAmount || 0,
  };
}
