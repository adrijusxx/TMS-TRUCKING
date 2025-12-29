import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadExpenseManager } from '@/lib/managers/LoadExpenseManager';
import { z } from 'zod';

const updateExpenseSchema = z.object({
  expenseType: z
    .enum([
      'TOLL',
      'SCALE',
      'SCALE_TICKET',
      'PERMIT',
      'LUMPER',
      'DETENTION',
      'PARKING',
      'REPAIR',
      'TOWING',
      'TIRE',
      'FUEL_ADDITIVE',
      'DEF',
      'WASH',
      'MEAL',
      'LODGING',
      'PHONE',
      'OTHER',
    ])
    .optional(),
  amount: z.number().positive().max(10000).optional(),
  vendor: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional(),
  date: z.string().datetime().optional(),
});

const approveExpenseSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Update an expense
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const expenseId = resolvedParams.id;
    const body = await request.json();

    // Check if this is an approval request
    if ('approved' in body) {
      return handleApproval(expenseId, body, session);
    }

    // Otherwise, it's an update request
    const validated = updateExpenseSchema.parse(body);

    // Verify expense exists and belongs to company
    const expense = await prisma.loadExpense.findFirst({
      where: {
        id: expenseId,
        load: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Expense not found' },
        },
        { status: 404 }
      );
    }

    // Update expense
    const expenseManager = new LoadExpenseManager();
    const updatedExpense = await expenseManager.updateExpense(expenseId, {
      loadId: expense.loadId,
      expenseType: validated.expenseType,
      amount: validated.amount,
      vendorId: validated.vendor,
      description: validated.description,
      receiptUrl: validated.receiptUrl,
      date: validated.date ? new Date(validated.date) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update expense',
        },
      },
      { status: 500 }
    );
  }
}

async function handleApproval(expenseId: string, body: any, session: any) {
  try {
    // Check if user has permission to approve expenses
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions to approve expenses' },
        },
        { status: 403 }
      );
    }

    const validated = approveExpenseSchema.parse(body);

    // Validate rejection reason if rejecting
    if (!validated.approved && !validated.rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rejection reason is required when rejecting an expense',
          },
        },
        { status: 400 }
      );
    }

    // Approve or reject expense
    const expenseManager = new LoadExpenseManager();
    const updatedExpense = await expenseManager.approveExpense({
      expenseId,
      approverId: session.user.id,
      approved: validated.approved,
      rejectionReason: validated.rejectionReason,
    });

    return NextResponse.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error: any) {
    console.error('Error approving expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to approve expense',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Delete an expense
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const expenseId = resolvedParams.id;

    // Verify expense exists and belongs to company
    const expense = await prisma.loadExpense.findFirst({
      where: {
        id: expenseId,
        load: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Expense not found' },
        },
        { status: 404 }
      );
    }

    // Delete expense
    const expenseManager = new LoadExpenseManager();
    await expenseManager.deleteExpense(expenseId);

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete expense',
        },
      },
      { status: 500 }
    );
  }
}





