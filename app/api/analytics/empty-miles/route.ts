import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { hasPermission } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check analytics permission (use database-backed check)
    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const truckId = searchParams.get('truckId');
    const driverId = searchParams.get('driverId');

    // Build MC filters - Load uses mcNumberId, Truck uses mcNumberId
    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const truckFilter = await buildMcNumberIdWhereClause(session, request);

    // Get all loads in the period - include ALL loads, use pickupDate or deliveryDate
    const loads = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        OR: [
          { pickupDate: { gte: startDate, lte: endDate } },
          { deliveryDate: { gte: startDate, lte: endDate } },
          { deliveredAt: { gte: startDate, lte: endDate } },
        ],
        ...(truckId ? { truckId } : {}),
        ...(driverId ? { driverId } : {}),
      },
      select: {
        id: true,
        truckId: true,
        driverId: true,
        loadedMiles: true,
        emptyMiles: true,
        totalMiles: true,
        pickupCity: true,
        pickupState: true,
        deliveryCity: true,
        deliveryState: true,
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        route: {
          select: {
            totalDistance: true,
          },
        },
      },
      orderBy: [
        { deliveredAt: 'desc' },
        { deliveryDate: 'desc' },
        { pickupDate: 'desc' },
      ],
    });

    // Calculate empty miles
    let totalLoadedMiles = 0;
    let totalEmptyMiles = 0;
    const emptyMilesByTruck: Record<string, any> = {};
    const emptyMilesByDriver: Record<string, any> = {};
    const emptyMilesByLane: Record<string, any> = {};

    for (let i = 0; i < loads.length; i++) {
      const load = loads[i];
      // Use loadedMiles, or calculate from totalMiles and emptyMiles
      const loadedMiles = load.loadedMiles || (load.totalMiles ? load.totalMiles - (load.emptyMiles || 0) : 0) || load.route?.totalDistance || 0;
      totalLoadedMiles += loadedMiles;

      // Use stored emptyMiles if available, otherwise calculate from next load
      let emptyMiles = load.emptyMiles || 0;

      // If emptyMiles is not stored, try to calculate from next load
      if (!emptyMiles && i < loads.length - 1) {
        const nextLoad = loads[i + 1];
        // Only calculate if cities/states are available
        if (load.deliveryCity && load.deliveryState && nextLoad.pickupCity && nextLoad.pickupState) {
          emptyMiles = calculateEmptyMiles(
            load.deliveryCity,
            load.deliveryState,
            nextLoad.pickupCity,
            nextLoad.pickupState
          );
        }
      }

      totalEmptyMiles += emptyMiles;

      // Track by truck
      if (load.truckId) {
        const truckId = load.truckId;
        if (!emptyMilesByTruck[truckId]) {
          emptyMilesByTruck[truckId] = {
            truckId,
            truckNumber: load.truck?.truckNumber || 'Unknown',
            emptyMiles: 0,
            loadedMiles: 0,
            totalMiles: 0,
          };
        }
        emptyMilesByTruck[truckId].emptyMiles += emptyMiles;
        emptyMilesByTruck[truckId].loadedMiles += loadedMiles;
        emptyMilesByTruck[truckId].totalMiles += emptyMiles + loadedMiles;
      }

      // Track by driver
      if (load.driverId) {
        const driverId = load.driverId;
        if (!emptyMilesByDriver[driverId]) {
          emptyMilesByDriver[driverId] = {
            driverId,
            driverName: load.driver?.user ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : 'Unknown',
            driverNumber: load.driver?.driverNumber || 'Unknown',
            emptyMiles: 0,
            loadedMiles: 0,
            totalMiles: 0,
          };
        }
        emptyMilesByDriver[driverId].emptyMiles += emptyMiles;
        emptyMilesByDriver[driverId].loadedMiles += loadedMiles;
        emptyMilesByDriver[driverId].totalMiles += emptyMiles + loadedMiles;
      }

      // Track by lane (delivery to next pickup) - only if we have next load info
      if (i < loads.length - 1 && load.deliveryCity && load.deliveryState) {
        const nextLoad = loads[i + 1];
        if (nextLoad.pickupCity && nextLoad.pickupState) {
          const lane = `${load.deliveryCity}, ${load.deliveryState} → ${nextLoad.pickupCity}, ${nextLoad.pickupState}`;
          if (!emptyMilesByLane[lane]) {
            emptyMilesByLane[lane] = {
              lane,
              origin: `${load.deliveryCity}, ${load.deliveryState}`,
              destination: `${nextLoad.pickupCity}, ${nextLoad.pickupState}`,
              emptyMiles: 0,
              count: 0,
            };
          }
          emptyMilesByLane[lane].emptyMiles += emptyMiles;
          emptyMilesByLane[lane].count += 1;
        }
      }
    }

    const totalMiles = totalLoadedMiles + totalEmptyMiles;
    const emptyMilesPercentage = totalMiles > 0 ? (totalEmptyMiles / totalMiles) * 100 : 0;

    // Calculate cost of empty miles (using average fuel cost per mile)
    const fuelEntries = await prisma.fuelEntry.findMany({
      where: {
        truck: truckFilter,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalCost: true,
        truck: {
          select: {
            loads: {
              where: {
                OR: [
                  { pickupDate: { gte: startDate, lte: endDate } },
                  { deliveryDate: { gte: startDate, lte: endDate } },
                  { deliveredAt: { gte: startDate, lte: endDate } },
                ],
              },
              select: {
                route: {
                  select: {
                    totalDistance: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate average fuel cost per mile
    let totalFuelCost = 0;
    let totalFuelMiles = 0;
    fuelEntries.forEach((entry: any) => {
      const truckMiles = (entry.truck?.loads || []).reduce(
        (sum: number, load: any) => sum + (load.route?.totalDistance || 0),
        0
      );
      totalFuelCost += entry.totalCost;
      totalFuelMiles += truckMiles;
    });

    const avgFuelCostPerMile = totalFuelMiles > 0 ? totalFuelCost / totalFuelMiles : 0.5; // Default $0.50/mile
    const emptyMilesCost = totalEmptyMiles * avgFuelCostPerMile;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLoadedMiles: parseFloat(totalLoadedMiles.toFixed(0)),
          totalEmptyMiles: parseFloat(totalEmptyMiles.toFixed(0)),
          totalMiles: parseFloat(totalMiles.toFixed(0)),
          emptyMilesPercentage: parseFloat(emptyMilesPercentage.toFixed(2)),
          emptyMilesCost: parseFloat(emptyMilesCost.toFixed(2)),
          avgFuelCostPerMile: parseFloat(avgFuelCostPerMile.toFixed(3)),
        },
        byTruck: Object.values(emptyMilesByTruck).map((truck: any) => ({
          ...truck,
          emptyMiles: parseFloat(truck.emptyMiles.toFixed(0)),
          loadedMiles: parseFloat(truck.loadedMiles.toFixed(0)),
          totalMiles: parseFloat(truck.totalMiles.toFixed(0)),
          emptyMilesPercentage: parseFloat(
            (truck.totalMiles > 0 ? (truck.emptyMiles / truck.totalMiles) * 100 : 0).toFixed(2)
          ),
        })),
        byDriver: Object.values(emptyMilesByDriver).map((driver: any) => ({
          ...driver,
          emptyMiles: parseFloat(driver.emptyMiles.toFixed(0)),
          loadedMiles: parseFloat(driver.loadedMiles.toFixed(0)),
          totalMiles: parseFloat(driver.totalMiles.toFixed(0)),
          emptyMilesPercentage: parseFloat(
            (driver.totalMiles > 0 ? (driver.emptyMiles / driver.totalMiles) * 100 : 0).toFixed(2)
          ),
        })),
        byLane: Object.values(emptyMilesByLane)
          .map((lane: any) => ({
            ...lane,
            emptyMiles: parseFloat(lane.emptyMiles.toFixed(0)),
            averageEmptyMiles: parseFloat((lane.emptyMiles / lane.count).toFixed(0)),
          }))
          .sort((a: any, b: any) => b.emptyMiles - a.emptyMiles)
          .slice(0, 20), // Top 20 lanes
      },
      meta: {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Empty miles analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

// Simplified distance calculation (Haversine formula)
function calculateEmptyMiles(
  originCity: string,
  originState: string,
  destCity: string,
  destState: string
): number {
  // This is a placeholder - in production, use Google Maps API or similar
  // For now, return a simplified estimate based on state distance
  if (originState === destState) {
    // Same state - estimate 100-300 miles
    return 200;
  }
  // Different states - estimate 300-800 miles
  return 500;
}

