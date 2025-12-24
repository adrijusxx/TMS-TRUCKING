import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mobile/driver/settlements
 * Get settlements for the authenticated driver
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    // Get recent settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        driverId: driver.id,
      },
      orderBy: {
        periodEnd: 'desc',
      },
      take: 20,
      select: {
        id: true,
        settlementNumber: true,
        periodStart: true,
        periodEnd: true,
        grossPay: true,
        netPay: true,
        status: true,
        createdAt: true,
      },
    });

    // Get last 4 weeks of earnings for graph
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentSettlements = await prisma.settlement.findMany({
      where: {
        driverId: driver.id,
        periodEnd: {
          gte: fourWeeksAgo,
        },
      },
      orderBy: {
        periodEnd: 'asc',
      },
      select: {
        periodEnd: true,
        netPay: true,
      },
    });

    // Group by week
    const weeklyEarnings = recentSettlements.reduce((acc, settlement) => {
      const weekKey = settlement.periodEnd.toISOString().split('T')[0];
      acc[weekKey] = (acc[weekKey] || 0) + Number(settlement.netPay || 0);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        settlements,
        weeklyEarnings: Object.entries(weeklyEarnings).map(([date, amount]) => ({
          date,
          amount,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching driver settlements:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch settlements',
        },
      },
      { status: 500 }
    );
  }
}



























