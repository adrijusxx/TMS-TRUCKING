import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  deductionType: z.enum([
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
  ]),
  driverType: z.enum(['COMPANY_DRIVER', 'OWNER_OPERATOR', 'LEASE']).optional(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'PER_MILE']),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  perMileRate: z.number().positive().optional(),
  frequency: z.enum(['PER_SETTLEMENT', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_TIME']),
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

    // Create deduction rule
    const rule = await prisma.deductionRule.create({
      data: {
        companyId: session.user.companyId,
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

    const where: any = {
      companyId: session.user.companyId,
    };

    if (driverId) {
      where.driverId = driverId;
    }

    if (driverType) {
      where.driverType = driverType;
    }

    if (deductionType) {
      where.deductionType = deductionType;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const rules = await prisma.deductionRule.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: rules,
    });
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

