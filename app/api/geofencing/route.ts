import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import {
  GeofenceAlertManager,
  type GeofenceType,
} from '@/lib/managers/GeofenceAlertManager';

const VALID_TYPES: GeofenceType[] = [
  'PICKUP',
  'DELIVERY',
  'YARD',
  'CUSTOMER',
  'FUEL_STOP',
  'REST_AREA',
];

/**
 * GET /api/geofencing — list active geofences for the authenticated company
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

    const geofences = await GeofenceAlertManager.getActiveGeofences(
      session.user.companyId
    );

    return NextResponse.json({ success: true, data: geofences });
  } catch (error) {
    console.error('[API] GET /api/geofencing error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list geofences' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geofencing — create a new geofence
 *
 * Body: { name, latitude, longitude, radiusMiles, type, locationId?, notes? }
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
    const { name, latitude, longitude, radiusMiles, type, locationId, notes } = body;

    if (!name || latitude == null || longitude == null || !radiusMiles || !type) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'name, latitude, longitude, radiusMiles, and type are required',
          },
        },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `type must be one of: ${VALID_TYPES.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    const geofence = await GeofenceAlertManager.createGeofence({
      companyId: session.user.companyId,
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMiles: Number(radiusMiles),
      type: type as GeofenceType,
      locationId,
      notes,
    });

    return NextResponse.json({ success: true, data: geofence }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }
    console.error('[API] POST /api/geofencing error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create geofence' } },
      { status: 500 }
    );
  }
}
