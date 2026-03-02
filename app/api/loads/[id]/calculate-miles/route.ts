import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDistanceMatrix } from '@/lib/maps/google-maps';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';

const METERS_TO_MILES = 0.000621371;

/**
 * Calculate route miles for a load using Google Maps Distance Matrix API.
 * Uses pickup/delivery locations (LoadStops or load-level fields).
 * Auto-recalculates driverPay for PER_MILE and HOURLY pay types.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: loadId } = await params;

    const load = await prisma.load.findFirst({
      where: { id: loadId, companyId: session.user.companyId, deletedAt: null },
      select: {
        id: true,
        pickupCity: true,
        pickupState: true,
        pickupZip: true,
        deliveryCity: true,
        deliveryState: true,
        deliveryZip: true,
        emptyMiles: true,
        revenue: true,
        driverId: true,
        stops: {
          select: { city: true, state: true, zip: true, stopType: true, sequence: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: 'Load not found' },
        { status: 404 }
      );
    }

    // Build origin/destination from stops or load-level fields
    const pickupStop = load.stops.find(s => s.stopType === 'PICKUP');
    const deliveryStop = load.stops.find(s => s.stopType === 'DELIVERY');

    const originCity = pickupStop?.city || load.pickupCity;
    const originState = pickupStop?.state || load.pickupState;
    const destCity = deliveryStop?.city || load.deliveryCity;
    const destState = deliveryStop?.state || load.deliveryState;

    if (!originCity || !originState || !destCity || !destState) {
      return NextResponse.json(
        { success: false, error: 'Load must have pickup and delivery locations to calculate miles' },
        { status: 400 }
      );
    }

    const result = await calculateDistanceMatrix({
      origins: [{ city: originCity, state: originState }],
      destinations: [{ city: destCity, state: destState }],
      mode: 'driving',
      units: 'imperial',
    });

    const element = result?.[0]?.[0];
    if (!element || element.status !== 'OK') {
      return NextResponse.json(
        { success: false, error: 'Could not calculate distance for this route' },
        { status: 400 }
      );
    }

    const totalMiles = Math.round(element.distance * METERS_TO_MILES * 10) / 10;
    const loadedMiles = Math.max(0, totalMiles - (load.emptyMiles || 0));
    const revenuePerMile = load.revenue && totalMiles > 0
      ? Math.round((load.revenue / totalMiles) * 100) / 100
      : undefined;

    // Auto-recalculate driver pay for PER_MILE / HOURLY drivers
    let newDriverPay: number | undefined;
    let payRecalculated = false;

    if (load.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: load.driverId },
        select: { payType: true, payRate: true },
      });

      if (driver?.payType && driver.payRate != null &&
        (driver.payType === 'PER_MILE' || driver.payType === 'HOURLY')) {
        newDriverPay = calculateDriverPay(
          { payType: driver.payType, payRate: Number(driver.payRate) },
          { totalMiles, loadedMiles, emptyMiles: load.emptyMiles, revenue: load.revenue }
        );
        payRecalculated = true;
      }
    }

    // Update load
    await prisma.load.update({
      where: { id: loadId },
      data: {
        totalMiles,
        loadedMiles,
        revenuePerMile,
        ...(payRecalculated && newDriverPay != null ? {
          driverPay: newDriverPay,
          netProfit: (load.revenue || 0) - newDriverPay,
        } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalMiles,
        loadedMiles,
        revenuePerMile,
        driverPay: payRecalculated ? newDriverPay : undefined,
        payRecalculated,
        source: 'google_maps',
      },
    });
  } catch (error) {
    console.error('Calculate miles error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to calculate miles' },
      { status: 500 }
    );
  }
}
