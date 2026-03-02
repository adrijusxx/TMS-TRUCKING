/**
 * IFTA Calculator Service
 *
 * Calculates International Fuel Tax Agreement (IFTA) mileage and tax
 * using accurate route data from Google Maps Directions API.
 *
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 4
 */

import { prisma } from '@/lib/prisma';
import { routingService, RouteWaypoint } from './RoutingService';
import {
  IFTA_TAX_RATES,
  getStateName,
  type IFTALoadData,
  type IFTACalculationResult,
  type IFTAStateBreakdownItem,
  type IFTAQuarterReport,
  type IFTATruckBreakdownEntry,
  type IFTAByTruckReport,
  type IFTADriverBreakdownEntry,
  type IFTAByDriverReport,
} from '@/lib/utils/ifta-constants';

// Re-export types for consumers that import from this file
export type {
  IFTALoadData,
  IFTACalculationResult,
  IFTAStateBreakdownItem,
  IFTAQuarterReport,
  IFTATruckBreakdownEntry,
  IFTAByTruckReport,
  IFTADriverBreakdownEntry,
  IFTAByDriverReport,
} from '@/lib/utils/ifta-constants';
export { IFTA_TAX_RATES } from '@/lib/utils/ifta-constants';

/** Build the shared period load query for a quarter */
function buildQuarterQuery(
  companyId: string, quarter: number, year: number, mcNumberId?: string | string[]
) {
  const monthMap: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9 };
  const periodStart = new Date(year, monthMap[quarter], 1);
  const periodEnd = new Date(year, monthMap[quarter] + 3, 0);
  const loadWhere: Record<string, unknown> = {
    companyId, deletedAt: null, driverId: { not: null },
    OR: [
      { deliveredAt: { gte: periodStart, lte: periodEnd } },
      { deliveryDate: { gte: periodStart, lte: periodEnd } },
    ],
  };
  if (mcNumberId) {
    loadWhere.mcNumberId = Array.isArray(mcNumberId) ? { in: mcNumberId } : mcNumberId;
  }
  return { periodStart, periodEnd, loadWhere };
}

export class IFTACalculatorService {
  /**
   * Calculate IFTA for a single load using routing service
   */
  async calculateForLoad(load: IFTALoadData): Promise<IFTACalculationResult> {
    const waypoints: RouteWaypoint[] = [];
    waypoints.push({ city: load.pickupCity, state: load.pickupState, zipCode: load.pickupZip });

    if (load.stops && load.stops.length > 0) {
      const sortedStops = [...load.stops].sort((a, b) => a.sequence - b.sequence);
      for (const stop of sortedStops) {
        waypoints.push({ city: stop.city, state: stop.state, zipCode: stop.zipCode });
      }
    }

    waypoints.push({ city: load.deliveryCity, state: load.deliveryState, zipCode: load.deliveryZip });

    // Same-state optimization: skip Google Maps API if all waypoints are in the same state
    const uniqueStates = [...new Set(waypoints.map((w) => w.state).filter(Boolean))];
    if (uniqueStates.length === 1 && uniqueStates[0]) {
      const singleState = uniqueStates[0];
      const estimatedMiles = await routingService.estimateDistance(waypoints);
      const taxRate = IFTA_TAX_RATES[singleState] || 0;
      const tax = Math.round((estimatedMiles / 6) * taxRate * 100) / 100;
      return {
        loadId: load.loadId, totalMiles: estimatedMiles,
        stateMileages: [{ state: singleState, stateName: getStateName(singleState), miles: estimatedMiles, kilometers: Math.round(estimatedMiles * 1.60934 * 100) / 100, taxRate, tax }],
        totalTax: tax, routePolyline: null, calculatedAt: new Date(),
      };
    }

    // Multi-state route: use Google Maps for accurate state-by-state mileage
    const route = await routingService.calculateRouteWithStateMileage(waypoints);
    const stateMileagesWithTax = route.stateMileages.map((sm) => {
      const taxRate = IFTA_TAX_RATES[sm.state] || 0;
      return { ...sm, taxRate, tax: Math.round((sm.miles / 6) * taxRate * 100) / 100 };
    });
    const totalTax = stateMileagesWithTax.reduce((sum, sm) => sum + sm.tax, 0);

    return {
      loadId: load.loadId, totalMiles: route.totalMiles, stateMileages: stateMileagesWithTax,
      totalTax: Math.round(totalTax * 100) / 100, routePolyline: route.polyline, calculatedAt: new Date(),
    };
  }

