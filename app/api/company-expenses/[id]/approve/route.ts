import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { approveCompanyExpenseSchema } from '@/lib/validations/company-expense';
import { companyExpenseManager } from '@/lib/managers/CompanyExpenseManager';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }
    if (!hasPermission(session.user.role, 'company_expenses.approve')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = approveCompanyExpenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 },
      );
    }

    const updated = await companyExpenseManager.approveExpense(
      id,
      session.user.id,
      session.user.companyId,
      validation.data.approved,
      validation.data.rejectionReason,
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('POST /api/company-expenses/[id]/approve error:', error);
    if (error.message === 'Expense not found' || error.message === 'Expense is not pending approval') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process approval' } },
      { status: 500 },
    );
  }
}
