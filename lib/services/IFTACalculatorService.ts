/**
 * IFTA Calculator Service
 * 
 * Calculates International Fuel Tax Agreement (IFTA) mileage and tax
 * using accurate route data from Google Maps Directions API.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 4
 */

import { prisma } from '@/lib/prisma';
import { routingService, RouteWaypoint, StateMileage } from './RoutingService';

// Current IFTA tax rates by state (cents per gallon)
// These should be updated quarterly from IFTA Inc.
export const IFTA_TAX_RATES: Record<string, number> = {
  AL: 0.29,
  AK: 0.0895, // Alaska is not an IFTA jurisdiction but included for reference
  AZ: 0.26,
  AR: 0.285,
  CA: 0.68,
  CO: 0.22,
  CT: 0.45,
  DE: 0.22,
  FL: 0.35,
  GA: 0.326,
  HI: 0.17, // Hawaii is not an IFTA jurisdiction
  ID: 0.32,
  IL: 0.467,
  IN: 0.54,
  IA: 0.30,
  KS: 0.26,
  KY: 0.247,
  LA: 0.20,
  ME: 0.312,
  MD: 0.365,
  MA: 0.24,
  MI: 0.262,
  MN: 0.285,
  MS: 0.18,
  MO: 0.17,
  MT: 0.2975,
  NE: 0.294,
  NV: 0.23,
  NH: 0.222,
  NJ: 0.414,
  NM: 0.18,
  NY: 0.3235,
  NC: 0.38,
  ND: 0.23,
  OH: 0.385,
  OK: 0.19,
  OR: 0.36,
  PA: 0.576,
  RI: 0.34,
  SC: 0.26,
  SD: 0.28,
  TN: 0.26,
  TX: 0.20,
  UT: 0.314,
  VT: 0.31,
  VA: 0.282,
  WA: 0.494,
  WV: 0.357,
  WI: 0.309,
  WY: 0.24,
  DC: 0.235,
};

export interface IFTALoadData {
  loadId: string;
  loadNumber: string;
  pickupCity: string;
  pickupState: string;
  pickupZip?: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip?: string;
  stops?: Array<{
    city: string;
    state: string;
    zipCode?: string;
    sequence: number;
  }>;
  driverId: string;
  truckId?: string;
  deliveredAt?: Date;
}

export interface IFTACalculationResult {
  loadId: string;
  totalMiles: number;
  stateMileages: Array<StateMileage & { taxRate: number; tax: number }>;
  totalTax: number;
  routePolyline: string | null;
  calculatedAt: Date;
}

export interface IFTAQuarterReport {
  companyId: string;
  quarter: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  totalMiles: number;
  totalGallons: number;
  mpg: number;
  stateBreakdown: Array<{
    state: string;
    stateName: string;
    miles: number;
    taxableMiles: number;
    taxRate: number;
    taxDue: number;
    taxPaid: number;
    netTax: number;
  }>;
  totalTaxDue: number;
  totalTaxPaid: number;
  netTaxDue: number;
  loadsIncluded: number;
}