  /**
   * Calculate and store IFTA entry for a load in database.
   * Skips recalculation if a valid entry already exists (saves Directions API cost).
   */
  async calculateAndStoreForLoad(loadId: string, companyId: string, quarter: number, year: number, forceRecalculate = false): Promise<string> {
    // Idempotency guard: skip if already calculated (avoids expensive Directions API call)
    if (!forceRecalculate) {
      const existing = await prisma.iFTAEntry.findUnique({
        where: { loadId },
        include: { stateMileages: true },
      });
      if (existing?.isCalculated && existing.stateMileages.length > 0) {
        return existing.id;
      }
    }

    const load = await prisma.load.findUnique({
      where: { id: loadId }, include: { stops: { orderBy: { sequence: 'asc' } } },
    });
    if (!load) throw new Error(`Load ${loadId} not found`);
    if (!load.driverId) throw new Error(`Load ${loadId} has no driver assigned`);

    const loadData: IFTALoadData = {
      loadId: load.id, loadNumber: load.loadNumber,
      pickupCity: load.pickupCity || '', pickupState: load.pickupState || '', pickupZip: load.pickupZip || undefined,
      deliveryCity: load.deliveryCity || '', deliveryState: load.deliveryState || '', deliveryZip: load.deliveryZip || undefined,
      stops: load.stops.map((s) => ({ city: s.city, state: s.state, zipCode: s.zip || undefined, sequence: s.sequence })),
      driverId: load.driverId, truckId: load.truckId || undefined, deliveredAt: load.deliveredAt || undefined,
    };

    const calculation = await this.calculateForLoad(loadData);
    const existing = await prisma.iFTAEntry.findUnique({ where: { loadId } });

    const iftaData = {
      companyId, loadId, driverId: load.driverId, truckId: load.truckId,
      periodType: 'QUARTER' as const, periodYear: year, periodQuarter: quarter,
      totalMiles: calculation.totalMiles, totalTax: calculation.totalTax,
      totalDeduction: 0, isCalculated: true, calculatedAt: new Date(),
    };

    let entryId: string;
    if (existing) {
      await prisma.iFTAEntry.update({ where: { id: existing.id }, data: iftaData });
      entryId = existing.id;
      await prisma.iFTAStateMileage.deleteMany({ where: { iftaEntryId: existing.id } });
    } else {
      const entry = await prisma.iFTAEntry.create({ data: iftaData });
      entryId = entry.id;
    }

    await prisma.iFTAStateMileage.createMany({
      data: calculation.stateMileages.map((sm) => ({
        iftaEntryId: entryId, state: sm.state, miles: sm.miles, taxRate: sm.taxRate, tax: sm.tax, deduction: 0,
      })),
    });
    return entryId;
  }

