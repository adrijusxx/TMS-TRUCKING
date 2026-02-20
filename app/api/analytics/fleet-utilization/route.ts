import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { FleetMonitoringManager } from '@/lib/managers/fleet-monitoring/FleetMonitoringManager';

/**
 * GET /api/analytics/fleet-utilization
 * Historical fleet utilization rates by day or week
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
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly';
    const rangeDays = parseInt(searchParams.get('range') || '30', 10);
    const mcNumberId = searchParams.get('mcNumberId') || undefined;

    const clampedRange = Math.min(Math.max(rangeDays, 7), 90);

    const manager = new FleetMonitoringManager(session.user.companyId);
    const data = await manager.getUtilizationHistory(period, clampedRange, mcNumberId);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching fleet utilization:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
