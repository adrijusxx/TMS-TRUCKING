import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ADDITION_TYPES = ['BONUS', 'OVERTIME', 'INCENTIVE', 'REIMBURSEMENT'] as const;

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  deductionType: z.enum([
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
  ]),
  isAddition: z.boolean().optional(), // Auto-inferred from deductionType if not provided
  driverId: z.string().cuid().optional(), // Specific driver
  driverType: z.enum(['COMPANY_DRIVER', 'OWNER_OPERATOR', 'LEASE']).optional(),
  mcNumberId: z.string().cuid().optional(), // MC number scoping
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'PER_MILE']),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  perMileRate: z.number().positive().optional(),
  frequency: z.enum(['PER_SETTLEMENT', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_TIME']),
  goalAmount: z.number().positive().optional(),
  minGrossPay: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

/**
 * Create a new deduction rule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only ADMIN and ACCOUNTANT can create rules
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createRuleSchema.parse(body);

    // Check 1000 template limit per company
    const templateCount = await prisma.deductionRule.count({
      where: { companyId: session.user.companyId },
    });

    if (templateCount >= 1000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: 'Maximum 1000 templates allowed per company. Please delete unused templates.',
          },
        },
        { status: 403 }
      );
    }

    // Validate that appropriate amount field is provided based on calculationType
    if (validated.calculationType === 'FIXED' && !validated.amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Amount must be provided for FIXED calculation type',
          },
        },
        { status: 400 }
      );
    }
    if (validated.calculationType === 'PERCENTAGE' && !validated.percentage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Percentage must be provided for PERCENTAGE calculation type',
          },
        },
        { status: 400 }
      );
    }
    if (validated.calculationType === 'PER_MILE' && !validated.perMileRate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Per mile rate must be provided for PER_MILE calculation type',
          },
        },
        { status: 400 }
      );
    }

    // Auto-infer isAddition from deductionType if not explicitly provided
    const isAddition = validated.isAddition ?? ADDITION_TYPES.includes(validated.deductionType as any);

    // Create deduction rule
    const rule = await (prisma as any).deductionRule.create({
      data: {
        companyId: session.user.companyId,
        name: validated.name,
        deductionType: validated.deductionType,
        isAddition,
        driverId: validated.driverId,
        driverType: validated.driverType,
        mcNumberId: validated.mcNumberId,
        calculationType: validated.calculationType,
        amount: validated.amount,
        percentage: validated.percentage,
        perMileRate: validated.perMileRate,
        frequency: validated.frequency,
        goalAmount: validated.goalAmount,
        minGrossPay: validated.minGrossPay,
        maxAmount: validated.maxAmount,
        isActive: validated.isActive,
        notes: validated.notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error creating deduction rule:', error);

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
          message: error.message || 'Failed to create deduction rule',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * List all deduction rules
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const driverType = searchParams.get('driverType');
    const deductionType = searchParams.get('deductionType');
    const isActive = searchParams.get('isActive');
    const mcNumberId = searchParams.get('mcNumberId');
    const isAddition = searchParams.get('isAddition');

    const where: any = {
      companyId: session.user.companyId,
    };

    // Filter by driverId — show driver-specific rules AND inherited company/driverType rules
    if (driverId) {
      where.OR = [
        { driverId },
        { driverId: null }, // Company-wide and driverType rules also apply
      ];
    }

    if (driverType) {
      where.driverType = driverType;
    }

    if (deductionType) {
      where.deductionType = deductionType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (mcNumberId) {
      where.mcNumberId = mcNumberId;
    }

    if (isAddition !== null && isAddition !== undefined) {
      where.isAddition = isAddition === 'true';
    }

    try {
      const rules = await (prisma as any).deductionRule.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          companyId: true,
          driverId: true,
          mcNumberId: true,
          name: true,
          deductionType: true,
          driverType: true,
          calculationType: true,
          amount: true,
          percentage: true,
          perMileRate: true,
          frequency: true,
          deductionFrequency: true,
          minGrossPay: true,
          maxAmount: true,
          isActive: true,
          isAddition: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          goalAmount: true,
          currentAmount: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: rules,
      });
    } catch (error: any) {
      // If driverId column doesn't exist, try query without it
      if (error.code === 'P2022' && error.meta?.column === 'DeductionRule.driverId') {
        console.warn('[Deduction Rules API] driverId column not found, querying without relation');
        // Remove driverId from where clause if it was added
        const safeWhere = { ...where };
        delete (safeWhere as any).driverId;

        const rules = await (prisma as any).deductionRule.findMany({
          where: safeWhere,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return NextResponse.json({
          success: true,
          data: rules,
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error listing deduction rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to list deduction rules',
        },
      },
      { status: 500 }
    );
  }
}

