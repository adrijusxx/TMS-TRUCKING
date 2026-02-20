import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { TollCalculationService } from '@/lib/services/fuel/TollCalculationService';
import { geocodeAddress } from '@/lib/maps/google-maps';

/**
 * GET /api/mobile/fuel/tolls
 *
 * Query params:
 *   loadId (required) — load to calculate tolls for
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: session.user.id, isActive: true, deletedAt: null },
    });
    if (!driver) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_DRIVER', message: 'User is not a driver' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');

    if (!loadId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'loadId required' } },
        { status: 400 }
      );
    }

    const load = await prisma.load.findFirst({
      where: { id: loadId, driverId: driver.id, deletedAt: null },
      include: {
        stops: { orderBy: { sequence: 'asc' }, select: { lat: true, lng: true, city: true, state: true, sequence: true } },
        route: { select: { tollCost: true } },
      },
    });
    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    const tollService = new TollCalculationService();
    const stopsWithCoords = load.stops.filter((s) => s.lat != null && s.lng != null);
    let estimate = null;

    if (stopsWithCoords.length >= 2) {
      const sorted = [...stopsWithCoords].sort((a, b) => a.sequence - b.sequence);
      const origin = { lat: sorted[0].lat!, lng: sorted[0].lng! };
      const dest = { lat: sorted[sorted.length - 1].lat!, lng: sorted[sorted.length - 1].lng! };
      const waypoints = sorted.slice(1, -1).map((s) => ({ lat: s.lat!, lng: s.lng! }));
      estimate = await tollService.calculateTolls(origin, dest, waypoints);
    } else if (load.pickupCity && load.deliveryCity) {
      const [originGeo, destGeo] = await Promise.all([
        geocodeAddress(`${load.pickupCity}, ${load.pickupState}`),
        geocodeAddress(`${load.deliveryCity}, ${load.deliveryState}`),
      ]);
      if (originGeo && destGeo) {
        estimate = await tollService.calculateTolls(originGeo, destGeo);
      }
    }

    // Update route toll cost if we got a result
    if (estimate && load.route) {
      await prisma.route.update({
        where: { loadId },
        data: { tollCost: estimate.totalTollCost },
      }).catch(() => {}); // Non-critical
    }

    return NextResponse.json({
      success: true,
      data: {
        tollEstimate: estimate,
        cachedTollCost: load.route?.tollCost ?? null,
      },
    });
  } catch (error) {
    console.error('Toll calculation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
