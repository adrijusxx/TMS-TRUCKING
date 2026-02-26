import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mobile/driver/settlements/[id]
 * Get detailed settlement breakdown for driver mobile app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;

    const settlement = await prisma.settlement.findFirst({
      where: {
        id: resolvedParams.id,
        driverId: driver.id,
      },
      include: {
        deductionItems: {
          orderBy: { createdAt: 'asc' },
        },
        driverAdvances: {
          select: { amount: true, notes: true, requestDate: true },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Settlement not found' } },
        { status: 404 }
      );
    }

    // Fetch loads by IDs stored in settlement.loadIds
    const loads = settlement.loadIds.length > 0
      ? await prisma.load.findMany({
          where: { id: { in: settlement.loadIds } },
          select: {
            loadNumber: true,
            pickupCity: true,
            pickupState: true,
            deliveryCity: true,
            deliveryState: true,
            totalMiles: true,
            driverPay: true,
          },
        })
      : [];

    // Build deductions and additions from deductionItems
    const deductions = settlement.deductionItems
      .filter((item) => item.category === 'deduction')
      .map((item) => ({
        description: item.description,
        amount: Math.abs(item.amount),
        type: 'deduction' as const,
      }));

    // Add advances as deductions
    for (const adv of settlement.driverAdvances) {
      deductions.push({
        description: adv.notes || 'Cash Advance',
        amount: adv.amount,
        type: 'deduction' as const,
      });
    }

    const additions = settlement.deductionItems
      .filter((item) => item.category === 'addition')
      .map((item) => ({
        description: item.description,
        amount: item.amount,
        type: 'addition' as const,
      }));

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        id: settlement.id,
        settlementNumber: settlement.settlementNumber,
        periodStart: settlement.periodStart,
        periodEnd: settlement.periodEnd,
        status: settlement.status,
        grossPay: settlement.grossPay,
        netPay: settlement.netPay,
        totalDeductions,
        totalAdditions,
        loads: loads.map((load) => ({
          loadNumber: load.loadNumber,
          pickup: `${load.pickupCity}, ${load.pickupState}`,
          delivery: `${load.deliveryCity}, ${load.deliveryState}`,
          miles: load.totalMiles || 0,
          driverPay: load.driverPay || 0,
        })),
        deductions,
        additions,
      },
    });
  } catch (error) {
    console.error('Mobile settlement detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
