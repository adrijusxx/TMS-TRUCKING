import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { GeofenceAlertManager } from '@/lib/managers/GeofenceAlertManager';

/**
 * POST /api/geofencing/check — check a vehicle position against geofences
 *
 * Body options:
 *   { latitude, longitude }                — manual coordinate check
 *   { processAll: true }                   — batch-check all Samsara vehicles
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

    // Batch mode: process all company vehicles via Samsara
    if (body.processAll === true) {
      const events = await GeofenceAlertManager.processVehicleLocations(
        session.user.companyId
      );

      return NextResponse.json({
        success: true,
        data: {
          vehiclesChecked: events.length,
          events,
        },
      });
    }

    // Single coordinate check
    const { latitude, longitude } = body;

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'latitude and longitude are required, or set processAll: true',
          },
        },
        { status: 400 }
      );
    }

    const results = await GeofenceAlertManager.checkGeofenceEntry(
      session.user.companyId,
      Number(latitude),
      Number(longitude)
    );

    const insideGeofences = results.filter((r) => r.isInside);

    // Build status suggestions for any matching geofences
    const suggestions = insideGeofences.map((gf) => {
      const suggestion = GeofenceAlertManager.suggestStatusUpdate(
        gf.geofenceType
      );
      return {
        ...suggestion,
        geofenceName: gf.geofenceName,
        geofenceId: gf.geofenceId,
        distanceMiles: gf.distanceMiles,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        allResults: results,
        insideGeofences,
        suggestions: suggestions.filter((s) => s.suggestedStatus),
      },
    });
  } catch (error) {
    console.error('[API] POST /api/geofencing/check error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check geofences' } },
      { status: 500 }
    );
  }
}
