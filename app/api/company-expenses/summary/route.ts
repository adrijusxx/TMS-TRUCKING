import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'company_expenses.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const mcWhere = await buildMcNumberWhereClause(session, request);
    const companyId = session.user.companyId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const baseWhere = { deletedAt: null, ...mcWhere };

    const [
      totalThisMonth,
      totalLastMonth,
      pendingCount,
      missingReceiptCount,
      byDepartment,
      byType,
      byInstrument,
      monthlyTrend,
    ] = await Promise.all([
      prisma.companyExpense.aggregate({
        where: { ...baseWhere, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.companyExpense.aggregate({
        where: { ...baseWhere, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.companyExpense.count({
        where: { ...baseWhere, approvalStatus: 'PENDING' },
      }),
      prisma.companyExpense.count({
        where: {
          ...baseWhere,
          hasReceipt: false,
          date: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          approvalStatus: { not: 'REJECTED' },
        },
      }),
      prisma.companyExpense.groupBy({
        by: ['department'],
        where: { ...baseWhere, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.companyExpense.groupBy({
        by: ['expenseTypeId'],
        where: { ...baseWhere, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      prisma.companyExpense.groupBy({
        by: ['paymentInstrumentId'],
        where: {
          ...baseWhere,
          date: { gte: startOfMonth, lte: endOfMonth },
          paymentInstrumentId: { not: null },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
      // Last 6 months trend (uses baseWhere for MC filtering)
      prisma.companyExpense.findMany({
        where: {
          ...baseWhere,
          date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
        select: { date: true, amount: true },
      }),
    ]);

    // Enrich expense types with names
    const typeIds = byType.map((t) => t.expenseTypeId);
    const types = await prisma.companyExpenseType.findMany({
      where: { id: { in: typeIds } },
      select: { id: true, name: true, color: true },
    });
    const typeMap = Object.fromEntries(types.map((t) => [t.id, t]));

    // Enrich instruments with names
    const instrumentIds = byInstrument
      .map((i) => i.paymentInstrumentId)
      .filter(Boolean) as string[];
    const instruments = await prisma.paymentInstrument.findMany({
      where: { id: { in: instrumentIds } },
      select: { id: true, name: true, color: true, lastFour: true },
    });
    const instrumentMap = Object.fromEntries(instruments.map((i) => [i.id, i]));

    return NextResponse.json({
      success: true,
      data: {
        thisMonth: totalThisMonth._sum.amount ?? 0,
        lastMonth: totalLastMonth._sum.amount ?? 0,
        pendingApprovalCount: pendingCount,
        missingReceiptCount,
        byDepartment: byDepartment.map((d) => ({
          department: d.department,
          total: d._sum.amount ?? 0,
          count: d._count.id,
        })),
        byType: byType.map((t) => ({
          type: typeMap[t.expenseTypeId] ?? { id: t.expenseTypeId, name: 'Unknown', color: null },
          total: t._sum.amount ?? 0,
          count: t._count.id,
        })),
        byInstrument: byInstrument.map((i) => ({
          instrument: i.paymentInstrumentId
            ? (instrumentMap[i.paymentInstrumentId] ?? null)
            : null,
          total: i._sum.amount ?? 0,
        })),
        monthlyTrend: Object.entries(
          monthlyTrend.reduce<Record<string, number>>((acc, row) => {
            const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
            acc[key] = (acc[key] ?? 0) + row.amount;
            return acc;
          }, {}),
        )
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, total]) => ({ month, total })),
      },
    });
  } catch (error) {
    console.error('GET /api/company-expenses/summary error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch summary' } },
      { status: 500 },
    );
  }
}
