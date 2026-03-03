import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriverSafetyEventManager } from '@/lib/managers/DriverSafetyEventManager';

interface RouteParams {
  params: Promise<{ driverId: string }>;
}

/**
 * GET /api/fleet/drivers/[driverId]/safety-events
 *
 * Returns Samsara safety events for a specific driver.
 *
 * Query params:
 * - days (optional): number of days to look back (default: 30)
 * - mode (optional): "summary" for grouped summary, "breakdown" for breakdown context, default returns raw events
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { driverId } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const days = parseInt(searchParams.get('days') || '30');

    // Summary mode: grouped by type and severity with risk level
    if (mode === 'summary') {
      const summary = await DriverSafetyEventManager.getSafetyEventSummary(driverId, days);
      return NextResponse.json({ success: true, data: summary });
    }

    // Breakdown context mode: recent events with quick summary for case creation
    if (mode === 'breakdown') {
      const context = await DriverSafetyEventManager.getEventsForBreakdownContext(driverId);
      return NextResponse.json({ success: true, data: context });
    }

    // Default: return recent events
    const events = await DriverSafetyEventManager.getRecentSafetyEvents(driverId, days);
    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Error fetching safety events:', error);

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
          message: error.message || 'Failed to fetch safety events',
        },
      },
      { status: 500 }
    );
  }
}
