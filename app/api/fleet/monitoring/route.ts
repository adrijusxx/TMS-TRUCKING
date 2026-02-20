import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { FleetMonitoringManager } from '@/lib/managers/fleet-monitoring/FleetMonitoringManager';

/**
 * GET /api/fleet/monitoring
 * Real-time fleet monitoring snapshot: idle drivers, dormant trucks/trailers
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
    const mcNumberId = searchParams.get('mcNumberId') || undefined;

    const manager = new FleetMonitoringManager(session.user.companyId);
    const snapshot = await manager.getMonitoringSnapshot(mcNumberId);

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error: any) {
    console.error('Error fetching fleet monitoring data:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch monitoring data' } },
      { status: 500 }
    );
  }
}
