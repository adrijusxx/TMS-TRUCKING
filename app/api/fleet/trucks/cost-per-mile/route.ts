import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TruckCostManager } from '@/lib/managers/TruckCostManager';

/**
 * GET /api/fleet/trucks/cost-per-mile
 *
 * Returns cost-per-mile data for trucks.
 *
 * Query params:
 * - truckId (optional): get cost for a specific truck
 * - startDate (optional): start of date range (default: 90 days ago)
 * - endDate (optional): end of date range (default: now)
 *
 * Without truckId, returns fleet-wide cost comparison.
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
    const truckId = searchParams.get('truckId');

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: 90 days
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const dateRange = { startDate, endDate };

    // Single truck cost per mile
    if (truckId) {
      const result = await TruckCostManager.getCostPerMile(truckId, dateRange);
      return NextResponse.json({ success: true, data: result });
    }

    // Fleet-wide comparison
    const result = await TruckCostManager.getCostPerMileFleet(
      session.user.companyId,
      dateRange
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error calculating cost per mile:', error);

    if (error?.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to calculate cost per mile',
        },
      },
      { status: 500 }
    );
  }
}
