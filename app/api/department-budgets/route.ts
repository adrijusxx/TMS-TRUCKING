import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { upsertDepartmentBudgetSchema } from '@/lib/validations/company-expense';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'department_budgets.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    const mcWhere = await buildMcNumberWhereClause(session, request);

    const budgets = await prisma.departmentBudget.findMany({
      where: {
        year,
        ...mcWhere,
        ...(month && { month }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { department: 'asc' }],
    });

    // Also fetch actuals for the queried period
    const now = new Date();
    const queryMonth = month ?? now.getMonth() + 1;
    const startDate = new Date(year, queryMonth - 1, 1);
    const endDate = new Date(year, queryMonth, 0, 23, 59, 59);

    const actuals = await prisma.companyExpense.groupBy({
      by: ['department'],
      where: {
        deletedAt: null,
        date: { gte: startDate, lte: endDate },
        ...mcWhere,
      },
      _sum: { amount: true },
    });

    const actualsMap = Object.fromEntries(
      actuals.map((a) => [a.department, a._sum.amount ?? 0]),
    );

    return NextResponse.json({
      success: true,
      data: budgets.map((b) => ({
        ...b,
        actual: actualsMap[b.department] ?? 0,
        remaining: b.budgetAmount - (actualsMap[b.department] ?? 0),
        utilizationPct: b.budgetAmount > 0
          ? Math.round(((actualsMap[b.department] ?? 0) / b.budgetAmount) * 100)
          : 0,
      })),
    });
  } catch (error) {
    console.error('GET /api/department-budgets error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch budgets' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'department_budgets.manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = upsertDepartmentBudgetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const { department, month, year, budgetAmount, mcNumberId } = validation.data;
    const mcNum = mcNumberId ?? null;

    const existing = await prisma.departmentBudget.findFirst({
      where: {
        companyId: session.user.companyId,
        mcNumberId: mcNum,
        department,
        month,
        year,
      },
    });

    const budget = existing
      ? await prisma.departmentBudget.update({
          where: { id: existing.id },
          data: { budgetAmount },
        })
      : await prisma.departmentBudget.create({
          data: {
            companyId: session.user.companyId,
            mcNumberId: mcNum,
            department,
            month,
            year,
            budgetAmount,
          },
        });

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    console.error('POST /api/department-budgets error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save budget' } },
      { status: 500 },
    );
  }
}
