import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { findLoadsReadyForSettlement } from '@/lib/automation/load-status';

/**
 * Get loads that are ready for settlement for a driver
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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    if (!driverId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_DRIVER_ID', message: 'driverId is required' },
        },
        { status: 400 }
      );
    }

    const loads = await findLoadsReadyForSettlement(
      session.user.companyId,
      driverId,
      startDate,
      endDate
    );

    const totalRevenue = loads.reduce((sum, load) => sum + load.revenue, 0);

    return NextResponse.json({
      success: true,
      data: {
        driverId,
        totalLoads: loads.length,
        totalRevenue,
        loads: loads.map((load) => ({
          id: load.id,
          loadNumber: load.loadNumber,
          revenue: load.revenue,
          deliveredAt: load.deliveredAt,
        })),
      },
    });
  } catch (error) {
    console.error('Settlement ready check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

