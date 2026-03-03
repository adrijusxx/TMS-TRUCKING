/**
 * BreakdownHotspotManager
 *
 * Analyzes breakdown patterns to identify hotspots by:
 * - Location (state/city grouping)
 * - Time of day (morning/afternoon/evening/night)
 * - Equipment type (truck type and age)
 * - Driver (frequency by driver)
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface LocationHotspot {
  state: string;
  city: string | null;
  count: number;
  percentage: number;
  breakdownTypes: Record<string, number>;
  avgCost: number;
}

interface TimeHotspot {
  period: string;
  hourRange: string;
  count: number;
  percentage: number;
}

interface EquipmentHotspot {
  equipmentType: string;
  count: number;
  percentage: number;
  avgAge: number;
  byAge: Record<string, number>;
}

interface DriverHotspot {
  driverId: string;
  driverName: string;
  driverNumber: string;
  count: number;
  percentage: number;
  breakdownTypes: Record<string, number>;
}

interface HotspotAnalysis {
  totalBreakdowns: number;
  dateRange: { startDate: string; endDate: string };
  byLocation: LocationHotspot[];
  byTimeOfDay: TimeHotspot[];
  byEquipmentType: EquipmentHotspot[];
  byDriver: DriverHotspot[];
}

/**
 * Classify an hour into a time-of-day period.
 */
function getTimePeriod(hour: number): { period: string; hourRange: string } {
  if (hour >= 6 && hour < 12) return { period: 'Morning', hourRange: '6am-12pm' };
  if (hour >= 12 && hour < 18) return { period: 'Afternoon', hourRange: '12pm-6pm' };
  if (hour >= 18 && hour < 24) return { period: 'Evening', hourRange: '6pm-12am' };
  return { period: 'Night', hourRange: '12am-6am' };
}

/**
 * Calculate age bucket for a truck based on current year and model year.
 */
function getAgeBucket(year: number): string {
  const age = new Date().getFullYear() - year;
  if (age <= 2) return '0-2 years';
  if (age <= 5) return '3-5 years';
  if (age <= 10) return '6-10 years';
  return '10+ years';
}

