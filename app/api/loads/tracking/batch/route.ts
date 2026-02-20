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

const MAX_BATCH_SIZE = 50;

interface TrackingResult {
  loadId: string;
  truckNumber: string | null;
  truckLocation: {
    lat: number; lng: number; speed: number;
    heading: number | null; address: string | null; lastUpdated: string;
  } | null;
  nextStop: {
    stopType: string; city: string; state: string;
    scheduledArrival: string | null;
  } | null;
  eta: {
    etaFormatted: string; remainingMiles: number; remainingMinutes: number;
    status: string; statusReason: string | null;
  } | null;
  proximityStatus: 'AT_STOP' | 'APPROACHING' | 'EN_ROUTE' | 'NO_DATA';
  proximityMiles: number | null;
}

/**
 * GET /api/loads/tracking/batch?ids=id1,id2,...
 * Returns tracking data for multiple loads in a single batched Samsara call.
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

    const idsParam = request.nextUrl.searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'ids parameter required' } },
        { status: 400 }
      );
    }

    const loadIds = idsParam.split(',').slice(0, MAX_BATCH_SIZE);

    // Single DB query for all loads with their trucks and stops
    const loads = await prisma.load.findMany({
      where: {
        id: { in: loadIds },
        companyId: session.user.companyId,
        status: { in: [...ACTIVE_STATUSES] },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        truck: { select: { samsaraId: true, truckNumber: true } },
        stops: {
          orderBy: { sequence: 'asc' },
          select: {
            stopType: true, status: true, city: true, state: true,
            address: true, zip: true, lat: true, lng: true, earliestArrival: true,
          },
        },
      },
    });

    // Collect unique Samsara IDs for one batched API call
    const samsaraIdMap = new Map<string, typeof loads[0][]>();
    for (const load of loads) {
      const sid = load.truck?.samsaraId;
      if (sid) {
        const existing = samsaraIdMap.get(sid) || [];
        existing.push(load);
        samsaraIdMap.set(sid, existing);
      }
    }

    // Single batched Samsara call
    const samsaraIds = [...samsaraIdMap.keys()];
    const locationMap = new Map<string, any>();

    if (samsaraIds.length > 0) {
      const locations = await getSamsaraVehicleLocations(samsaraIds, session.user.companyId);
      if (locations) {
        for (const loc of locations) {
          locationMap.set(loc.vehicleId, loc.location);
        }
      }
    }

    // Build results for each requested load
    const results: Record<string, TrackingResult> = {};

    for (const loadId of loadIds) {
      const load = loads.find((l) => l.id === loadId);
      if (!load) {
        results[loadId] = makeNoData(loadId, null);
        continue;
      }

      const sid = load.truck?.samsaraId;
      const vehicleLoc = sid ? locationMap.get(sid) : null;

      if (!vehicleLoc) {
        results[loadId] = makeNoData(loadId, load.truck?.truckNumber || null);
        continue;
      }

      const nextStop = load.stops.find(
        (s) => s.status !== 'COMPLETED' && s.status !== 'SKIPPED' && s.status !== 'CANCELLED'
      );

      let stopLat = nextStop?.lat ?? null;
      let stopLng = nextStop?.lng ?? null;

      if (nextStop && stopLat == null) {
        const addr = [nextStop.address, nextStop.city, nextStop.state, nextStop.zip].filter(Boolean).join(', ');
        const geo = await geocodeAddress(addr);
        if (geo) { stopLat = geo.lat; stopLng = geo.lng; }
      }

      let eta = null;
      let proximityMiles: number | null = null;
      let proximityStatus: TrackingResult['proximityStatus'] = 'EN_ROUTE';

      if (stopLat != null && stopLng != null) {
        proximityMiles = Math.round(
          haversineDistanceMiles(vehicleLoc.latitude, vehicleLoc.longitude, stopLat, stopLng) * 10
        ) / 10;

        if (proximityMiles < 0.5) proximityStatus = 'AT_STOP';
        else if (proximityMiles < 5) proximityStatus = 'APPROACHING';

        const etaResult = calculateETA({
          currentLat: vehicleLoc.latitude, currentLng: vehicleLoc.longitude,
          destinationLat: stopLat, destinationLng: stopLng,
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

      results[loadId] = {
        loadId,
        truckNumber: load.truck?.truckNumber || null,
        truckLocation: {
          lat: vehicleLoc.latitude, lng: vehicleLoc.longitude,
          speed: vehicleLoc.speedMilesPerHour ?? 0,
          heading: vehicleLoc.heading ?? null,
          address: vehicleLoc.address ?? null,
          lastUpdated: new Date().toISOString(),
        },
        nextStop: nextStop ? {
          stopType: nextStop.stopType, city: nextStop.city, state: nextStop.state,
          scheduledArrival: nextStop.earliestArrival?.toISOString() ?? null,
        } : null,
        eta,
        proximityStatus,
        proximityMiles,
      };
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('[Batch Tracking] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get tracking data' } },
      { status: 500 }
    );
  }
}

function makeNoData(loadId: string, truckNumber: string | null): TrackingResult {
  return { loadId, truckNumber, truckLocation: null, eta: null, nextStop: null, proximityStatus: 'NO_DATA', proximityMiles: null };
}
