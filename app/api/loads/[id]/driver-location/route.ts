import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getSamsaraVehicles, getSamsaraVehicleLocations } from '@/lib/integrations/samsara';

/**
 * Get driver's current location from Samsara for a specific load
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

    // Get load with driver and truck
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
        truck: true,
      },
    });

    if (!load) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
        { status: 404 }
      );
    }

    // If no driver assigned, return null
    if (!load.driver || !load.truck) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No driver or truck assigned to this load',
      });
    }

    // Try to get vehicle location from Samsara
    // Match truck with Samsara vehicle by license plate or VIN
    try {
      // First, get all Samsara vehicles to find a match
      const samsaraVehicles = await getSamsaraVehicles();
      
      if (!samsaraVehicles || samsaraVehicles.length === 0) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No vehicles found in Samsara',
        });
      }

      // Try to match truck with Samsara vehicle
      // Match by license plate (case-insensitive, remove spaces/dashes)
      const normalizePlate = (plate: string) => plate.replace(/[\s-]/g, '').toUpperCase();
      
      if (!load.truck) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_TRUCK', message: 'Load has no assigned truck' } },
          { status: 400 }
        );
      }

      const truckPlateNormalized = normalizePlate(load.truck.licensePlate);
      
      const matchedVehicle = samsaraVehicles.find((vehicle) => {
        // Match by license plate
        if (vehicle.licensePlate) {
          const vehiclePlateNormalized = normalizePlate(vehicle.licensePlate);
          if (vehiclePlateNormalized === truckPlateNormalized) {
            return true;
          }
        }
        
        // Match by VIN (if available)
        if (vehicle.vin && load.truck?.vin) {
          if (vehicle.vin.toUpperCase() === load.truck.vin.toUpperCase()) {
            return true;
          }
        }
        
        return false;
      });

      if (!matchedVehicle) {
        return NextResponse.json({
          success: true,
          data: null,
          message: `Truck ${load.truck.truckNumber} not found in Samsara fleet`,
        });
      }

      // Get location for the matched vehicle
      const vehicleLocations = await getSamsaraVehicleLocations([matchedVehicle.id]);
      
      if (vehicleLocations && vehicleLocations.length > 0) {
        const vehicleLocation = vehicleLocations[0];
        
        if (vehicleLocation && vehicleLocation.location) {
          return NextResponse.json({
            success: true,
            data: {
              latitude: vehicleLocation.location.latitude,
              longitude: vehicleLocation.location.longitude,
              speed: vehicleLocation.location.speedMilesPerHour,
              heading: vehicleLocation.location.heading,
              address: vehicleLocation.location.address || undefined,
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error('Samsara location fetch error:', error);
      // Don't fail the request, just return null
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Driver location not available from Samsara',
    });
  } catch (error: any) {
    console.error('Driver location error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get driver location' },
      },
      { status: 500 }
    );
  }
}