export class BreakdownHotspotManager {
  /**
   * Analyze breakdown hotspots for a company within a date range.
   */
  static async analyzeHotspots(
    companyId: string,
    range: DateRange
  ): Promise<HotspotAnalysis> {
    const breakdowns = await prisma.breakdown.findMany({
      where: {
        companyId,
        deletedAt: null,
        reportedAt: { gte: range.startDate, lte: range.endDate },
      },
      select: {
        id: true,
        state: true,
        city: true,
        breakdownType: true,
        reportedAt: true,
        totalCost: true,
        driverId: true,
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        truck: {
          select: {
            id: true,
            equipmentType: true,
            year: true,
            make: true,
            model: true,
          },
        },
      },
    });

    const total = breakdowns.length;
    if (total === 0) {
      return buildEmptyAnalysis(range);
    }

    const byLocation = analyzeByLocation(breakdowns, total);
    const byTimeOfDay = analyzeByTimeOfDay(breakdowns, total);
    const byEquipmentType = analyzeByEquipmentType(breakdowns, total);
    const byDriver = analyzeByDriver(breakdowns, total);

    logger.info('Hotspot analysis completed', {
      companyId,
      totalBreakdowns: total,
      topLocation: byLocation[0]?.state,
      topTimePeriod: byTimeOfDay[0]?.period,
    });

    return {
      totalBreakdowns: total,
      dateRange: {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      byLocation,
      byTimeOfDay,
      byEquipmentType,
      byDriver,
    };
  }
}

// ── Analysis helpers ───────────────────────────────────────────────

type BreakdownRow = {
  id: string;
  state: string | null;
  city: string | null;
  breakdownType: string;
  reportedAt: Date;
  totalCost: number;
  driverId: string | null;
  driver: { id: string; driverNumber: string; user: { firstName: string | null; lastName: string | null } | null } | null;
  truck: { id: string; equipmentType: string; year: number; make: string; model: string };
};

function analyzeByLocation(breakdowns: BreakdownRow[], total: number): LocationHotspot[] {
  const map = new Map<string, { state: string; city: string | null; items: BreakdownRow[] }>();

  for (const bd of breakdowns) {
    const state = bd.state || 'Unknown';
    const city = bd.city || null;
    const key = `${state}|${city || ''}`;

    if (!map.has(key)) {
      map.set(key, { state, city, items: [] });
    }
    map.get(key)!.items.push(bd);
  }

  const results: LocationHotspot[] = [];
  for (const entry of map.values()) {
    const count = entry.items.length;
    const typeMap: Record<string, number> = {};
    let costSum = 0;

    for (const bd of entry.items) {
      typeMap[bd.breakdownType] = (typeMap[bd.breakdownType] || 0) + 1;
      costSum += bd.totalCost;
    }

    results.push({
      state: entry.state,
      city: entry.city,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      breakdownTypes: typeMap,
      avgCost: count > 0 ? Math.round((costSum / count) * 100) / 100 : 0,
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

function analyzeByTimeOfDay(breakdowns: BreakdownRow[], total: number): TimeHotspot[] {
  const map = new Map<string, { period: string; hourRange: string; count: number }>();

  for (const bd of breakdowns) {
    const hour = new Date(bd.reportedAt).getHours();
    const { period, hourRange } = getTimePeriod(hour);

    if (!map.has(period)) {
      map.set(period, { period, hourRange, count: 0 });
    }
    map.get(period)!.count += 1;
  }

  const results: TimeHotspot[] = [];
  for (const entry of map.values()) {
    results.push({
      period: entry.period,
      hourRange: entry.hourRange,
      count: entry.count,
      percentage: Math.round((entry.count / total) * 1000) / 10,
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

function analyzeByEquipmentType(breakdowns: BreakdownRow[], total: number): EquipmentHotspot[] {
  const map = new Map<string, { equipmentType: string; items: BreakdownRow[] }>();

  for (const bd of breakdowns) {
    const eqType = bd.truck.equipmentType;
    if (!map.has(eqType)) {
      map.set(eqType, { equipmentType: eqType, items: [] });
    }
    map.get(eqType)!.items.push(bd);
  }

  const results: EquipmentHotspot[] = [];
  for (const entry of map.values()) {
    const count = entry.items.length;
    const ages = entry.items.map((bd) => new Date().getFullYear() - bd.truck.year);
    const avgAge = ages.length > 0 ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : 0;

    const byAge: Record<string, number> = {};
    for (const bd of entry.items) {
      const bucket = getAgeBucket(bd.truck.year);
      byAge[bucket] = (byAge[bucket] || 0) + 1;
    }

    results.push({
      equipmentType: entry.equipmentType,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      avgAge,
      byAge,
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

function analyzeByDriver(breakdowns: BreakdownRow[], total: number): DriverHotspot[] {
  const map = new Map<string, { driver: BreakdownRow['driver']; driverId: string; items: BreakdownRow[] }>();

  for (const bd of breakdowns) {
    if (!bd.driverId || !bd.driver) continue;
    if (!map.has(bd.driverId)) {
      map.set(bd.driverId, { driver: bd.driver, driverId: bd.driverId, items: [] });
    }
    map.get(bd.driverId)!.items.push(bd);
  }

  const results: DriverHotspot[] = [];
  for (const entry of map.values()) {
    const count = entry.items.length;
    const typeMap: Record<string, number> = {};
    for (const bd of entry.items) {
      typeMap[bd.breakdownType] = (typeMap[bd.breakdownType] || 0) + 1;
    }

    const firstName = entry.driver?.user?.firstName || '';
    const lastName = entry.driver?.user?.lastName || '';
    const driverName = `${firstName} ${lastName}`.trim() || 'Unknown';

    results.push({
      driverId: entry.driverId,
      driverName,
      driverNumber: entry.driver?.driverNumber || '',
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      breakdownTypes: typeMap,
    });
  }

  return results.sort((a, b) => b.count - a.count);
}

function buildEmptyAnalysis(range: DateRange): HotspotAnalysis {
  return {
    totalBreakdowns: 0,
    dateRange: {
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
    },
    byLocation: [],
    byTimeOfDay: [],
    byEquipmentType: [],
    byDriver: [],
  };
}
