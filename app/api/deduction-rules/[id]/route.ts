import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  deductionType: z
    .enum([
      // Deductions
      'FUEL_ADVANCE',
      'CASH_ADVANCE',
      'INSURANCE',
      'OCCUPATIONAL_ACCIDENT',
      'TRUCK_PAYMENT',
      'TRUCK_LEASE',
      'ESCROW',
      'EQUIPMENT_RENTAL',
      'MAINTENANCE',
      'TOLLS',
      'PERMITS',
      'FUEL_CARD',
      'FUEL_CARD_FEE',
      'TRAILER_RENTAL',
      'OTHER',
      // Additions (Payments to driver)
      'BONUS',
      'OVERTIME',
      'INCENTIVE',
      'REIMBURSEMENT',
    ])
    .optional(),
  driverType: z.enum(['COMPANY_DRIVER', 'OWNER_OPERATOR', 'LEASE']).optional(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'PER_MILE']).optional(),
  amount: z.number().positive().optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
  perMileRate: z.number().positive().optional().nullable(),
  frequency: z.enum(['PER_SETTLEMENT', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_TIME']).optional(),
  minGrossPay: z.number().positive().optional().nullable(),
  maxAmount: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Update a deduction rule
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

    // Only ADMIN and ACCOUNTANT can update rules
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const ruleId = resolvedParams.id;
    const body = await request.json();
    const validated = updateRuleSchema.parse(body);

    // Verify rule exists and belongs to company
    const rule = await (prisma as any).deductionRule.findFirst({
      where: {
        id: ruleId,
        companyId: session.user.companyId,
      },
    });

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deduction rule not found' },
        },
        { status: 404 }
      );
    }

    // Update rule
    const updatedRule = await (prisma as any).deductionRule.update({
      where: { id: ruleId },
      data: {
        name: validated.name,
        deductionType: validated.deductionType,
        driverType: validated.driverType,
        calculationType: validated.calculationType,
        amount: validated.amount,
        percentage: validated.percentage,
        perMileRate: validated.perMileRate,
        frequency: validated.frequency,
        minGrossPay: validated.minGrossPay,
        maxAmount: validated.maxAmount,
        isActive: validated.isActive,
        notes: validated.notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRule,
    });
  } catch (error: any) {
    console.error('Error updating deduction rule:', error);

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
          message: error.message || 'Failed to update deduction rule',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Delete a deduction rule
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

    // Only ADMIN can delete rules
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only administrators can delete deduction rules' },
        },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const ruleId = resolvedParams.id;

    // Verify rule exists and belongs to company
    const rule = await (prisma as any).deductionRule.findFirst({
      where: {
        id: ruleId,
        companyId: session.user.companyId,
      },
    });

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deduction rule not found' },
        },
        { status: 404 }
      );
    }

    // Delete rule
    await (prisma as any).deductionRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Deduction rule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting deduction rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete deduction rule',
        },
      },
      { status: 500 }
    );
  }
}

