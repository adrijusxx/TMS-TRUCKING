import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';

/**
 * GET /api/fleet/vehicle-location?samsaraId=xxx
 * Fetches a vehicle's current GPS location from Samsara.
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

    const samsaraId = request.nextUrl.searchParams.get('samsaraId');
    if (!samsaraId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'samsaraId is required' } },
        { status: 400 }
      );
    }

    const locations = await getSamsaraVehicleLocations([samsaraId], session.user.companyId);
    const loc = locations?.[0]?.location;

    if (!loc) {
      return NextResponse.json({ success: true, data: { location: null } });
    }

    return NextResponse.json({
      success: true,
      data: {
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || undefined,
          formattedAddress: loc.address || undefined,
          speedMilesPerHour: loc.speedMilesPerHour,
          heading: loc.heading,
          time: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Vehicle location error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get vehicle location' } },
      { status: 500 }
    );
  }
}
