import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { FuelSuggestionManager } from '@/lib/managers/FuelSuggestionManager';

/**
 * GET /api/mobile/fuel/stations
 *
 * Query params:
 *   ?loadId=xxx — stations along load route
 *   ?lat=x&lng=y&radius=25 — nearby stations
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
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');

    const manager = new FuelSuggestionManager();

    if (loadId) {
      // Verify driver owns this load
      const load = await prisma.load.findFirst({
        where: { id: loadId, driverId: driver.id, deletedAt: null },
        select: { id: true },
      });
      if (!load) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
          { status: 404 }
        );
      }

      const driverLat = lat ? parseFloat(lat) : undefined;
      const driverLng = lng ? parseFloat(lng) : undefined;
      const plan = await manager.getRouteFuelPlan(loadId, driverLat, driverLng);

      return NextResponse.json({
        success: true,
        data: {
          stations: plan.stations,
          averageDieselPrice: plan.averageDieselPrice,
          cheapestDieselPrice: plan.cheapestDieselPrice,
          estimatedTotalFuelCost: plan.estimatedTotalFuelCost,
          tollEstimate: plan.tollEstimate,
        },
      });
    }

    if (lat && lng) {
      const stations = await manager.getNearbyStations(
        parseFloat(lat),
        parseFloat(lng),
        radius ? parseFloat(radius) : 25
      );

      return NextResponse.json({
        success: true,
        data: { stations },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Provide loadId or lat/lng' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Fuel stations error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
