import { prisma } from '@/lib/prisma';
import { getSamsaraTrips } from '@/lib/integrations/samsara/telematics';
import type { DormantEquipment, FleetMonitoringSettings } from './types';

const OOS_TRUCK_STATUSES = ['OUT_OF_SERVICE', 'MAINTENANCE', 'NEEDS_REPAIR'] as const;
const OOS_TRAILER_STATUSES = ['OUT_OF_SERVICE', 'MAINTENANCE', 'NEEDS_REPAIR'] as const;

/**
 * Detects dormant trucks and trailers by checking load assignment gaps
 * combined with Samsara trip data to confirm no movement.
 */
export class DormantEquipmentDetector {
  constructor(private readonly companyId: string) {}

  async detectDormantTrucks(
    settings: FleetMonitoringSettings,
    mcNumberId?: string
  ): Promise<{ dormant: DormantEquipment[]; excludedCount: number }> {
    const where: any = {
      companyId: this.companyId,
      isActive: true,
      deletedAt: null,
    };
    if (mcNumberId) where.mcNumberId = mcNumberId;

    const trucks = await prisma.truck.findMany({
      where,
      select: {
        id: true,
        truckNumber: true,
        status: true,
        samsaraId: true,
        longTermOutOfService: true,
        outOfServiceReason: true,
        expectedReturnDate: true,
      },
    });

    // Separate OOS trucks from candidates
    const oosStatuses = new Set<string>(OOS_TRUCK_STATUSES);
    const candidates = trucks.filter(
      (t) => !oosStatuses.has(t.status) && !t.longTermOutOfService
    );
    const excludedCount = trucks.length - candidates.length;

    if (candidates.length === 0) return { dormant: [], excludedCount };

    const lastLoads = await this.getLastLoadsByTruck(candidates.map((t) => t.id));
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - settings.dormantTruckDays);
    const now = new Date();

    // Find trucks with no recent loads
    const potentiallyDormant = candidates.filter((truck) => {
      const lastLoad = lastLoads.get(truck.id);
      if (!lastLoad) return true; // Never had a load
      return lastLoad.lastDate < threshold;
    });

    // Check Samsara movement for potentially dormant trucks
    const samsaraMovement = await this.checkSamsaraMovement(
      potentiallyDormant.filter((t) => t.samsaraId).map((t) => ({
        id: t.id,
        samsaraId: t.samsaraId!,
      })),
      settings.dormantTruckDays
    );

    const dormant: DormantEquipment[] = [];
    for (const truck of potentiallyDormant) {
      const lastLoad = lastLoads.get(truck.id);
      const daysSince = lastLoad
        ? (now.getTime() - lastLoad.lastDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      // If truck has Samsara and shows movement, skip it
      const movement = truck.samsaraId ? samsaraMovement.get(truck.id) : null;
      if (movement?.hasMovement) continue;

      dormant.push({
        id: truck.id,
        number: truck.truckNumber,
        type: 'TRUCK',
        status: truck.status,
        lastActiveLoadDate: lastLoad?.lastDate ?? null,
        lastActiveLoadNumber: lastLoad?.loadNumber ?? null,
        daysSinceLastLoad: Math.round(daysSince),
        hasSamsaraMovement: movement?.hasMovement ?? null,
        lastSamsaraTrip: movement?.lastTripDate ?? null,
        isLongTermOOS: false,
        outOfServiceReason: null,
        expectedReturnDate: null,
      });
    }

    dormant.sort((a, b) => b.daysSinceLastLoad - a.daysSinceLastLoad);
    return { dormant, excludedCount };
  }

  async detectDormantTrailers(
    settings: FleetMonitoringSettings,
    mcNumberId?: string
  ): Promise<{ dormant: DormantEquipment[]; excludedCount: number }> {
    const where: any = {
      companyId: this.companyId,
      isActive: true,
      deletedAt: null,
    };
    if (mcNumberId) where.mcNumberId = mcNumberId;

    const trailers = await prisma.trailer.findMany({
      where,
      select: {
        id: true,
        trailerNumber: true,
        status: true,
        samsaraId: true,
        longTermOutOfService: true,
        outOfServiceReason: true,
        expectedReturnDate: true,
      },
    });

    const oosStatuses = new Set<string>(OOS_TRAILER_STATUSES);
    const candidates = trailers.filter(
      (t) => !oosStatuses.has(t.status) && !t.longTermOutOfService
    );
    const excludedCount = trailers.length - candidates.length;

    if (candidates.length === 0) return { dormant: [], excludedCount };

    const lastLoads = await this.getLastLoadsByTrailer(candidates.map((t) => t.id));
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - settings.dormantTrailerDays);
    const now = new Date();

