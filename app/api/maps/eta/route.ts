import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { ETACalculator } from '@/lib/managers/ETACalculator';

/**
 * POST /api/maps/eta — calculate ETA between two points
 *
 * Body:
 *   Single:  { originLat, originLng, destLat, destLng, truckSamsaraId? }
 *   Batch:   { loads: [{ id, originLat, originLng, destLat, destLng, truckSamsaraId? }] }
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

    // Batch mode
    if (Array.isArray(body.loads)) {
      if (body.loads.length > 50) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Maximum 50 loads per batch request',
            },
          },
          { status: 400 }
        );
      }

      const results = await ETACalculator.batchCalculateETAs(
        body.loads,
        session.user.companyId
      );

      // Convert Map to plain object for JSON serialization
      const data: Record<string, unknown> = {};
      results.forEach((value, key) => {
        data[key] = value;
      });

      return NextResponse.json({ success: true, data });
    }

    // Single ETA
    const { originLat, originLng, destLat, destLng, truckSamsaraId } = body;

    if (
      originLat == null ||
      originLng == null ||
      destLat == null ||
      destLng == null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'originLat, originLng, destLat, and destLng are required',
          },
        },
        { status: 400 }
      );
    }

    const eta = await ETACalculator.calculateETA(
      Number(originLat),
      Number(originLng),
      Number(destLat),
      Number(destLng),
      {
        companyId: session.user.companyId,
        truckSamsaraId,
      }
    );

    return NextResponse.json({ success: true, data: eta });
  } catch (error: any) {
    if (error?.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }
    console.error('[API] POST /api/maps/eta error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to calculate ETA' } },
      { status: 500 }
    );
  }
}
