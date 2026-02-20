import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara/fleet';
import type { IdleDriver } from './types';

/**
 * Calculates driver idle/home time by analyzing gaps between load deliveries
 * and next assignments, with optional Samsara GPS confirmation.
 */
export class DriverHomeTimeCalculator {
  constructor(private readonly companyId: string) {}

  async getIdleDrivers(mcNumberId?: string): Promise<IdleDriver[]> {
    const drivers = await this.getActiveDrivers(mcNumberId);
    if (drivers.length === 0) return [];

    const driverIds = drivers.map((d) => d.id);
    const [lastDeliveries, nextLoads] = await Promise.all([
      this.getLastDeliveredLoads(driverIds),
      this.getNextAssignedLoads(driverIds),
    ]);

    const now = new Date();
    const idleDrivers: IdleDriver[] = [];

    for (const driver of drivers) {
      const lastDelivery = lastDeliveries.get(driver.id);
      const nextLoad = nextLoads.get(driver.id);

      // Driver has a next load assigned — not idle
      if (nextLoad) continue;

      // No delivery history and no next load — idle since unknown
      const lastDeliveredAt = lastDelivery?.deliveredAt ?? null;
      const idleHours = lastDeliveredAt
        ? (now.getTime() - lastDeliveredAt.getTime()) / (1000 * 60 * 60)
        : 0;

      // Skip drivers who delivered very recently (< 4 hours)
      if (lastDeliveredAt && idleHours < 4) continue;

      idleDrivers.push({
        driverId: driver.id,
        driverNumber: driver.driverNumber,
        driverName: `${driver.user?.firstName || ''} ${driver.user?.lastName || ''}`.trim(),
        homeTerminal: driver.homeTerminal,
        lastDeliveredAt,
        lastLoadNumber: lastDelivery?.loadNumber ?? null,
        nextAssignedAt: null,
        nextLoadNumber: null,
        idleHours: Math.round(idleHours * 10) / 10,
        isAtHomeTerminal: null,
        currentLocation: null,
        status: driver.status,
      });
    }

    // Enrich with Samsara GPS data for drivers with linked trucks
    await this.enrichWithSamsaraLocation(idleDrivers, drivers);

    // Sort by idle hours descending
    idleDrivers.sort((a, b) => b.idleHours - a.idleHours);
    return idleDrivers;
  }

  private async getActiveDrivers(mcNumberId?: string) {
    const where: any = {
      companyId: this.companyId,
      employeeStatus: 'ACTIVE',
      deletedAt: null,
    };
    if (mcNumberId) where.mcNumberId = mcNumberId;

    return prisma.driver.findMany({
      where,
      select: {
        id: true,
        driverNumber: true,
        user: { select: { firstName: true, lastName: true } },
        homeTerminal: true,
        status: true,
        currentTruckId: true,
      },
    });
  }

  private async getLastDeliveredLoads(driverIds: string[]) {
    // Get the most recent delivered load per driver
    const loads = await prisma.load.findMany({
      where: {
        driverId: { in: driverIds },
        deliveredAt: { not: null },
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
      },
      orderBy: { deliveredAt: 'desc' },
      distinct: ['driverId'],
      select: {
        driverId: true,
        deliveredAt: true,
        loadNumber: true,
      },
    });

    const map = new Map<string, { deliveredAt: Date; loadNumber: string }>();
    for (const load of loads) {
      if (load.driverId && load.deliveredAt) {
        map.set(load.driverId, {
          deliveredAt: load.deliveredAt,
          loadNumber: load.loadNumber,
        });
      }
    }
    return map;
  }

  private async getNextAssignedLoads(driverIds: string[]) {
    const loads = await prisma.load.findMany({
      where: {
        driverId: { in: driverIds },
        status: { in: ['PENDING', 'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP'] },
        deletedAt: null,
      },
      orderBy: { assignedAt: 'asc' },
      distinct: ['driverId'],
      select: {
        driverId: true,
        assignedAt: true,
        loadNumber: true,
      },
    });

    const map = new Map<string, { assignedAt: Date | null; loadNumber: string }>();
    for (const load of loads) {
      if (load.driverId) {
        map.set(load.driverId, {
          assignedAt: load.assignedAt,
          loadNumber: load.loadNumber,
        });
      }
    }
    return map;
  }

  private async enrichWithSamsaraLocation(
    idleDrivers: IdleDriver[],
    allDrivers: Array<{ id: string; currentTruckId: string | null; homeTerminal: string | null }>
  ) {
    // Build map of driverId -> truck samsaraId
    const driverTruckMap = new Map<string, string>();
    const truckIdsNeeded: string[] = [];

    for (const driver of allDrivers) {
      if (driver.currentTruckId) {
        truckIdsNeeded.push(driver.currentTruckId);
        driverTruckMap.set(driver.id, driver.currentTruckId);
      }
    }

    if (truckIdsNeeded.length === 0) return;

    const trucks = await prisma.truck.findMany({
      where: { id: { in: truckIdsNeeded }, samsaraId: { not: null } },
      select: { id: true, samsaraId: true },
    });

    const truckSamsaraMap = new Map<string, string>();
    const samsaraIds: string[] = [];
    for (const truck of trucks) {
      if (truck.samsaraId) {
        truckSamsaraMap.set(truck.id, truck.samsaraId);
        samsaraIds.push(truck.samsaraId);
      }
    }

    if (samsaraIds.length === 0) return;

    try {
      const locations = await getSamsaraVehicleLocations(samsaraIds, this.companyId);
      if (!locations) return;

      const locationMap = new Map(locations.map((l) => [l.vehicleId, l.location]));

      for (const idleDriver of idleDrivers) {
        const truckId = driverTruckMap.get(idleDriver.driverId);
        if (!truckId) continue;

        const samsaraId = truckSamsaraMap.get(truckId);
        if (!samsaraId) continue;

        const location = locationMap.get(samsaraId);
        if (!location) continue;

        const address = location?.address || null;
        idleDriver.currentLocation = address;

        if (idleDriver.homeTerminal && address) {
          const homeNorm = idleDriver.homeTerminal.toLowerCase().trim();
          const addrNorm = address.toLowerCase();
          idleDriver.isAtHomeTerminal =
            addrNorm.includes(homeNorm) || homeNorm.includes(addrNorm.split(',')[0]);
        }
      }
    } catch (error) {
      console.warn('[FleetMonitoring] Failed to fetch Samsara locations:', error);
    }
  }
}