    const potentiallyDormant = candidates.filter((trailer) => {
      const lastLoad = lastLoads.get(trailer.id);
      if (!lastLoad) return true;
      return lastLoad.lastDate < threshold;
    });

    // Check Samsara movement for trailers with samsaraId
    const samsaraMovement = await this.checkSamsaraMovement(
      potentiallyDormant.filter((t) => t.samsaraId).map((t) => ({
        id: t.id,
        samsaraId: t.samsaraId!,
      })),
      settings.dormantTrailerDays
    );

    const dormant: DormantEquipment[] = [];
    for (const trailer of potentiallyDormant) {
      const lastLoad = lastLoads.get(trailer.id);
      const daysSince = lastLoad
        ? (now.getTime() - lastLoad.lastDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      const movement = trailer.samsaraId ? samsaraMovement.get(trailer.id) : null;
      if (movement?.hasMovement) continue;

      dormant.push({
        id: trailer.id,
        number: trailer.trailerNumber,
        type: 'TRAILER',
        status: trailer.status,
        lastActiveLoadDate: lastLoad?.lastDate ?? null,
        lastActiveLoadNumber: lastLoad?.loadNumber ?? null,
        daysSinceLastLoad: Math.round(daysSince),
        hasSamsaraMovement: movement?.hasMovement ?? null,
        lastSamsaraTrip: movement?.lastTripDate ?? null,
        isLongTermOOS: false,
        outOfServiceReason: null,
        expectedReturnDate: null,
      });
    }

    dormant.sort((a, b) => b.daysSinceLastLoad - a.daysSinceLastLoad);
    return { dormant, excludedCount };
  }

  async getLastLoadsByTruck(truckIds: string[]) {
    const loads = await prisma.load.findMany({
      where: {
        truckId: { in: truckIds },
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
      },
      orderBy: { deliveredAt: 'desc' },
      distinct: ['truckId'],
      select: { truckId: true, deliveredAt: true, assignedAt: true, loadNumber: true },
    });

    const map = new Map<string, { lastDate: Date; loadNumber: string }>();
    for (const load of loads) {
      if (!load.truckId) continue;
      const lastDate = load.deliveredAt || load.assignedAt;
      if (lastDate) map.set(load.truckId, { lastDate, loadNumber: load.loadNumber });
    }
    return map;
  }

  async getLastLoadsByTrailer(trailerIds: string[]) {
    const loads = await prisma.load.findMany({
      where: {
        trailerId: { in: trailerIds },
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
      },
      orderBy: { deliveredAt: 'desc' },
      distinct: ['trailerId'],
      select: { trailerId: true, deliveredAt: true, assignedAt: true, loadNumber: true },
    });

    const map = new Map<string, { lastDate: Date; loadNumber: string }>();
    for (const load of loads) {
      if (!load.trailerId) continue;
      const lastDate = load.deliveredAt || load.assignedAt;
      if (lastDate) map.set(load.trailerId, { lastDate, loadNumber: load.loadNumber });
    }
    return map;
  }

  private async checkSamsaraMovement(
    equipment: Array<{ id: string; samsaraId: string }>,
    thresholdDays: number
  ): Promise<Map<string, { hasMovement: boolean; lastTripDate: Date | null }>> {
    const result = new Map<string, { hasMovement: boolean; lastTripDate: Date | null }>();
    if (equipment.length === 0) return result;

    const startTime = new Date();
    startTime.setDate(startTime.getDate() - thresholdDays);

    try {
      const samsaraIds = equipment.map((e) => e.samsaraId);
      const trips = await getSamsaraTrips(samsaraIds, undefined, this.companyId, {
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
      });

      // Build samsaraId -> equipment.id mapping
      const samsaraToId = new Map(equipment.map((e) => [e.samsaraId, e.id]));

      // Default all to no movement
      for (const eq of equipment) {
        result.set(eq.id, { hasMovement: false, lastTripDate: null });
      }

      if (trips) {
        for (const trip of trips) {
          const vehicleSamsaraId = trip.vehicleId;
          if (!vehicleSamsaraId) continue;

          const equipmentId = samsaraToId.get(vehicleSamsaraId);
          if (!equipmentId) continue;

          const existing = result.get(equipmentId);
          const tripEnd = trip.endLocation?.time ? new Date(trip.endLocation.time) : null;

          result.set(equipmentId, {
            hasMovement: true,
            lastTripDate:
              tripEnd && (!existing?.lastTripDate || tripEnd > existing.lastTripDate)
                ? tripEnd
                : existing?.lastTripDate ?? null,
          });
        }
      }
    } catch (error) {
      console.warn('[FleetMonitoring] Failed to fetch Samsara trips:', error);
    }

    return result;
  }
}
