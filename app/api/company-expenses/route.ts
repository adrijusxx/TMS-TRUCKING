import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { createCompanyExpenseSchema } from '@/lib/validations/company-expense';
import { companyExpenseManager } from '@/lib/managers/CompanyExpenseManager';

const expenseInclude = {
  expenseType: { select: { id: true, name: true, color: true } },
  paymentInstrument: { select: { id: true, name: true, color: true, lastFour: true, type: true } },
  vendor: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  mcNumber: { select: { id: true, number: true } },
} as const;

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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const expenseTypeId = searchParams.get('expenseTypeId');
    const paymentInstrumentId = searchParams.get('paymentInstrumentId');
    const approvalStatus = searchParams.get('approvalStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sort') || 'date';
    const sortOrder = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const mcWhere = await buildMcNumberWhereClause(session, request);

    const where: any = {
      deletedAt: null,
      ...mcWhere,
    };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { expenseNumber: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (department) where.department = department;
    if (expenseTypeId) where.expenseTypeId = expenseTypeId;
    if (paymentInstrumentId) where.paymentInstrumentId = paymentInstrumentId;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const validSortFields = ['date', 'amount', 'expenseNumber', 'createdAt', 'description'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'date';

    const [expenses, total, sumResult] = await Promise.all([
      prisma.companyExpense.findMany({
        where,
        include: expenseInclude,
        orderBy: { [orderField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.companyExpense.count({ where }),
      prisma.companyExpense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalAmount: sumResult._sum.amount ?? 0,
      },
    });
  } catch (error) {
    console.error('GET /api/company-expenses error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch company expenses' } },
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
    if (!hasPermission(session.user.role, 'company_expenses.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = createCompanyExpenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const expense = await companyExpenseManager.createExpense({
      companyId: session.user.companyId,
      ...validation.data,
      date: new Date(validation.data.date as string),
      createdById: session.user.id,
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/company-expenses error:', error);
    if (error.message === 'Invalid expense type' || error.message === 'Invalid payment instrument') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create company expense' } },
      { status: 500 },
    );
  }
}