  /** Generate quarterly IFTA report (fleet-wide) */
  async generateQuarterlyReport(companyId: string, quarter: number, year: number, mcNumberId?: string | string[]): Promise<IFTAQuarterReport> {
    const { periodStart, periodEnd, loadWhere } = buildQuarterQuery(companyId, quarter, year, mcNumberId);
    const loads = await prisma.load.findMany({ where: loadWhere, select: { id: true } });

    const entries = await prisma.iFTAEntry.findMany({
      where: { loadId: { in: loads.map((l) => l.id) }, isCalculated: true },
      include: { stateMileages: true },
    });

    const stateAgg: Record<string, { miles: number; tax: number }> = {};
    let totalMiles = 0;
    for (const entry of entries) {
      totalMiles += entry.totalMiles;
      for (const sm of entry.stateMileages) {
        if (!stateAgg[sm.state]) stateAgg[sm.state] = { miles: 0, tax: 0 };
        stateAgg[sm.state].miles += sm.miles;
        stateAgg[sm.state].tax += sm.tax;
      }
    }

    const fuelByState = await prisma.fuelEntry.groupBy({
      by: ['state'],
      where: { truck: { companyId }, date: { gte: periodStart, lte: periodEnd }, state: { not: null } },
      _sum: { gallons: true, totalCost: true },
    });

    const fuelMap = new Map<string, { gallons: number; cost: number }>();
    let totalGallons = 0;
    fuelByState.forEach((e) => {
      if (e.state) { const g = e._sum.gallons || 0; fuelMap.set(e.state, { gallons: g, cost: e._sum.totalCost || 0 }); totalGallons += g; }
    });

    const mpg = totalGallons > 0 ? totalMiles / totalGallons : 6;
    const stateBreakdown = Object.entries(stateAgg).map(([state, data]) => {
      const taxRate = IFTA_TAX_RATES[state] || 0;
      const taxDue = (data.miles / mpg) * taxRate;
      const gallonsPurchased = fuelMap.get(state)?.gallons || 0;
      const taxPaid = Math.round(gallonsPurchased * taxRate * 100) / 100;
      return {
        state, stateName: getStateName(state),
        miles: Math.round(data.miles * 10) / 10, taxableMiles: Math.round(data.miles * 10) / 10,
        taxRate, taxDue: Math.round(taxDue * 100) / 100, taxPaid, netTax: Math.round((taxDue - taxPaid) * 100) / 100,
      };
    }).sort((a, b) => a.stateName.localeCompare(b.stateName));

    const totalTaxDue = stateBreakdown.reduce((s, r) => s + r.taxDue, 0);
    const totalTaxPaid = stateBreakdown.reduce((s, r) => s + r.taxPaid, 0);

    return {
      companyId, quarter, year, periodStart, periodEnd,
      totalMiles: Math.round(totalMiles * 10) / 10, totalGallons: Math.round(totalGallons * 10) / 10,
      mpg: Math.round(mpg * 100) / 100, stateBreakdown,
      totalTaxDue: Math.round(totalTaxDue * 100) / 100, totalTaxPaid: Math.round(totalTaxPaid * 100) / 100,
      netTaxDue: Math.round((totalTaxDue - totalTaxPaid) * 100) / 100, loadsIncluded: entries.length,
    };
  }

