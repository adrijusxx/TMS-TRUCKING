import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { StopReorderManager } from '@/lib/managers/StopReorderManager';

/**
 * POST /api/maps/optimize-stops — optimize stop order for a route
 *
 * Body:
 *   { stops: [{ id, lat, lng, sequence, stopType?, name? }] }
 *
 * Optional query params:
 *   ?mode=matrix  — return the distance matrix instead of optimization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stops } = body;

    if (!Array.isArray(stops) || stops.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least 2 stops with id, lat, lng, and sequence are required',
          },
        },
        { status: 400 }
      );
    }

    if (stops.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Maximum 100 stops per optimization request',
          },
        },
        { status: 400 }
      );
    }

    // Validate each stop has required fields
    for (const stop of stops) {
      if (!stop.id || stop.lat == null || stop.lng == null || stop.sequence == null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Each stop must have id, lat, lng, and sequence. Invalid stop: ${stop.id || 'unknown'}`,
            },
          },
          { status: 400 }
        );
      }
    }

    const mode = request.nextUrl.searchParams.get('mode');

    // Distance matrix mode
    if (mode === 'matrix') {
      const matrixResult = StopReorderManager.getStopDistanceMatrix(stops);
      return NextResponse.json({ success: true, data: matrixResult });
    }

    // Optimization mode (default)
    const result = StopReorderManager.optimizeStopOrder(stops);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error?.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }
    console.error('[API] POST /api/maps/optimize-stops error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to optimize stops' },
      },
      { status: 500 }
    );
  }
}
