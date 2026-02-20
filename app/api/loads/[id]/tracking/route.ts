import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';
import { calculateETA } from '@/lib/maps/eta-calculator';
import { geocodeAddress } from '@/lib/maps/google-maps';
import { haversineDistanceMiles } from '@/lib/utils/geo';

const ACTIVE_STATUSES = [
  'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY',
] as const;

/**
 * GET /api/loads/[id]/tracking
 * Returns live tracking data: truck GPS, speed, ETA, and proximity to next stop.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id: loadId } = await params;

    const load = await prisma.load.findFirst({
      where: { id: loadId, companyId: session.user.companyId, deletedAt: null },
      select: {
        id: true,
        status: true,
        truck: { select: { samsaraId: true, truckNumber: true } },
        stops: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true, stopType: true, sequence: true, status: true,
            city: true, state: true, address: true, zip: true,
            lat: true, lng: true, earliestArrival: true,
          },
        },
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // Only track loads in active statuses
    if (!ACTIVE_STATUSES.includes(load.status as any)) {
      return NextResponse.json({
        success: true,
        data: { loadId, proximityStatus: 'NO_DATA', truckLocation: null, eta: null, nextStop: null, proximityMiles: null, truckNumber: load.truck?.truckNumber || null },
      });
    }

    const samsaraId = load.truck?.samsaraId;
    if (!samsaraId) {
      return NextResponse.json({
        success: true,
        data: { loadId, proximityStatus: 'NO_DATA', truckLocation: null, eta: null, nextStop: null, proximityMiles: null, truckNumber: load.truck?.truckNumber || null },
      });
    }

    // Fetch live GPS from Samsara
    const locations = await getSamsaraVehicleLocations([samsaraId], session.user.companyId);
    const vehicleLoc = locations?.[0]?.location;

    if (!vehicleLoc) {
      return NextResponse.json({
        success: true,
        data: { loadId, proximityStatus: 'NO_DATA', truckLocation: null, eta: null, nextStop: null, proximityMiles: null, truckNumber: load.truck?.truckNumber || null },
      });
    }

    // Determine the next incomplete stop
    const nextStop = load.stops.find((s) => s.status !== 'COMPLETED' && s.status !== 'SKIPPED' && s.status !== 'CANCELLED');

    // Resolve stop coordinates
    let stopLat: number | null = nextStop?.lat ?? null;
    let stopLng: number | null = nextStop?.lng ?? null;

    if (nextStop && stopLat == null && stopLng == null) {
      const addr = [nextStop.address, nextStop.city, nextStop.state, nextStop.zip].filter(Boolean).join(', ');
      const geo = await geocodeAddress(addr);
      if (geo) { stopLat = geo.lat; stopLng = geo.lng; }
    }

    // Calculate ETA and proximity
    let eta = null;
    let proximityMiles: number | null = null;
    let proximityStatus: 'AT_STOP' | 'APPROACHING' | 'EN_ROUTE' | 'NO_DATA' = 'EN_ROUTE';

    if (stopLat != null && stopLng != null) {
      proximityMiles = Math.round(
        haversineDistanceMiles(vehicleLoc.latitude, vehicleLoc.longitude, stopLat, stopLng) * 10
      ) / 10;

      if (proximityMiles < 0.5) proximityStatus = 'AT_STOP';
      else if (proximityMiles < 5) proximityStatus = 'APPROACHING';

      const etaResult = calculateETA({
        currentLat: vehicleLoc.latitude,
        currentLng: vehicleLoc.longitude,
        destinationLat: stopLat,
        destinationLng: stopLng,
        currentSpeed: vehicleLoc.speedMilesPerHour ?? 0,
        scheduledArrival: nextStop?.earliestArrival ?? undefined,
      });

      if (etaResult) {
        eta = {
          etaFormatted: etaResult.etaFormatted,
          remainingMiles: etaResult.remainingMiles,
          remainingMinutes: etaResult.remainingMinutes,
          status: etaResult.status,
          statusReason: etaResult.statusReason ?? null,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        loadId,
        truckNumber: load.truck?.truckNumber || null,
        truckLocation: {
          lat: vehicleLoc.latitude,
          lng: vehicleLoc.longitude,
          speed: vehicleLoc.speedMilesPerHour ?? 0,
          heading: vehicleLoc.heading ?? null,
          address: vehicleLoc.address ?? null,
          lastUpdated: new Date().toISOString(),
        },
        nextStop: nextStop ? {
          stopType: nextStop.stopType,
          city: nextStop.city,
          state: nextStop.state,
          scheduledArrival: nextStop.earliestArrival?.toISOString() ?? null,
        } : null,
        eta,
        proximityStatus,
        proximityMiles,
      },
    });
  } catch (error: any) {
    console.error('[Load Tracking] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get tracking data' } },
      { status: 500 }
    );
  }
}