export class IFTACalculatorService {
  /**
   * Calculate IFTA for a single load using routing service
   */
  async calculateForLoad(load: IFTALoadData): Promise<IFTACalculationResult> {
    // Build waypoints from load data
    const waypoints: RouteWaypoint[] = [];

    // Add pickup
    waypoints.push({
      city: load.pickupCity,
      state: load.pickupState,
      zipCode: load.pickupZip,
    });

    // Add intermediate stops in sequence order
    if (load.stops && load.stops.length > 0) {
      const sortedStops = [...load.stops].sort((a, b) => a.sequence - b.sequence);
      for (const stop of sortedStops) {
        waypoints.push({
          city: stop.city,
          state: stop.state,
          zipCode: stop.zipCode,
        });
      }
    }

    // Add delivery
    waypoints.push({
      city: load.deliveryCity,
      state: load.deliveryState,
      zipCode: load.deliveryZip,
    });

    // Calculate route with state mileages
    const route = await routingService.calculateRouteWithStateMileage(waypoints);

    // Add tax calculations to state mileages
    const stateMileagesWithTax = route.stateMileages.map((sm) => {
      const taxRate = IFTA_TAX_RATES[sm.state] || 0;
      // Tax is based on gallons consumed, not miles
      // For simplicity, we'll calculate based on average MPG (6 mpg for trucks)
      const gallonsUsed = sm.miles / 6;
      const tax = gallonsUsed * taxRate;

      return {
        ...sm,
        taxRate,
        tax: Math.round(tax * 100) / 100,
      };
    });

    const totalTax = stateMileagesWithTax.reduce((sum, sm) => sum + sm.tax, 0);

    return {
      loadId: load.loadId,
      totalMiles: route.totalMiles,
      stateMileages: stateMileagesWithTax,
      totalTax: Math.round(totalTax * 100) / 100,
      routePolyline: route.polyline,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate and store IFTA entry for a load in database
   */
  async calculateAndStoreForLoad(
    loadId: string,
    companyId: string,
    quarter: number,
    year: number
  ): Promise<string> {
    // Fetch load data
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!load) {
      throw new Error(`Load ${loadId} not found`);
    }

    if (!load.driverId) {
      throw new Error(`Load ${loadId} has no driver assigned`);
    }

    // Build load data for calculation
    const loadData: IFTALoadData = {
      loadId: load.id,
      loadNumber: load.loadNumber,
      pickupCity: load.pickupCity || '',
      pickupState: load.pickupState || '',
      pickupZip: load.pickupZip || undefined,
      deliveryCity: load.deliveryCity || '',
      deliveryState: load.deliveryState || '',
      deliveryZip: load.deliveryZip || undefined,
      stops: load.stops.map((s) => ({
        city: s.city,
        state: s.state,
        zipCode: s.zip || undefined,
        sequence: s.sequence,
      })),
      driverId: load.driverId,
      truckId: load.truckId || undefined,
      deliveredAt: load.deliveredAt || undefined,
    };

    // Calculate IFTA
    const calculation = await this.calculateForLoad(loadData);

    // Check if entry exists
    const existing = await prisma.iFTAEntry.findUnique({
      where: { loadId },
    });

    const iftaData = {
      companyId,
      loadId,
      driverId: load.driverId,
      truckId: load.truckId,
      periodType: 'QUARTER' as const,
      periodYear: year,
      periodQuarter: quarter,
      totalMiles: calculation.totalMiles,
      totalTax: calculation.totalTax,
      totalDeduction: 0,
      isCalculated: true,
      calculatedAt: new Date(),
    };

    let entryId: string;

    if (existing) {
      // Update existing
      await prisma.iFTAEntry.update({
        where: { id: existing.id },
        data: iftaData,
      });
      entryId = existing.id;

      // Delete old state mileages
      await prisma.iFTAStateMileage.deleteMany({
        where: { iftaEntryId: existing.id },
      });
    } else {
      // Create new
      const entry = await prisma.iFTAEntry.create({
        data: iftaData,
      });
      entryId = entry.id;
    }

    // Create state mileages
    await prisma.iFTAStateMileage.createMany({
      data: calculation.stateMileages.map((sm) => ({
        iftaEntryId: entryId,
        state: sm.state,
        miles: sm.miles,
        taxRate: sm.taxRate,
        tax: sm.tax,
        deduction: 0,
      })),
    });

    return entryId;
  }

  /**
   * Generate quarterly IFTA report
   */
  async generateQuarterlyReport(
    companyId: string,
    quarter: number,
    year: number,
    mcNumberId?: string | string[]
  ): Promise<IFTAQuarterReport> {
    // Get period dates
    const monthMap: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 9 };
    const periodStart = new Date(year, monthMap[quarter], 1);
    const periodEnd = new Date(year, monthMap[quarter] + 3, 0);

    // Build where clause for loads
    const loadWhere: Record<string, unknown> = {
      companyId,
      deletedAt: null,
      driverId: { not: null },
      OR: [
        { deliveredAt: { gte: periodStart, lte: periodEnd } },
        { deliveryDate: { gte: periodStart, lte: periodEnd } },
      ],
    };

    if (mcNumberId) {
      loadWhere.mcNumberId = Array.isArray(mcNumberId)
        ? { in: mcNumberId }
        : mcNumberId;
    }

    // Get all loads in period
    const loads = await prisma.load.findMany({
      where: loadWhere,
      select: { id: true },
    });

    // Get IFTA entries for these loads
    const entries = await prisma.iFTAEntry.findMany({
      where: {
        loadId: { in: loads.map((l) => l.id) },
        isCalculated: true,
      },
      include: {
        stateMileages: true,
      },
    });

    // Aggregate state mileages
    const stateAggregates: Record<string, { miles: number; tax: number }> = {};
    let totalMiles = 0;
    let totalTax = 0;

    for (const entry of entries) {
      totalMiles += entry.totalMiles;
      totalTax += entry.totalTax;

      for (const sm of entry.stateMileages) {
        if (!stateAggregates[sm.state]) {
          stateAggregates[sm.state] = { miles: 0, tax: 0 };
        }
        stateAggregates[sm.state].miles += sm.miles;
        stateAggregates[sm.state].tax += sm.tax;
      }
    }

    // Get fuel purchases grouped by state
    const fuelByState = await prisma.fuelEntry.groupBy({
      by: ['state'],
      where: {
        truck: { companyId },
        date: { gte: periodStart, lte: periodEnd },
        state: { not: null },
      },
      _sum: { gallons: true, totalCost: true },
    });

    // Create lookup map for fuel by state
    const fuelMap = new Map<string, { gallons: number; cost: number }>();
    let totalGallons = 0;

    fuelByState.forEach((entry) => {
      if (entry.state) {
        const gallons = entry._sum.gallons || 0;
        const cost = entry._sum.totalCost || 0;
        fuelMap.set(entry.state, { gallons, cost });
        totalGallons += gallons;
      }
    });

    const mpg = totalGallons > 0 ? totalMiles / totalGallons : 6; // Default 6 MPG if no data

    // Build state breakdown
    const stateBreakdown = Object.entries(stateAggregates).map(([state, data]) => {
      const taxRate = IFTA_TAX_RATES[state] || 0;
      const gallonsInState = data.miles / mpg;
      const taxDue = gallonsInState * taxRate;

      // Get fuel purchased in this state
      const stateFuel = fuelMap.get(state);
      const gallonsPurchased = stateFuel?.gallons || 0;

      // Tax Paid = Gallons Purchased * Tax Rate
      const taxPaid = Math.round(gallonsPurchased * taxRate * 100) / 100;

      return {
        state,
        stateName: this.getStateName(state),
        miles: Math.round(data.miles * 10) / 10,
        taxableMiles: Math.round(data.miles * 10) / 10,
        taxRate,
        taxDue: Math.round(taxDue * 100) / 100,
        taxPaid,
        netTax: Math.round((taxDue - taxPaid) * 100) / 100,
      };
    });

    // Sort by state name
    stateBreakdown.sort((a, b) => a.stateName.localeCompare(b.stateName));

    const totalTaxDue = stateBreakdown.reduce((sum, s) => sum + s.taxDue, 0);
    const totalTaxPaid = stateBreakdown.reduce((sum, s) => sum + s.taxPaid, 0);

    return {
      companyId,
      quarter,
      year,
      periodStart,
      periodEnd,
      totalMiles: Math.round(totalMiles * 10) / 10,
      totalGallons: Math.round(totalGallons * 10) / 10,
      mpg: Math.round(mpg * 100) / 100,
      stateBreakdown,
      totalTaxDue: Math.round(totalTaxDue * 100) / 100,
      totalTaxPaid: Math.round(totalTaxPaid * 100) / 100,
      netTaxDue: Math.round((totalTaxDue - totalTaxPaid) * 100) / 100,
      loadsIncluded: entries.length,
    };
  }

  /**
   * Get state full name from abbreviation
   */
  private getStateName(abbr: string): string {
    const stateNames: Record<string, string> = {
      AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
      CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
      FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
      IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
      KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
      MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
      MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
      NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
      NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
      OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
      SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
      VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
      WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
    };
    return stateNames[abbr] || abbr;
  }
}

// Singleton export
export const iftaCalculatorService = new IFTACalculatorService();