  /** Generate quarterly IFTA report grouped by truck */
  async generateQuarterlyReportByTruck(companyId: string, quarter: number, year: number, mcNumberId?: string | string[]): Promise<IFTAByTruckReport> {
    const { periodStart, periodEnd, loadWhere } = buildQuarterQuery(companyId, quarter, year, mcNumberId);
    const loads = await prisma.load.findMany({ where: loadWhere, select: { id: true } });

    const entries = await prisma.iFTAEntry.findMany({
      where: { loadId: { in: loads.map((l) => l.id) }, isCalculated: true },
      include: { stateMileages: true, truck: { select: { id: true, truckNumber: true } } },
    });

    const truckMap = new Map<string, { truckNumber: string; totalMiles: number; loadCount: number; stateAgg: Record<string, { miles: number; tax: number }> }>();
    for (const entry of entries) {
      const tId = entry.truckId || '__unassigned__';
      if (!truckMap.has(tId)) truckMap.set(tId, { truckNumber: entry.truck?.truckNumber || 'Unassigned', totalMiles: 0, loadCount: 0, stateAgg: {} });
      const bucket = truckMap.get(tId)!;
      bucket.totalMiles += entry.totalMiles;
      bucket.loadCount += 1;
      for (const sm of entry.stateMileages) {
        if (!bucket.stateAgg[sm.state]) bucket.stateAgg[sm.state] = { miles: 0, tax: 0 };
        bucket.stateAgg[sm.state].miles += sm.miles;
        bucket.stateAgg[sm.state].tax += sm.tax;
      }
    }

    const fuelByTruckState = await prisma.fuelEntry.groupBy({
      by: ['truckId', 'state'],
      where: { truck: { companyId }, date: { gte: periodStart, lte: periodEnd }, state: { not: null } },
      _sum: { gallons: true, totalCost: true },
    });

    const fuelMap = new Map<string, Map<string, number>>();
    const truckGallonsMap = new Map<string, number>();
    for (const f of fuelByTruckState) {
      if (!f.state || !f.truckId) continue;
      if (!fuelMap.has(f.truckId)) fuelMap.set(f.truckId, new Map());
      const gallons = f._sum.gallons || 0;
      fuelMap.get(f.truckId)!.set(f.state, gallons);
      truckGallonsMap.set(f.truckId, (truckGallonsMap.get(f.truckId) || 0) + gallons);
    }

    const trucks: IFTATruckBreakdownEntry[] = [];
    for (const [tId, bucket] of truckMap) {
      const truckGallons = truckGallonsMap.get(tId) || 0;
      const mpg = truckGallons > 0 ? bucket.totalMiles / truckGallons : 6;
      const truckFuel = fuelMap.get(tId);

      const stateBreakdown: IFTAStateBreakdownItem[] = Object.entries(bucket.stateAgg)
        .map(([state, data]) => {
          const taxRate = IFTA_TAX_RATES[state] || 0;
          const taxDue = (data.miles / mpg) * taxRate;
          const taxPaid = Math.round((truckFuel?.get(state) || 0) * taxRate * 100) / 100;
          return {
            state, stateName: getStateName(state),
            miles: Math.round(data.miles * 10) / 10, taxableMiles: Math.round(data.miles * 10) / 10,
            taxRate, taxDue: Math.round(taxDue * 100) / 100, taxPaid, netTax: Math.round((taxDue - taxPaid) * 100) / 100,
          };
        }).sort((a, b) => a.stateName.localeCompare(b.stateName));

      const totalTaxDue = stateBreakdown.reduce((s, r) => s + r.taxDue, 0);
      const totalTaxPaid = stateBreakdown.reduce((s, r) => s + r.taxPaid, 0);
      trucks.push({
        truckId: tId, truckNumber: bucket.truckNumber, totalMiles: Math.round(bucket.totalMiles * 10) / 10,
        totalGallons: Math.round(truckGallons * 10) / 10, mpg: Math.round(mpg * 100) / 100, loadsIncluded: bucket.loadCount,
        stateBreakdown, totalTaxDue: Math.round(totalTaxDue * 100) / 100, totalTaxPaid: Math.round(totalTaxPaid * 100) / 100,
        netTaxDue: Math.round((totalTaxDue - totalTaxPaid) * 100) / 100,
      });
    }

    trucks.sort((a, b) => a.truckNumber.localeCompare(b.truckNumber, undefined, { numeric: true }));
    const fleetTotalMiles = trucks.reduce((s, t) => s + t.totalMiles, 0);
    const fleetTotalTaxDue = trucks.reduce((s, t) => s + t.totalTaxDue, 0);
    const fleetTotalTaxPaid = trucks.reduce((s, t) => s + t.totalTaxPaid, 0);

    return {
      companyId, quarter, year, periodStart, periodEnd, trucks,
      fleetTotalMiles: Math.round(fleetTotalMiles * 10) / 10,
      fleetTotalTaxDue: Math.round(fleetTotalTaxDue * 100) / 100,
      fleetTotalTaxPaid: Math.round(fleetTotalTaxPaid * 100) / 100,
      fleetNetTaxDue: Math.round((fleetTotalTaxDue - fleetTotalTaxPaid) * 100) / 100,
    };
  }

