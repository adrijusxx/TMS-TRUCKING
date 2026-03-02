import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSamsaraVehicles, getSamsaraVehicleLocations } from '@/lib/integrations/samsara';

function buildLocationResponse(loc: { latitude: number; longitude: number; speedMilesPerHour?: number; heading?: number; address?: string }) {
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    speed: loc.speedMilesPerHour,
    heading: loc.heading,
    address: loc.address || undefined,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get driver's current location from Samsara for a specific load.
 * Primary lookup: truck.samsaraId. Fallback: license plate / VIN matching.
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
    const companyId = session.user.companyId;

    const load = await prisma.load.findFirst({
      where: { id: loadId, companyId, deletedAt: null },
      include: {
        driver: { include: { user: true } },
        truck: true,
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    if (!load.driver || !load.truck) {
      return NextResponse.json({ success: true, data: null, message: 'No driver or truck assigned to this load' });
    }

    try {
      // Primary: use samsaraId directly (fast, reliable)
      if (load.truck.samsaraId) {
        const locations = await getSamsaraVehicleLocations([load.truck.samsaraId], companyId);
        const loc = locations?.[0]?.location;
        if (loc) {
          return NextResponse.json({ success: true, data: buildLocationResponse(loc) });
        }
      }

      // Fallback: match by license plate or VIN
      const samsaraVehicles = await getSamsaraVehicles(companyId);
      if (!samsaraVehicles || samsaraVehicles.length === 0) {
        return NextResponse.json({ success: true, data: null, message: 'No vehicles found in Samsara' });
      }

      const normalizePlate = (plate: string) => plate.replace(/[\s-]/g, '').toUpperCase();
      const truckPlate = load.truck.licensePlate ? normalizePlate(load.truck.licensePlate) : null;

      const matchedVehicle = samsaraVehicles.find((vehicle) => {
        if (truckPlate && vehicle.licensePlate && normalizePlate(vehicle.licensePlate) === truckPlate) return true;
        if (vehicle.vin && load.truck?.vin && vehicle.vin.toUpperCase() === load.truck.vin.toUpperCase()) return true;
        return false;
      });

      if (!matchedVehicle) {
        return NextResponse.json({ success: true, data: null, message: `Truck ${load.truck.truckNumber} not found in Samsara fleet` });
      }

      const vehicleLocations = await getSamsaraVehicleLocations([matchedVehicle.id], companyId);
      const loc = vehicleLocations?.[0]?.location;
      if (loc) {
        return NextResponse.json({ success: true, data: buildLocationResponse(loc) });
      }
    } catch (error) {
      console.error('Samsara location fetch error:', error);
    }

    return NextResponse.json({ success: true, data: null, message: 'Driver location not available from Samsara' });
  } catch (error: any) {
    console.error('Driver location error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get driver location' } },
      { status: 500 }
    );
  }
}

