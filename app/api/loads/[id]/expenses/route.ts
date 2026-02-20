import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadExpenseManager } from '@/lib/managers/LoadExpenseManager';
import { z } from 'zod';

const expenseSchema = z.object({
  expenseType: z.enum([
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
  ]),
  amount: z.number().positive().max(10000),
  vendor: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional(),
  date: z.string().datetime().optional(),
});

/**
 * Add expense to a load
 */
export async function POST(
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
    const loadId = resolvedParams.id;
    const body = await request.json();
    const validated = expenseSchema.parse(body);

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Add expense
    const expenseManager = new LoadExpenseManager();
    const expense = await expenseManager.addExpense({
      loadId,
      expenseType: validated.expenseType,
      amount: validated.amount,
      vendorId: validated.vendor,
      description: validated.description,
      receiptUrl: validated.receiptUrl,
      date: validated.date ? new Date(validated.date) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error: any) {
    console.error('Error adding expense:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
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
          message: error.message || 'Failed to add expense',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get all expenses for a load
 */
export async function GET(
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
    const loadId = resolvedParams.id;

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Get expenses
    const expenseManager = new LoadExpenseManager();
    const [expenses, total] = await Promise.all([
      expenseManager.getLoadExpenses(loadId),
      expenseManager.calculateTotalExpenses(loadId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        loadId,
        expenses,
        totalExpenses: total,
      },
    });
  } catch (error: any) {
    console.error('Error getting expenses:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get expenses',
        },
      },
      { status: 500 }
    );
  }
}