  /** Generate quarterly IFTA report grouped by driver */
  async generateQuarterlyReportByDriver(companyId: string, quarter: number, year: number, mcNumberId?: string | string[]): Promise<IFTAByDriverReport> {
    const { periodStart, periodEnd, loadWhere } = buildQuarterQuery(companyId, quarter, year, mcNumberId);
    const loads = await prisma.load.findMany({ where: loadWhere, select: { id: true } });

    const entries = await prisma.iFTAEntry.findMany({
      where: { loadId: { in: loads.map((l) => l.id) }, isCalculated: true },
      include: { stateMileages: true, driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } } },
    });

    const driverMap = new Map<string, { driverName: string; totalMiles: number; loadCount: number; stateAgg: Record<string, { miles: number; tax: number }> }>();
    for (const entry of entries) {
      const dName = entry.driver ? `${entry.driver.user?.firstName || ''} ${entry.driver.user?.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
      if (!driverMap.has(entry.driverId)) driverMap.set(entry.driverId, { driverName: dName, totalMiles: 0, loadCount: 0, stateAgg: {} });
      const bucket = driverMap.get(entry.driverId)!;
      bucket.totalMiles += entry.totalMiles;
      bucket.loadCount += 1;
      for (const sm of entry.stateMileages) {
        if (!bucket.stateAgg[sm.state]) bucket.stateAgg[sm.state] = { miles: 0, tax: 0 };
        bucket.stateAgg[sm.state].miles += sm.miles;
        bucket.stateAgg[sm.state].tax += sm.tax;
      }
    }

    // Fleet-wide MPG (fuel is tracked per truck, not per driver)
    const totalFuelResult = await prisma.fuelEntry.aggregate({
      where: { truck: { companyId }, date: { gte: periodStart, lte: periodEnd } },
      _sum: { gallons: true },
    });
    const totalFleetMiles = [...driverMap.values()].reduce((s, b) => s + b.totalMiles, 0);
    const fleetMpg = (totalFuelResult._sum.gallons || 0) > 0 ? totalFleetMiles / (totalFuelResult._sum.gallons || 1) : 6;

    const drivers: IFTADriverBreakdownEntry[] = [];
    for (const [dId, bucket] of driverMap) {
      const stateBreakdown: IFTAStateBreakdownItem[] = Object.entries(bucket.stateAgg)
        .map(([state, data]) => {
          const taxRate = IFTA_TAX_RATES[state] || 0;
          const taxDue = (data.miles / fleetMpg) * taxRate;
          return {
            state, stateName: getStateName(state),
            miles: Math.round(data.miles * 10) / 10, taxableMiles: Math.round(data.miles * 10) / 10,
            taxRate, taxDue: Math.round(taxDue * 100) / 100, taxPaid: 0, netTax: Math.round(taxDue * 100) / 100,
          };
        }).sort((a, b) => a.stateName.localeCompare(b.stateName));

      const totalTaxDue = stateBreakdown.reduce((s, r) => s + r.taxDue, 0);
      drivers.push({
        driverId: dId, driverName: bucket.driverName, totalMiles: Math.round(bucket.totalMiles * 10) / 10,
        totalGallons: Math.round((bucket.totalMiles / fleetMpg) * 10) / 10, mpg: Math.round(fleetMpg * 100) / 100,
        loadsIncluded: bucket.loadCount, stateBreakdown,
        totalTaxDue: Math.round(totalTaxDue * 100) / 100, totalTaxPaid: 0, netTaxDue: Math.round(totalTaxDue * 100) / 100,
      });
    }

    drivers.sort((a, b) => a.driverName.localeCompare(b.driverName));
    const fleetTotalMiles = drivers.reduce((s, d) => s + d.totalMiles, 0);
    const fleetTotalTaxDue = drivers.reduce((s, d) => s + d.totalTaxDue, 0);

    return {
      companyId, quarter, year, periodStart, periodEnd, drivers,
      fleetTotalMiles: Math.round(fleetTotalMiles * 10) / 10,
      fleetTotalTaxDue: Math.round(fleetTotalTaxDue * 100) / 100,
      fleetTotalTaxPaid: 0,
      fleetNetTaxDue: Math.round(fleetTotalTaxDue * 100) / 100,
    };
  }
}

// Singleton export
export const iftaCalculatorService = new IFTACalculatorService();
