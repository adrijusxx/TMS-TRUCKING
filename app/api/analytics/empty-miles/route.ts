import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { buildMcNumberWhereClause, buildMcNumberIdWhereClause } from '@/lib/mc-number-filter';
import { hasPermissionAsync } from '@/lib/server-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role || 'CUSTOMER';
    if (!(await hasPermissionAsync(role, 'analytics.view'))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const loadMcWhere = await buildMcNumberWhereClause(session, request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Fetch loads
    const loads: any[] = await prisma.load.findMany({
      where: {
        ...loadMcWhere,
        deletedAt: null,
        pickupDate: dateFilter,
        status: { in: ['DELIVERED', 'BILLING_HOLD', 'READY_TO_BILL', 'INVOICED', 'PAID'] }
      } as Prisma.LoadWhereInput,
      include: {
        truck: { select: { id: true, truckNumber: true } },
        driver: { select: { id: true, driverNumber: true, user: { select: { firstName: true, lastName: true } } } }
      }
    });

    let totalEmptyMiles = 0;
    let totalLoadedMiles = 0;
    let totalCost = 0; // Estimated cost of empty miles
    const AVG_COST_PER_MILE = 1.80; // Fallback or fetch from config

    const truckMap = new Map<string, any>();
    const driverMap = new Map<string, any>();
    const laneMap = new Map<string, any>();

    for (const load of loads) {
      const empty = Number(load.emptyMiles || 0);
      const loaded = Number(load.loadedMiles || 0); // Or total - empty
      // Fallback if loaded not set but total is
      const total = Number(load.totalMiles || 0);
      const actualLoaded = loaded > 0 ? loaded : Math.max(0, total - empty);

      totalEmptyMiles += empty;
      totalLoadedMiles += actualLoaded;

      // Truck Aggregation
      if (load.truck) {
        if (!truckMap.has(load.truck.id)) {
          truckMap.set(load.truck.id, {
            truckId: load.truck.id,
            truckNumber: load.truck.truckNumber,
            emptyMiles: 0,
            loadedMiles: 0,
            totalMiles: 0
          });
        }
        const t = truckMap.get(load.truck.id);
        t.emptyMiles += empty;
        t.loadedMiles += actualLoaded;
        t.totalMiles += total;
      }

      // Driver Aggregation
      if (load.driver) {
        if (!driverMap.has(load.driver.id)) {
          driverMap.set(load.driver.id, {
            driverId: load.driver.id,
            driverName: `${load.driver.user?.firstName || ''} ${load.driver.user?.lastName || ''}`.trim() || load.driver.driverNumber,
            driverNumber: load.driver.driverNumber,
            emptyMiles: 0,
            loadedMiles: 0,
            totalMiles: 0
          });
        }
        const d = driverMap.get(load.driver.id);
        d.emptyMiles += empty;
        d.loadedMiles += actualLoaded;
        d.totalMiles += total;
      }

      // Lane Aggregation (Origin State -> Dest State)
      if (load.pickupState && load.deliveryState) {
        const laneKey = `${load.pickupState} -> ${load.deliveryState}`;
        if (!laneMap.has(laneKey)) {
          laneMap.set(laneKey, {
            lane: laneKey,
            origin: load.pickupState,
            destination: load.deliveryState,
            emptyMiles: 0,
            loadedMiles: 0,
            count: 0
          });
        }
        const l = laneMap.get(laneKey);
        l.emptyMiles += empty;
        l.loadedMiles += actualLoaded;
        l.count++;
      }
    }

    totalCost = totalEmptyMiles * AVG_COST_PER_MILE;
    const emptyMilesPercentage = (totalEmptyMiles + totalLoadedMiles) > 0
      ? (totalEmptyMiles / (totalEmptyMiles + totalLoadedMiles)) * 100
      : 0;

    // Transform maps to arrays
    const byTruck = Array.from(truckMap.values()).map(t => ({
      ...t,
      emptyMilesPercentage: t.totalMiles > 0 ? (t.emptyMiles / t.totalMiles) * 100 : 0
    })).sort((a, b) => b.emptyMiles - a.emptyMiles);

    const byDriver = Array.from(driverMap.values()).map(d => ({
      ...d,
      emptyMilesPercentage: d.totalMiles > 0 ? (d.emptyMiles / d.totalMiles) * 100 : 0
    })).sort((a, b) => b.emptyMiles - a.emptyMiles);

    const byLane = Array.from(laneMap.values()).map(l => ({
      ...l,
      averageEmptyMiles: Math.round(l.emptyMiles / l.count),
      emptyPercentage: (l.emptyMiles + l.loadedMiles) > 0 ? l.emptyMiles / (l.emptyMiles + l.loadedMiles) : 0
    })).sort((a, b) => b.emptyMiles - a.emptyMiles).slice(0, 20);


    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEmptyMiles,
          totalLoadedMiles,
          emptyMilesCost: totalCost,
          emptyMilesPercentage,
          avgFuelCostPerMile: AVG_COST_PER_MILE // Example, could be dynamic
        },
        byTruck,
        byDriver,
        byLane
      }
    });

  } catch (error: any) {
    console.error('Empty miles analytics error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
