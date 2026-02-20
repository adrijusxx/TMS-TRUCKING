import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { FleetMonitoringManager } from '@/lib/managers/fleet-monitoring/FleetMonitoringManager';

/**
 * GET /api/fleet/monitoring/settings
 * Read fleet monitoring thresholds
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const manager = new FleetMonitoringManager(session.user.companyId);
    const settings = await manager.getSettings();

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error fetching monitoring settings:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/fleet/monitoring/settings
 * Update fleet monitoring thresholds
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dormantTruckDays, dormantTrailerDays, driverIdleAlertHours, enableAlerts } = body;

    const updates: any = {};
    if (typeof dormantTruckDays === 'number' && dormantTruckDays > 0) updates.dormantTruckDays = dormantTruckDays;
    if (typeof dormantTrailerDays === 'number' && dormantTrailerDays > 0) updates.dormantTrailerDays = dormantTrailerDays;
    if (typeof driverIdleAlertHours === 'number' && driverIdleAlertHours > 0) updates.driverIdleAlertHours = driverIdleAlertHours;
    if (typeof enableAlerts === 'boolean') updates.enableAlerts = enableAlerts;

    const manager = new FleetMonitoringManager(session.user.companyId);
    const settings = await manager.updateSettings(updates);

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error updating monitoring settings:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
