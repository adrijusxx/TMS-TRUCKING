import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { recalculateSettlementTotals } from '@/lib/utils/settlement-recalc';
import { resolveEntityParam } from '@/lib/utils/entity-resolver';

const updateSettlementSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'DISPUTED']).optional(),
  notes: z.string().optional(),
  paidDate: z.string().or(z.date()).optional(),
  grossPay: z.number().positive().optional(),
  periodStart: z.string().or(z.date()).optional(),
  periodEnd: z.string().or(z.date()).optional(),
  addLoadIds: z.array(z.string()).optional(),
  removeLoadIds: z.array(z.string()).optional(),
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
    const resolved = await resolveEntityParam('settlements', resolvedParams.id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    const where: any = {
      id: resolved.id,
    };

    // Only enforce company isolation for non-super admins
    if (!isSuperAdmin) {
      where.driver = {
        companyId: session.user.companyId,
      };
    }

    const settlement = await prisma.settlement.findFirst({
      where,
      include: {
        driver: {
          select: {
            id: true,
            driverNumber: true,
            driverType: true,
            // Also select companyId for Super Admin context awareness
            companyId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            payType: true,
            payRate: true,
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
      console.error(`[Settlement GET] Settlement ${resolved.id} not found for company ${session.user.companyId}`);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    if (!settlement.driver) {
      console.error(`[Settlement GET] Settlement ${resolved.id} has no driver associated`);
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
        tripId: true,
        status: true,
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        revenue: true,
        driverPay: true,
        totalExpenses: true,
        totalMiles: true,
        loadedMiles: true,
        emptyMiles: true,
        revenuePerMile: true,
        route: {
          select: {
            totalDistance: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        pickupDate: true,
        deliveryDate: true,
        deliveredAt: true,
      },
    });

    // Fetch deduction rules that apply to this driver
    // Note: Only filter by driverType since driverId column doesn't exist in database
    const deductionRules = await prisma.deductionRule.findMany({
      where: {
        companyId: settlement.driver.companyId,
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
        isAddition: true,
        goalAmount: true,
        currentAmount: true, // Needed to distinguish additions from deductions
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
    const resolved = await resolveEntityParam('settlements', resolvedParams.id);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }
    // Verify settlement belongs to company
    const existing = await prisma.settlement.findFirst({
      where: {
        id: resolved.id,
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

    // Handle load additions/removals
    if (validated.addLoadIds?.length || validated.removeLoadIds?.length) {
      let currentLoadIds = [...existing.loadIds];

      if (validated.removeLoadIds?.length) {
        const removeSet = new Set(validated.removeLoadIds);
        currentLoadIds = currentLoadIds.filter(id => !removeSet.has(id));
      }

      if (validated.addLoadIds?.length) {
        // Verify loads belong to same driver and company
        const loads = await prisma.load.findMany({
          where: {
            id: { in: validated.addLoadIds },
            driverId: existing.driverId,
            deletedAt: null,
          },
          select: { id: true, driverPay: true },
        });
        const validIds = loads.map(l => l.id);
        const existingSet = new Set(currentLoadIds);
        for (const id of validIds) {
          if (!existingSet.has(id)) currentLoadIds.push(id);
        }
      }

      updateData.loadIds = currentLoadIds;

      // Recalculate grossPay from loads
      if (currentLoadIds.length > 0) {
        const loads = await prisma.load.findMany({
          where: { id: { in: currentLoadIds } },
          select: { driverPay: true },
        });
        updateData.grossPay = loads.reduce((sum, l) => sum + (l.driverPay || 0), 0);
      } else {
        updateData.grossPay = 0;
      }
    }

    let settlement = await prisma.settlement.update({
      where: { id: resolved.id },
      data: updateData,
    });

    // Recalculate totals when grossPay or loads change
    if (validated.grossPay !== undefined || validated.addLoadIds?.length || validated.removeLoadIds?.length) {
      await recalculateSettlementTotals(resolved.id);
      settlement = await prisma.settlement.findUniqueOrThrow({
        where: { id: resolved.id },
      });
    }

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

