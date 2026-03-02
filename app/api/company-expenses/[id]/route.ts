import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { updateCompanyExpenseSchema } from '@/lib/validations/company-expense';

const expenseInclude = {
  expenseType: { select: { id: true, name: true, color: true } },
  paymentInstrument: { select: { id: true, name: true, color: true, lastFour: true, type: true } },
  vendor: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  mcNumber: { select: { id: true, number: true } },
  recurringChildren: { select: { id: true, expenseNumber: true, date: true, amount: true } },
} as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const expense = await prisma.companyExpense.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: expenseInclude,
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Company expense not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    console.error('GET /api/company-expenses/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch company expense' } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'company_expenses.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateCompanyExpenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const existing = await prisma.companyExpense.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Company expense not found' } },
        { status: 404 },
      );
    }

    const data: any = { ...validation.data };
    if (data.date) data.date = new Date(data.date);

    const updated = await prisma.companyExpense.update({
      where: { id },
      data,
      include: expenseInclude,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PATCH /api/company-expenses/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update company expense' } },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'company_expenses.delete')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await prisma.companyExpense.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Company expense not found' } },
        { status: 404 },
      );
    }

    await prisma.companyExpense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Company expense deleted' });
  } catch (error) {
    console.error('DELETE /api/company-expenses/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete company expense' } },
      { status: 500 },
    );
  }
}
