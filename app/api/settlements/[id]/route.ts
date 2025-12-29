import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettlementSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'DISPUTED']).optional(),
  notes: z.string().optional(),
  paidDate: z.string().or(z.date()).optional(),
  grossPay: z.number().positive().optional(),
  periodStart: z.string().or(z.date()).optional(),
  periodEnd: z.string().or(z.date()).optional(),
});

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
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: resolvedParams.id,
        driver: {
          companyId: session.user.companyId,
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            driverNumber: true,
            driverType: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            payType: true,
            payRate: true,
            driverTariff: true,
            escrowBalance: true,
            escrowTargetAmount: true,
            escrowDeductionPerWeek: true,
          },
        },
        deductionItems: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!settlement) {
      console.error(`[Settlement GET] Settlement ${resolvedParams.id} not found for company ${session.user.companyId}`);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    if (!settlement.driver) {
      console.error(`[Settlement GET] Settlement ${resolvedParams.id} has no driver associated`);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_DATA', message: 'Settlement is missing driver information' },
        },
        { status: 500 }
      );
    }

    // Fetch loads included in settlement
    const loads = await prisma.load.findMany({
      where: {
        id: { in: settlement.loadIds },
      },
      select: {
        id: true,
        loadNumber: true,
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        revenue: true,
        driverPay: true,
        totalMiles: true,
        route: {
          select: {
            totalDistance: true,
          },
        },
        deliveredAt: true,
      },
    });

    // Fetch deduction rules that apply to this driver
    // Note: Only filter by driverType since driverId column doesn't exist in database
    const deductionRules = await prisma.deductionRule.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        OR: [
          { driverType: null }, // Company-wide rules for all driver types
          { driverType: settlement.driver.driverType }, // Rules for this driver's type
        ],
      },
      select: {
        id: true,
        name: true,
        deductionType: true,
        amount: true,
        calculationType: true,
        percentage: true,
        perMileRate: true,
        frequency: true,
        minGrossPay: true,
        maxAmount: true,
        driverType: true,
        notes: true,
        isAddition: true, // Needed to distinguish additions from deductions
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...settlement,
        loads,
        driver: {
          ...settlement.driver,
          deductionRules,
        },
      },
    });
  } catch (error) {
    console.error('Settlement fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

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
    // Verify settlement belongs to company
    const existing = await prisma.settlement.findFirst({
      where: {
        id: resolvedParams.id,
        driver: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateSettlementSchema.parse(body);

    const updateData: any = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.paidDate) {
      updateData.paidDate = validated.paidDate instanceof Date
        ? validated.paidDate
        : new Date(validated.paidDate);
    }
    if (validated.grossPay !== undefined) updateData.grossPay = validated.grossPay;
    if (validated.periodStart) {
      updateData.periodStart = validated.periodStart instanceof Date
        ? validated.periodStart
        : new Date(validated.periodStart);
    }
    if (validated.periodEnd) {
      updateData.periodEnd = validated.periodEnd instanceof Date
        ? validated.periodEnd
        : new Date(validated.periodEnd);
    }

    const settlement = await prisma.settlement.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: settlement,
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

    console.error('Settlement update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

