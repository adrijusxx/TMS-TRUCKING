import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara/fleet';
import { DormantEquipmentDetector } from './DormantEquipmentDetector';
import { FleetMonitoringManager } from './FleetMonitoringManager';
import type {
  TruckInventoryItem,
  TrailerInventoryItem,
  ActiveLoadInfo,
  InventoryResponse,
} from './types';

const ACTIVE_LOAD_STATUSES = [
  'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP',
  'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY',
] as const;

// Simple in-memory cache for Samsara locations (2 minute TTL)
const locationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

function getCachedLocations(key: string) {
  const entry = locationCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

function setCachedLocations(key: string, data: any) {
  locationCache.set(key, { data, timestamp: Date.now() });
}

interface InventoryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: string;
  search?: string;
  mcNumberId?: string;
}

export class FleetInventoryManager {
  private readonly detector: DormantEquipmentDetector;

  constructor(private readonly companyId: string) {
    this.detector = new DormantEquipmentDetector(companyId);
  }

  async getTruckInventory(params: InventoryParams): Promise<InventoryResponse<TruckInventoryItem>> {
    const { page, limit, sortBy, sortOrder, status, search, mcNumberId } = params;

    const where: any = {
      companyId: this.companyId,
      isActive: true,
      deletedAt: null,
    };
    if (mcNumberId) where.mcNumberId = mcNumberId;
    if (search) where.truckNumber = { contains: search, mode: 'insensitive' };

    // Handle dormant pseudo-filter
    if (status === 'DORMANT') {
      const dormantIds = await this.getDormantTruckIds();
      where.id = { in: dormantIds };
    } else if (status && status !== 'ALL') {
      where.status = status;
    }

    const validSortFields: Record<string, string> = {
      truckNumber: 'truckNumber', make: 'make', model: 'model',
      year: 'year', status: 'status',
    };
    const orderBy: any = validSortFields[sortBy]
      ? { [validSortFields[sortBy]]: sortOrder }
      : { truckNumber: 'asc' };

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, truckNumber: true, make: true, model: true, year: true,
          status: true, samsaraId: true,
          longTermOutOfService: true, outOfServiceReason: true, expectedReturnDate: true,
          currentDrivers: {
            select: {
              id: true, driverNumber: true,
              user: { select: { firstName: true, lastName: true } },
            },
            take: 1,
          },
        },
      }),
      prisma.truck.count({ where }),
    ]);

    if (trucks.length === 0) {
      return { items: [], meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    const truckIds = trucks.map((t) => t.id);
    const [lastLoads, activeLoads, locations] = await Promise.all([
      this.detector.getLastLoadsByTruck(truckIds),
      this.getActiveLoadsByTruck(truckIds),
      this.getSamsaraLocationsForPage(
        trucks.filter((t) => t.samsaraId).map((t) => ({ id: t.id, samsaraId: t.samsaraId! }))
      ),
    ]);

    const now = new Date();
    const items: TruckInventoryItem[] = trucks.map((truck) => {
      const lastLoad = lastLoads.get(truck.id);
      const daysSince = lastLoad
        ? Math.round((now.getTime() - lastLoad.lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const driver = truck.currentDrivers[0] || null;

      return {
        id: truck.id,
        truckNumber: truck.truckNumber,
        make: truck.make,
        model: truck.model,
        year: truck.year,
        status: truck.status,
        currentDriver: driver
          ? { id: driver.id, name: `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.trim() || 'Unknown', driverNumber: driver.driverNumber }
          : null,
        activeLoad: activeLoads.get(truck.id) ?? null,
        lastLoad: lastLoad ? { loadNumber: lastLoad.loadNumber, date: lastLoad.lastDate } : null,
        daysSinceLastLoad: daysSince,
        samsaraLocation: locations.get(truck.id) ?? null,
        oosInfo: {
          longTermOutOfService: truck.longTermOutOfService,
          reason: truck.outOfServiceReason,
          expectedReturnDate: truck.expectedReturnDate,
        },
      };
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getTrailerInventory(params: InventoryParams): Promise<InventoryResponse<TrailerInventoryItem>> {
    const { page, limit, sortBy, sortOrder, status, search, mcNumberId } = params;

    const where: any = {
      companyId: this.companyId,
      isActive: true,
      deletedAt: null,
    };
    if (mcNumberId) where.mcNumberId = mcNumberId;
    if (search) where.trailerNumber = { contains: search, mode: 'insensitive' };

    if (status === 'DORMANT') {
      const dormantIds = await this.getDormantTrailerIds();
      where.id = { in: dormantIds };
    } else if (status && status !== 'ALL') {
      where.status = status;
    }

    const validSortFields: Record<string, string> = {
      trailerNumber: 'trailerNumber', make: 'make', model: 'model',
      year: 'year', status: 'status', type: 'type',
    };
    const orderBy: any = validSortFields[sortBy]
      ? { [validSortFields[sortBy]]: sortOrder }
      : { trailerNumber: 'asc' };

    const [trailers, total] = await Promise.all([
      prisma.trailer.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, trailerNumber: true, type: true, make: true, model: true, year: true,
          status: true, samsaraId: true,
          longTermOutOfService: true, outOfServiceReason: true, expectedReturnDate: true,
          assignedTruck: { select: { id: true, truckNumber: true } },
        },
      }),
      prisma.trailer.count({ where }),
    ]);

    if (trailers.length === 0) {
      return { items: [], meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    const trailerIds = trailers.map((t) => t.id);
    const [lastLoads, activeLoads, locations] = await Promise.all([
      this.detector.getLastLoadsByTrailer(trailerIds),
      this.getActiveLoadsByTrailer(trailerIds),
      this.getSamsaraLocationsForPage(
        trailers.filter((t) => t.samsaraId).map((t) => ({ id: t.id, samsaraId: t.samsaraId! }))
      ),
    ]);

    const now = new Date();
    const items: TrailerInventoryItem[] = trailers.map((trailer) => {
      const lastLoad = lastLoads.get(trailer.id);
      const daysSince = lastLoad
        ? Math.round((now.getTime() - lastLoad.lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: trailer.id,
        trailerNumber: trailer.trailerNumber,
        type: trailer.type,
        make: trailer.make,
        model: trailer.model,
        year: trailer.year,
        status: trailer.status,
        assignedTruck: trailer.assignedTruck,
        activeLoad: activeLoads.get(trailer.id) ?? null,
        lastLoad: lastLoad ? { loadNumber: lastLoad.loadNumber, date: lastLoad.lastDate } : null,
        daysSinceLastLoad: daysSince,
        samsaraLocation: locations.get(trailer.id) ?? null,
        oosInfo: {
          longTermOutOfService: trailer.longTermOutOfService,
          reason: trailer.outOfServiceReason,
          expectedReturnDate: trailer.expectedReturnDate,
        },
      };
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private async getActiveLoadsByTruck(truckIds: string[]): Promise<Map<string, ActiveLoadInfo>> {
    const loads = await prisma.load.findMany({
      where: {
        truckId: { in: truckIds },
        status: { in: [...ACTIVE_LOAD_STATUSES] },
        deletedAt: null,
      },
      distinct: ['truckId'],
      orderBy: { pickupDate: 'asc' },
      select: {
        truckId: true, loadNumber: true, status: true,
        pickupState: true, deliveryState: true,
        pickupDate: true, deliveryDate: true,
      },
    });
    const map = new Map<string, ActiveLoadInfo>();
    for (const load of loads) {
      if (!load.truckId) continue;
      const lane = load.pickupState && load.deliveryState
        ? `${load.pickupState} → ${load.deliveryState}` : '—';
      map.set(load.truckId, {
        loadNumber: load.loadNumber, lane, status: load.status,
        pickupDate: load.pickupDate, deliveryDate: load.deliveryDate,
      });
    }
    return map;
  }

  private async getActiveLoadsByTrailer(trailerIds: string[]): Promise<Map<string, ActiveLoadInfo>> {
    const loads = await prisma.load.findMany({
      where: {
        trailerId: { in: trailerIds },
        status: { in: [...ACTIVE_LOAD_STATUSES] },
        deletedAt: null,
      },
      distinct: ['trailerId'],
      orderBy: { pickupDate: 'asc' },
      select: {
        trailerId: true, loadNumber: true, status: true,
        pickupState: true, deliveryState: true,
        pickupDate: true, deliveryDate: true,
      },
    });
    const map = new Map<string, ActiveLoadInfo>();
    for (const load of loads) {
      if (!load.trailerId) continue;
      const lane = load.pickupState && load.deliveryState
        ? `${load.pickupState} → ${load.deliveryState}` : '—';
      map.set(load.trailerId, {
        loadNumber: load.loadNumber, lane, status: load.status,
        pickupDate: load.pickupDate, deliveryDate: load.deliveryDate,
      });
    }
    return map;
  }

  private async getDormantTruckIds(): Promise<string[]> {
    const mgr = new FleetMonitoringManager(this.companyId);
    const settings = await mgr.getSettings();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - settings.dormantTruckDays);

    // Trucks that have had a recent load
    const recentTruckIds = await prisma.load.findMany({
      where: {
        companyId: this.companyId,
        truckId: { not: null },
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
        OR: [
          { deliveredAt: { gte: threshold } },
          { assignedAt: { gte: threshold } },
        ],
      },
      distinct: ['truckId'],
      select: { truckId: true },
    });
    const activeIds = new Set(recentTruckIds.map((l) => l.truckId!));

    const allTrucks = await prisma.truck.findMany({
      where: { companyId: this.companyId, isActive: true, deletedAt: null },
      select: { id: true },
    });

    return allTrucks.filter((t) => !activeIds.has(t.id)).map((t) => t.id);
  }

  private async getDormantTrailerIds(): Promise<string[]> {
    const mgr = new FleetMonitoringManager(this.companyId);
    const settings = await mgr.getSettings();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - settings.dormantTrailerDays);

    const recentTrailerIds = await prisma.load.findMany({
      where: {
        companyId: this.companyId,
        trailerId: { not: null },
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
        OR: [
          { deliveredAt: { gte: threshold } },
          { assignedAt: { gte: threshold } },
        ],
      },
      distinct: ['trailerId'],
      select: { trailerId: true },
    });
    const activeIds = new Set(recentTrailerIds.map((l) => l.trailerId!));

    const allTrailers = await prisma.trailer.findMany({
      where: { companyId: this.companyId, isActive: true, deletedAt: null },
      select: { id: true },
    });

    return allTrailers.filter((t) => !activeIds.has(t.id)).map((t) => t.id);
  }

  private async getSamsaraLocationsForPage(
    equipment: Array<{ id: string; samsaraId: string }>
  ): Promise<Map<string, { address: string; lat: number; lng: number }>> {
    const result = new Map<string, { address: string; lat: number; lng: number }>();
    if (equipment.length === 0) return result;

    const cacheKey = equipment.map((e) => e.samsaraId).sort().join(',');
    const cached = getCachedLocations(cacheKey);
    if (cached) return cached;

    try {
      const samsaraIds = equipment.map((e) => e.samsaraId);
      const locations = await getSamsaraVehicleLocations(samsaraIds, this.companyId);
      if (!locations) return result;

      const samsaraToId = new Map(equipment.map((e) => [e.samsaraId, e.id]));
      for (const loc of locations) {
        const eqId = samsaraToId.get(loc.vehicleId);
        if (!eqId || !loc.location) continue;
        const addr =
          (loc.location as any).reverseGeo?.formattedLocation ||
          (loc.location as any).address ||
          `${loc.location.latitude}, ${loc.location.longitude}`;
        result.set(eqId, {
          address: addr,
          lat: loc.location.latitude,
          lng: loc.location.longitude,
        });
      }

      setCachedLocations(cacheKey, result);
    } catch (error) {
      console.warn('[FleetInventory] Failed to fetch Samsara locations:', error);
    }

    return result;
  }
}
