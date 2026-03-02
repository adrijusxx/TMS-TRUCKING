import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { createCompanyExpenseTypeSchema } from '@/lib/validations/company-expense';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'company_expense_types.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const mcWhere = await buildMcNumberWhereClause(session, request);

    const types = await prisma.companyExpenseType.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        ...(mcWhere.mcNumberId
          ? { OR: [{ mcNumberId: mcWhere.mcNumberId }, { mcNumberId: null }] }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('GET /api/company-expense-types error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch expense types' } },
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
    if (!hasPermission(session.user.role, 'company_expense_types.create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = createCompanyExpenseTypeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const existing = await prisma.companyExpenseType.findFirst({
      where: {
        companyId: session.user.companyId,
        mcNumberId: validation.data.mcNumberId ?? null,
        name: validation.data.name,
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Expense type with this name already exists' } },
        { status: 409 },
      );
    }

    const type = await prisma.companyExpenseType.create({
      data: {
        companyId: session.user.companyId,
        mcNumberId: validation.data.mcNumberId ?? null,
        name: validation.data.name,
        description: validation.data.description ?? null,
        color: validation.data.color ?? null,
        sortOrder: validation.data.sortOrder ?? 0,
        isDefault: false,
      },
    });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (error) {
    console.error('POST /api/company-expense-types error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create expense type' } },
      { status: 500 },
    );
  }
}
