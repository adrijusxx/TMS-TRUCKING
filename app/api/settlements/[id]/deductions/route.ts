import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DeductionType } from '@prisma/client';
import { recalculateSettlementTotals } from '@/lib/utils/settlement-recalc';
import { resolveEntityParam } from '@/lib/utils/entity-resolver';

const createDeductionSchema = z.object({
  deductionType: z.nativeEnum(DeductionType),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  quantity: z.number().int().min(1).default(1),
  fuelEntryId: z.string().optional(),
  driverAdvanceId: z.string().optional(),
  loadExpenseId: z.string().optional(),
});

const updateDeductionSchema = createDeductionSchema.partial().extend({
  id: z.string().cuid(),
});

// GET - List all deductions for a settlement
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
    const resolved = await resolveEntityParam('settlements', resolvedParams.id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }
    const settlementId = resolved.id;

    // Verify settlement belongs to company
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    // Get only actual deductions
    const deductions = await prisma.settlementDeduction.findMany({
      where: {
        settlementId,
        category: 'deduction',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: deductions,
    });
  } catch (error) {
    console.error('Deductions fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

// POST - Create a new deduction
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
    const resolved = await resolveEntityParam('settlements', resolvedParams.id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }
    const settlementId = resolved.id;

    // Verify settlement belongs to company
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = createDeductionSchema.parse(body);

    // Create deduction
    const deduction = await prisma.settlementDeduction.create({
      data: {
        settlementId,
        deductionType: validated.deductionType,
        category: 'deduction',
        description: validated.description,
        amount: validated.amount,
        quantity: validated.quantity,
        fuelEntryId: validated.fuelEntryId || null,
        driverAdvanceId: validated.driverAdvanceId || null,
        loadExpenseId: validated.loadExpenseId || null,
      },
    });

    // Recalculate settlement totals (quantity-aware)
    await recalculateSettlementTotals(settlementId);

    return NextResponse.json({
      success: true,
      data: deduction,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Deduction creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a deduction
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
    const resolved = await resolveEntityParam('settlements', resolvedParams.id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }
    const settlementId = resolved.id;

    const body = await request.json();
    const validated = updateDeductionSchema.parse(body);

    // Verify deduction belongs to settlement and settlement belongs to company
    const deduction = await prisma.settlementDeduction.findFirst({
      where: {
        id: validated.id,
        settlementId,
        settlement: {
          driver: {
            companyId: session.user.companyId,
          },
        },
      },
    });

    if (!deduction) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deduction not found' },
        },
        { status: 404 }
      );
    }

    // Update deduction
    const updated = await prisma.settlementDeduction.update({
      where: { id: validated.id },
      data: {
        ...(validated.deductionType && { deductionType: validated.deductionType }),
        ...(validated.description && { description: validated.description }),
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.quantity !== undefined && { quantity: validated.quantity }),
        ...(validated.fuelEntryId !== undefined && { fuelEntryId: validated.fuelEntryId || null }),
        ...(validated.driverAdvanceId !== undefined && { driverAdvanceId: validated.driverAdvanceId || null }),
        ...(validated.loadExpenseId !== undefined && { loadExpenseId: validated.loadExpenseId || null }),
      },
    });

    // Recalculate settlement totals (quantity-aware)
    await recalculateSettlementTotals(settlementId);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Deduction update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a deduction
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
    const resolved = await resolveEntityParam('settlements', resolvedParams.id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }
    const settlementId = resolved.id;
    const { searchParams } = new URL(request.url);
    const deductionId = searchParams.get('deductionId');

    if (!deductionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Deduction ID is required' },
        },
        { status: 400 }
      );
    }

    // Verify deduction belongs to settlement and settlement belongs to company
    const deduction = await prisma.settlementDeduction.findFirst({
      where: {
        id: deductionId,
        settlementId,
        settlement: {
          driver: {
            companyId: session.user.companyId,
          },
        },
      },
    });

    if (!deduction) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deduction not found' },
        },
        { status: 404 }
      );
    }

    // Delete deduction
    await prisma.settlementDeduction.delete({
      where: { id: deductionId },
    });

    // Recalculate settlement totals (quantity-aware)
    await recalculateSettlementTotals(settlementId);

    return NextResponse.json({
      success: true,
      message: 'Deduction deleted successfully',
    });
  } catch (error) {
    console.error('Deduction deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

