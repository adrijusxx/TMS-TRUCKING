/**
 * GeofenceAlertManager
 *
 * Manages geofence definitions, entry/exit detection, and automatic
 * status suggestions. Uses Haversine formula and Samsara vehicle data
 * to minimize Google API costs.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { ValidationError, NotFoundError } from '@/lib/errors';
import {
  haversineDistance,
  isWithinRadius,
} from '@/lib/utils/haversine';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';
import { getMattermostNotificationService } from '@/lib/services/MattermostNotificationService';

// ── Types ────────────────────────────────────────────────────────

export type GeofenceType =
  | 'PICKUP'
  | 'DELIVERY'
  | 'YARD'
  | 'CUSTOMER'
  | 'FUEL_STOP'
  | 'REST_AREA';

export interface CreateGeofenceInput {
  companyId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  type: GeofenceType;
  locationId?: string;
  notes?: string;
}

export interface GeofenceCheckResult {
  geofenceId: string;
  geofenceName: string;
  geofenceType: GeofenceType;
  distanceMiles: number;
  isInside: boolean;
}

export interface StatusSuggestion {
  suggestedStatus: string | null;
  geofenceType: GeofenceType;
  geofenceName: string;
  loadId?: string;
  autoApply: boolean;
}

export interface VehicleGeofenceEvent {
  truckId: string;
  samsaraId: string;
  latitude: number;
  longitude: number;
  entries: GeofenceCheckResult[];
  statusSuggestion: StatusSuggestion | null;
}

// ── Manager ──────────────────────────────────────────────────────

export class GeofenceAlertManager {
  /**
   * Create a new geofence definition.
   */
  static async createGeofence(input: CreateGeofenceInput) {
    if (!input.name?.trim()) {
      throw new ValidationError('Geofence name is required');
    }
    if (input.radiusMiles <= 0 || input.radiusMiles > 50) {
      throw new ValidationError(
        'Radius must be between 0 and 50 miles'
      );
    }
    if (
      input.latitude < -90 || input.latitude > 90 ||
      input.longitude < -180 || input.longitude > 180
    ) {
      throw new ValidationError('Invalid latitude/longitude values');
    }

    const geofence = await (prisma as any).geofence.create({
      data: {
        companyId: input.companyId,
        name: input.name.trim(),
        type: input.type,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMiles: input.radiusMiles,
        locationId: input.locationId,
        notes: input.notes,
      },
    });

    logger.info('Geofence created', {
      geofenceId: geofence.id,
      name: geofence.name,
      type: geofence.type,
    });
    return geofence;
  }

  /**
   * Get all active geofences for a company.
   */
  static async getActiveGeofences(companyId: string) {
    return (prisma as any).geofence.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Check whether a vehicle position falls inside any geofences.
   * Uses Haversine formula — no Google API calls.
   */
  static async checkGeofenceEntry(
    companyId: string,
    vehicleLat: number,
    vehicleLng: number
  ): Promise<GeofenceCheckResult[]> {
    const geofences = await this.getActiveGeofences(companyId);
    const results: GeofenceCheckResult[] = [];

    for (const gf of geofences) {
      const distance = haversineDistance(
        vehicleLat,
        vehicleLng,
        gf.latitude,
        gf.longitude
      );
      const inside = isWithinRadius(
        vehicleLat,
        vehicleLng,
        gf.latitude,
        gf.longitude,
        gf.radiusMiles
      );

      results.push({
        geofenceId: gf.id,
        geofenceName: gf.name,
        geofenceType: gf.type as GeofenceType,
        distanceMiles: Math.round(distance * 100) / 100,
        isInside: inside,
      });
    }

    return results;
  }

  /**
   * Suggest a load status update based on the geofence type.
   */
  static suggestStatusUpdate(
    geofenceType: GeofenceType,
    _loadId?: string
  ): StatusSuggestion {
    let suggestedStatus: string | null = null;
    let autoApply = false;

    switch (geofenceType) {
      case 'PICKUP':
        suggestedStatus = 'AT_PICKUP';
        autoApply = false; // let the driver confirm
        break;
      case 'DELIVERY':
        suggestedStatus = 'AT_DELIVERY';
        autoApply = false;
        break;
      default:
        // YARD, CUSTOMER, FUEL_STOP, REST_AREA — no status suggestion
        suggestedStatus = null;
        break;
    }

    return {
      suggestedStatus,
      geofenceType,
      geofenceName: '',
      loadId: _loadId,
      autoApply,
    };
  }

  /**
   * Batch-check all company vehicles against all geofences.
   * Uses Samsara for vehicle positions — NOT Google.
   */
  static async processVehicleLocations(
    companyId: string
  ): Promise<VehicleGeofenceEvent[]> {
    // 1. Get all trucks with samsaraId
    const trucks = await prisma.truck.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
        samsaraId: { not: null },
      },
      select: {
        id: true,
        samsaraId: true,
        truckNumber: true,
      },
    });

    if (trucks.length === 0) {
      logger.debug('No Samsara-linked trucks found', { companyId });
      return [];
    }

    // 2. Fetch live locations from Samsara
    const samsaraIds = trucks
      .map((t) => t.samsaraId)
      .filter(Boolean) as string[];
    const locations = await getSamsaraVehicleLocations(
      samsaraIds,
      companyId
    );

    if (!locations || locations.length === 0) {
      logger.debug('No Samsara locations returned', { companyId });
      return [];
    }

    // 3. Build lookup: samsaraId -> truck
    const truckBySamsaraId = new Map(
      trucks.map((t) => [t.samsaraId!, t])
    );

    // 4. Check every vehicle against all geofences
    const events: VehicleGeofenceEvent[] = [];

    for (const loc of locations) {
      const truck = truckBySamsaraId.get(loc.vehicleId);
      if (!truck || !loc.location) continue;

      const lat = loc.location.latitude;
      const lng = loc.location.longitude;
      if (lat == null || lng == null) continue;

      const checks = await this.checkGeofenceEntry(companyId, lat, lng);
      const entries = checks.filter((c) => c.isInside);

      if (entries.length === 0) continue;

      // Find associated load for status suggestion
      const activeLoad = await this.findActiveLoadForTruck(truck.id);

      // Build status suggestion from the first matching geofence
      const firstEntry = entries[0];
      const suggestion = this.suggestStatusUpdate(
        firstEntry.geofenceType,
        activeLoad?.id
      );
      suggestion.geofenceName = firstEntry.geofenceName;

      // Persist alert records
      await this.recordAlerts(
        companyId,
        truck.id,
        activeLoad?.id,
        activeLoad?.driverId,
        lat,
        lng,
        entries,
        suggestion
      );

      events.push({
        truckId: truck.id,
        samsaraId: loc.vehicleId,
        latitude: lat,
        longitude: lng,
        entries,
        statusSuggestion: suggestion.suggestedStatus
          ? suggestion
          : null,
      });

      // Post to Mattermost #dispatch channel
      const loadForNotify = activeLoad
        ? await prisma.load.findUnique({ where: { id: activeLoad.id }, select: { loadNumber: true } })
        : null;
      await getMattermostNotificationService().notifyGeofenceArrival({
        truckNumber: truck.truckNumber,
        geofenceName: firstEntry.geofenceName,
        geofenceType: firstEntry.geofenceType,
        loadNumber: loadForNotify?.loadNumber,
      });
    }

    logger.info('Geofence batch check complete', {
      companyId,
      vehiclesChecked: locations.length,
      eventsGenerated: events.length,
    });

    return events;
  }

  /**
   * Find the active in-transit load for a given truck.
   */
  private static async findActiveLoadForTruck(truckId: string) {
    return prisma.load.findFirst({
      where: {
        truckId,
        status: {
          in: [
            'EN_ROUTE_PICKUP',
            'AT_PICKUP',
            'LOADED',
            'EN_ROUTE_DELIVERY',
          ],
        },
      },
      select: { id: true, driverId: true, status: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Persist geofence alert records to the database.
   */
  private static async recordAlerts(
    companyId: string,
    truckId: string,
    loadId: string | undefined,
    driverId: string | null | undefined,
    lat: number,
    lng: number,
    entries: GeofenceCheckResult[],
    suggestion: StatusSuggestion
  ): Promise<void> {
    const alertData = entries.map((entry) => ({
      companyId,
      geofenceId: entry.geofenceId,
      truckId,
      loadId: loadId ?? null,
      driverId: driverId ?? null,
      eventType: 'ENTRY',
      latitude: lat,
      longitude: lng,
      distanceMiles: entry.distanceMiles,
      suggestedStatus: suggestion.suggestedStatus,
      statusApplied: false,
    }));

    await (prisma as any).geofenceAlert.createMany({ data: alertData });
  }

  /**
   * Soft-delete a geofence.
   */
  static async deleteGeofence(geofenceId: string, companyId: string) {
    const geofence = await (prisma as any).geofence.findFirst({
      where: { id: geofenceId, companyId },
    });

    if (!geofence) {
      throw new NotFoundError('Geofence', geofenceId);
    }

    await (prisma as any).geofence.update({
      where: { id: geofenceId },
      data: { deletedAt: new Date(), isActive: false },
    });

    logger.info('Geofence deleted', { geofenceId });
  }
}
