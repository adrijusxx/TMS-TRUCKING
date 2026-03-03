import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrailerStats {
  loadCount: number;
  activeLoads: number;
  lastUsed: Date | null;
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/**
 * TrailerQueryManager - handles trailer list query statistics aggregation.
 * Extracted from the trailers route to reduce file size.
 */
export class TrailerQueryManager {

  /**
   * Fetch load statistics for a list of trailers.
   * Loads can be linked by trailerId (FK relation) or trailerNumber (string field).
   * Combines both sources for accurate counts.
   */
  static async getTrailerLoadStats(
    trailerIds: string[],
    trailerNumbers: string[],
    skipStats: boolean,
  ): Promise<Map<string, TrailerStats>> {
    const statsMap = new Map<string, TrailerStats>();

    if (skipStats || trailerIds.length === 0) return statsMap;

    // Initialize per-trailer stats
    const loadCountById = new Map<string, number>();
    const activeCountById = new Map<string, number>();
    const lastUsedById = new Map<string, Date>();
    const loadCountByNumber = new Map<string, number>();
    const activeCountByNumber = new Map<string, number>();
    const lastUsedByNumber = new Map<string, Date>();

    // Stats by trailerId (FK relation)
    try {
      const [loadStatsById, activeStatsById] = await Promise.all([
        prisma.load.groupBy({
          by: ['trailerId'],
          where: { trailerId: { in: trailerIds }, deletedAt: null },
          _count: { id: true },
          _max: { deliveryDate: true },
        }),
        prisma.load.groupBy({
          by: ['trailerId'],
          where: {
            trailerId: { in: trailerIds },
            deletedAt: null,
            status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] },
          },
          _count: { id: true },
        }),
      ]);

      for (const stat of loadStatsById) {
        if (stat.trailerId) {
          loadCountById.set(stat.trailerId, stat._count.id);
          if (stat._max.deliveryDate) lastUsedById.set(stat.trailerId, stat._max.deliveryDate);
        }
      }
      for (const stat of activeStatsById) {
        if (stat.trailerId) activeCountById.set(stat.trailerId, stat._count.id);
      }
    } catch (error: any) {
      logger.error('Error fetching load stats by trailerId', { error: error?.message });
    }

    // Stats by trailerNumber (string field, only for loads not linked by FK)
    if (trailerNumbers.length > 0) {
      try {
        const [loadStatsByNum, activeStatsByNum] = await Promise.all([
          prisma.load.groupBy({
            by: ['trailerNumber'],
            where: { trailerNumber: { in: trailerNumbers }, deletedAt: null, trailerId: null },
            _count: { id: true },
            _max: { deliveryDate: true },
          }),
          prisma.load.groupBy({
            by: ['trailerNumber'],
            where: {
              trailerNumber: { in: trailerNumbers },
              deletedAt: null, trailerId: null,
              status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'] },
            },
            _count: { id: true },
          }),
        ]);

        for (const stat of loadStatsByNum) {
          if (stat.trailerNumber) {
            loadCountByNumber.set(stat.trailerNumber, stat._count.id);
            if (stat._max.deliveryDate) lastUsedByNumber.set(stat.trailerNumber, stat._max.deliveryDate);
          }
        }
        for (const stat of activeStatsByNum) {
          if (stat.trailerNumber) activeCountByNumber.set(stat.trailerNumber, stat._count.id);
        }
      } catch (error: any) {
        logger.error('Error fetching load stats by trailerNumber', { error: error?.message });
      }
    }

    // Build combined stats map (keyed by trailer ID)
    // We'll need the caller to pass both id and trailerNumber
    // Return maps by ID and by number for the caller to merge
    return new Map([
      ...Array.from(loadCountById.entries()).map(([id, count]) => [
        `id:${id}`,
        {
          loadCount: count,
          activeLoads: activeCountById.get(id) || 0,
          lastUsed: lastUsedById.get(id) || null,
        },
      ] as [string, TrailerStats]),
      ...Array.from(loadCountByNumber.entries()).map(([num, count]) => [
        `num:${num}`,
        {
          loadCount: count,
          activeLoads: activeCountByNumber.get(num) || 0,
          lastUsed: lastUsedByNumber.get(num) || null,
        },
      ] as [string, TrailerStats]),
    ]);
  }

  /** Transform a raw trailer record into the list API response shape */
  static transformListItem(trailer: any, statsMap: Map<string, TrailerStats>, skipStats: boolean): any {
    const byId = statsMap.get(`id:${trailer.id}`);
    const byNum = statsMap.get(`num:${trailer.trailerNumber}`);

    const loadCount = (byId?.loadCount || 0) + (byNum?.loadCount || 0);
    const activeLoads = (byId?.activeLoads || 0) + (byNum?.activeLoads || 0);

    const dates = [byId?.lastUsed, byNum?.lastUsed].filter(Boolean) as Date[];
    const lastUsed = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    return {
      id: trailer.id,
      trailerNumber: trailer.trailerNumber,
      vin: trailer.vin,
      make: trailer.make,
      model: trailer.model,
      year: trailer.year,
      licensePlate: trailer.licensePlate,
      state: trailer.state,
      mcNumber: trailer.mcNumber ? {
        id: trailer.mcNumber.id,
        number: trailer.mcNumber.number,
        companyName: trailer.mcNumber.companyName,
      } : null,
      mcNumberId: trailer.mcNumberId,
      type: trailer.type,
      ownership: trailer.ownership,
      ownerName: trailer.ownerName,
      status: trailer.status,
      fleetStatus: trailer.fleetStatus,
      assignedTruck: trailer.assignedTruck
        ? { id: trailer.assignedTruck.id, truckNumber: trailer.assignedTruck.truckNumber }
        : null,
      operatorDriver: trailer.operatorDriver
        ? {
            id: trailer.operatorDriver.id,
            driverNumber: trailer.operatorDriver.driverNumber,
            name: trailer.operatorDriver.user
              ? `${trailer.operatorDriver.user.firstName} ${trailer.operatorDriver.user.lastName}`
              : 'Unknown',
          }
        : null,
      loadCount: skipStats ? 0 : loadCount,
      activeLoads: skipStats ? 0 : activeLoads,
      lastUsed: skipStats ? null : lastUsed,
      registrationExpiry: trailer.registrationExpiry,
      insuranceExpiry: trailer.insuranceExpiry,
      inspectionExpiry: trailer.inspectionExpiry,
      isActive: trailer.isActive,
      createdAt: trailer.createdAt,
      updatedAt: trailer.updatedAt,
    };
  }
}
