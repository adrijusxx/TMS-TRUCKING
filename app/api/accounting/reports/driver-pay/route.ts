import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/accounting/reports/driver-pay?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns per-driver pay summary for the given period.
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

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Get settlements in the period
    const settlements = await prisma.settlement.findMany({
      where: {
        driver: { companyId },
        ...(Object.keys(dateFilter).length > 0 ? { periodEnd: dateFilter } : {}),
      },
      include: {
        driver: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Aggregate by driver
    const driverMap = new Map<string, {
      driverId: string;
      driverName: string;
      loadCount: number;
      grossPay: number;
      deductions: number;
      additions: number;
      netPay: number;
    }>();

    for (const s of settlements) {
      const driverName = s.driver.user
        ? `${s.driver.user.firstName} ${s.driver.user.lastName}`
        : `Driver ${s.driver.driverNumber}`;

      const existing = driverMap.get(s.driverId) || {
        driverId: s.driverId,
        driverName,
        loadCount: 0,
        grossPay: 0,
        deductions: 0,
        additions: 0,
        netPay: 0,
      };

      const loadIds = Array.isArray(s.loadIds) ? s.loadIds : [];
      existing.loadCount += loadIds.length;
      existing.grossPay += s.grossPay || 0;
      existing.deductions += s.deductions || 0;
      existing.additions += s.advances || 0;
      existing.netPay += s.netPay || 0;

      driverMap.set(s.driverId, existing);
    }

    const data = Array.from(driverMap.values()).sort((a, b) => b.netPay - a.netPay);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Driver pay report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } },
      { status: 500 }
    );
  }
}
