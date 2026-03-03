import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/analytics/cash-flow
 *
 * Returns cash flow projection data:
 *  - upcomingPayments: pending settlements + approved advances
 *  - expectedRevenue: unpaid invoices + delivered-but-not-invoiced loads
 *  - netCashFlow = expectedRevenue.total - upcomingPayments.total
 *
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
    const companyId = session.user.companyId;

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    // --- Upcoming Payments ---

    // Pending settlements (PENDING or APPROVED but not yet PAID)
    const pendingSettlements = await prisma.settlement.findMany({
      where: {
        driver: { companyId },
        status: { in: ['PENDING', 'APPROVED'] },
        paidDate: null,
        periodEnd: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        settlementNumber: true,
        netPay: true,
        status: true,
        periodEnd: true,
        driver: { select: { driverNumber: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const totalPendingSettlements = pendingSettlements.reduce(
      (sum, s) => sum + Number(s.netPay ?? 0),
      0
    );

    // Approved advances not yet deducted
    const approvedAdvances = await prisma.driverAdvance.findMany({
      where: {
        driver: { companyId },
        approvalStatus: 'APPROVED',
        deductedAt: null,
        paidAt: null,
        requestDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        amount: true,
        requestDate: true,
        driver: { select: { driverNumber: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const totalApprovedAdvances = approvedAdvances.reduce(
      (sum, a) => sum + Number(a.amount ?? 0),
      0
    );

    // --- Expected Revenue ---

    // Unpaid invoices (SENT, PARTIAL, OVERDUE)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['SENT', 'PARTIAL', 'OVERDUE', 'INVOICED', 'POSTED'] },
        invoiceDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        amountPaid: true,
        balance: true,
        dueDate: true,
        status: true,
        customer: { select: { name: true } },
      },
    });

    const totalUnpaidInvoices = unpaidInvoices.reduce(
      (sum, inv) => sum + Number(inv.balance ?? 0),
      0
    );

    // Delivered loads not yet invoiced
    const deliveredNotInvoiced = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        status: { in: ['DELIVERED'] },
        deliveryDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        loadNumber: true,
        revenue: true,
        customer: { select: { name: true } },
        deliveryDate: true,
      },
    });

    const totalDeliveredNotInvoiced = deliveredNotInvoiced.reduce(
      (sum, l) => sum + Number(l.revenue ?? 0),
      0
    );

    // --- Summary ---
    const totalExpectedRevenue = totalUnpaidInvoices + totalDeliveredNotInvoiced;
    const totalUpcomingPayments = totalPendingSettlements + totalApprovedAdvances;
    const netCashFlow = totalExpectedRevenue - totalUpcomingPayments;

    return NextResponse.json({
      success: true,
      data: {
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
        upcomingPayments: {
          total: totalUpcomingPayments,
          settlements: {
            count: pendingSettlements.length,
            total: totalPendingSettlements,
          },
          advances: {
            count: approvedAdvances.length,
            total: totalApprovedAdvances,
          },
        },
        expectedRevenue: {
          total: totalExpectedRevenue,
          unpaidInvoices: {
            count: unpaidInvoices.length,
            total: totalUnpaidInvoices,
          },
          deliveredNotInvoiced: {
            count: deliveredNotInvoiced.length,
            total: totalDeliveredNotInvoiced,
          },
        },
        netCashFlow,
      },
    });
  } catch (error) {
    logger.error('Cash flow analytics error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
