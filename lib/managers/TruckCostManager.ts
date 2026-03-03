/**
 * TruckCostManager
 *
 * Calculates cost-per-mile for individual trucks and fleet-wide comparison.
 * Aggregates costs from fuel, maintenance, load expenses (tolls, etc.),
 * and mileage from Load.totalMiles.
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface CostBreakdown {
  fuel: number;
  maintenance: number;
  tolls: number;
  otherExpenses: number;
  insurance: number;
}

interface TruckCostPerMile {
  truckId: string;
  truckNumber: string;
  make: string;
  model: string;
  year: number;
  totalCost: number;
  totalMiles: number;
  costPerMile: number;
  breakdown: CostBreakdown;
  loadCount: number;
}

interface FleetCostSummary {
  fleetAvgCostPerMile: number;
  fleetTotalCost: number;
  fleetTotalMiles: number;
  truckCount: number;
  trucks: TruckCostPerMile[];
  bestPerformer: TruckCostPerMile | null;
  worstPerformer: TruckCostPerMile | null;
}

/**
 * Sum fuel costs from FuelEntry records for a truck within a date range.
 */
async function getFuelCost(truckId: string, range: DateRange): Promise<number> {
  const result = await prisma.fuelEntry.aggregate({
    where: {
      truckId,
      date: { gte: range.startDate, lte: range.endDate },
    },
    _sum: { totalCost: true },
  });
  return result._sum.totalCost || 0;
}

/**
 * Sum maintenance costs from MaintenanceRecord for a truck within a date range.
 */
async function getMaintenanceCost(truckId: string, range: DateRange): Promise<number> {
  const result = await prisma.maintenanceRecord.aggregate({
    where: {
      truckId,
      date: { gte: range.startDate, lte: range.endDate },
    },
    _sum: { cost: true },
  });
  return result._sum.cost || 0;
}

/**
 * Sum load expenses (tolls, repairs, etc.) from loads assigned to a truck.
 */
async function getLoadExpenses(
  truckId: string,
  range: DateRange
): Promise<{ tolls: number; other: number }> {
  const expenses = await prisma.loadExpense.findMany({
    where: {
      load: {
        truckId,
        pickupDate: { gte: range.startDate, lte: range.endDate },
      },
    },
    select: { expenseType: true, amount: true },
  });

  let tolls = 0;
  let other = 0;
  for (const e of expenses) {
    if (e.expenseType === 'TOLL') {
      tolls += e.amount;
    } else {
      other += e.amount;
    }
  }
  return { tolls, other };
}

/**
 * Sum total miles from loads assigned to a truck.
 */
async function getLoadMiles(truckId: string, range: DateRange): Promise<{ miles: number; count: number }> {
  const loads = await prisma.load.findMany({
    where: {
      truckId,
      pickupDate: { gte: range.startDate, lte: range.endDate },
      deletedAt: null,
    },
    select: { totalMiles: true },
  });
  const miles = loads.reduce((sum, l) => sum + (l.totalMiles || 0), 0);
  return { miles, count: loads.length };
}

export class TruckCostManager {
  /**
   * Calculate cost per mile for a specific truck within a date range.
   */
  static async getCostPerMile(truckId: string, range: DateRange): Promise<TruckCostPerMile> {
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      select: { id: true, truckNumber: true, make: true, model: true, year: true },
    });

    if (!truck) {
      throw new NotFoundError('Truck', truckId);
    }

    const [fuelCost, maintenanceCost, loadExpenses, loadData] = await Promise.all([
      getFuelCost(truckId, range),
      getMaintenanceCost(truckId, range),
      getLoadExpenses(truckId, range),
      getLoadMiles(truckId, range),
    ]);

    // Insurance is estimated as a fixed monthly cost if not tracked per-truck
    // For now, we set it to 0 since it is not tracked per-truck in the schema
    const insuranceCost = 0;

    const totalCost = fuelCost + maintenanceCost + loadExpenses.tolls + loadExpenses.other + insuranceCost;
    const costPerMile = loadData.miles > 0 ? Math.round((totalCost / loadData.miles) * 1000) / 1000 : 0;

    logger.debug('Truck cost per mile calculated', {
      truckId,
      totalCost,
      totalMiles: loadData.miles,
      costPerMile,
    });

    return {
      truckId: truck.id,
      truckNumber: truck.truckNumber,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      totalCost: Math.round(totalCost * 100) / 100,
      totalMiles: Math.round(loadData.miles * 10) / 10,
      costPerMile,
      breakdown: {
        fuel: Math.round(fuelCost * 100) / 100,
        maintenance: Math.round(maintenanceCost * 100) / 100,
        tolls: Math.round(loadExpenses.tolls * 100) / 100,
        otherExpenses: Math.round(loadExpenses.other * 100) / 100,
        insurance: insuranceCost,
      },
      loadCount: loadData.count,
    };
  }

  /**
   * Calculate cost per mile for all trucks in a fleet for comparison.
   */
  static async getCostPerMileFleet(
    companyId: string,
    range: DateRange
  ): Promise<FleetCostSummary> {
    const trucks = await prisma.truck.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (trucks.length === 0) {
      return {
        fleetAvgCostPerMile: 0,
        fleetTotalCost: 0,
        fleetTotalMiles: 0,
        truckCount: 0,
        trucks: [],
        bestPerformer: null,
        worstPerformer: null,
      };
    }

    // Calculate cost per mile for each truck in parallel
    const results = await Promise.all(
      trucks.map((t) => TruckCostManager.getCostPerMile(t.id, range).catch(() => null))
    );

    const validResults = results.filter((r): r is TruckCostPerMile => r !== null && r.totalMiles > 0);
    const allResults = results.filter((r): r is TruckCostPerMile => r !== null);

    const fleetTotalCost = allResults.reduce((sum, r) => sum + r.totalCost, 0);
    const fleetTotalMiles = allResults.reduce((sum, r) => sum + r.totalMiles, 0);
    const fleetAvgCostPerMile =
      fleetTotalMiles > 0 ? Math.round((fleetTotalCost / fleetTotalMiles) * 1000) / 1000 : 0;

    // Sort by costPerMile for best/worst (only trucks with miles)
    const sorted = [...validResults].sort((a, b) => a.costPerMile - b.costPerMile);

    logger.info('Fleet cost per mile calculated', {
      companyId,
      truckCount: allResults.length,
      fleetAvgCostPerMile,
    });

    return {
      fleetAvgCostPerMile,
      fleetTotalCost: Math.round(fleetTotalCost * 100) / 100,
      fleetTotalMiles: Math.round(fleetTotalMiles * 10) / 10,
      truckCount: allResults.length,
      trucks: allResults.sort((a, b) => a.costPerMile - b.costPerMile),
      bestPerformer: sorted.length > 0 ? sorted[0] : null,
      worstPerformer: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    };
  }
}
