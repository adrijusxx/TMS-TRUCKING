import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BreakdownHotspotManager } from '@/lib/managers/BreakdownHotspotManager';

/**
 * GET /api/fleet/breakdowns/hotspots
 *
 * Comprehensive breakdown hotspot analysis.
 * Returns breakdowns grouped by location, time of day, equipment type, and driver.
 *
 * Query params:
 * - startDate (optional): start of date range (default: 180 days ago)
 * - endDate (optional): end of date range (default: now)
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
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const analysis = await BreakdownHotspotManager.analyzeHotspots(
      session.user.companyId,
      { startDate, endDate }
    );

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Error fetching breakdown hotspots:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch breakdown hotspots',
        },
      },
      { status: 500 }
    );
  }
}
