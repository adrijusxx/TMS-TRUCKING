/**
 * DriverSafetyEventManager
 *
 * Fetches and summarizes Samsara safety events for drivers.
 * Links TMS driver records to Samsara via the driver's assigned truck samsaraId,
 * then queries the Samsara safety events API.
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/errors';
import { samsaraRequest } from '@/lib/integrations/samsara/client';

/** Samsara safety event as returned by their API */
interface SamsaraSafetyEvent {
  id?: string;
  time?: string;
  behaviorLabel?: string;
  severity?: string;
  maxSpeed?: number;
  speedLimitMph?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  vehicle?: {
    id?: string;
    name?: string;
  };
  driver?: {
    id?: string;
    name?: string;
  };
}

/** Normalized safety event for the TMS */
interface SafetyEvent {
  id: string;
  time: string;
  type: string;
  severity: string;
  maxSpeedMph: number | null;
  speedLimitMph: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  vehicleName: string | null;
}

interface SafetyEventSummary {
  driverId: string;
  driverName: string;
  totalEvents: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  recentEvents: SafetyEvent[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Determine risk level based on event count and severity distribution.
 */
function calculateRiskLevel(
  totalEvents: number,
  bySeverity: Record<string, number>
): 'low' | 'moderate' | 'high' | 'critical' {
  const critical = bySeverity['critical'] || bySeverity['severe'] || 0;
  const high = bySeverity['high'] || bySeverity['major'] || 0;

  if (critical >= 3 || totalEvents >= 20) return 'critical';
  if (critical >= 1 || high >= 5 || totalEvents >= 10) return 'high';
  if (high >= 2 || totalEvents >= 5) return 'moderate';
  return 'low';
}

/**
 * Normalize a Samsara safety event to our internal format.
 */
function normalizeSafetyEvent(event: SamsaraSafetyEvent): SafetyEvent {
  return {
    id: event.id || '',
    time: event.time || new Date().toISOString(),
    type: event.behaviorLabel || 'Unknown',
    severity: event.severity || 'unknown',
    maxSpeedMph: event.maxSpeed ?? null,
    speedLimitMph: event.speedLimitMph ?? null,
    location: event.location?.address || null,
    latitude: event.location?.latitude ?? null,
    longitude: event.location?.longitude ?? null,
    vehicleName: event.vehicle?.name || null,
  };
}

export class DriverSafetyEventManager {
  /**
   * Get recent safety events for a driver from Samsara.
   * Looks up the driver's current truck samsaraId, then queries Samsara.
   */
  static async getRecentSafetyEvents(
    driverId: string,
    days: number = 30
  ): Promise<SafetyEvent[]> {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        companyId: true,
        currentTruckId: true,
        currentTruck: {
          select: { samsaraId: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundError('Driver', driverId);
    }

    const samsaraVehicleId = driver.currentTruck?.samsaraId;
    if (!samsaraVehicleId) {
      logger.debug('No Samsara vehicle ID for driver, returning empty events', { driverId });
      return [];
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const result = await samsaraRequest<{
      data?: SamsaraSafetyEvent[];
    }>(
      `/fleet/vehicles/${samsaraVehicleId}/safety/events?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
      {},
      driver.companyId
    );

    // Fallback: try the fleet-wide safety events endpoint filtered by vehicle
    if (!result?.data) {
      const fallbackResult = await samsaraRequest<{
        data?: SamsaraSafetyEvent[];
      }>(
        `/fleet/vehicles/safety-events?vehicleIds=${samsaraVehicleId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
        {},
        driver.companyId
      );

      if (fallbackResult?.data) {
        return fallbackResult.data.map(normalizeSafetyEvent);
      }

      // Second fallback: try the safety/events endpoint
      const altResult = await samsaraRequest<{
        data?: SamsaraSafetyEvent[];
      }>(
        `/safety/events?vehicleIds=${samsaraVehicleId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
        {},
        driver.companyId
      );

      if (altResult?.data) {
        return altResult.data.map(normalizeSafetyEvent);
      }

      logger.debug('No safety events returned from Samsara', { driverId, samsaraVehicleId });
      return [];
    }

    const events = result.data.map(normalizeSafetyEvent);

    logger.debug('Safety events fetched', { driverId, count: events.length });
    return events;
  }

  /**
   * Get a summary of safety events for a driver, grouped by type and severity.
   */
  static async getSafetyEventSummary(
    driverId: string,
    days: number = 90
  ): Promise<SafetyEventSummary> {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        driverNumber: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!driver) {
      throw new NotFoundError('Driver', driverId);
    }

    const events = await DriverSafetyEventManager.getRecentSafetyEvents(driverId, days);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    }

    const firstName = driver.user?.firstName || '';
    const lastName = driver.user?.lastName || '';
    const driverName = `${firstName} ${lastName}`.trim() || 'Unknown';

    const riskLevel = calculateRiskLevel(events.length, bySeverity);

    logger.info('Safety event summary generated', {
      driverId,
      totalEvents: events.length,
      riskLevel,
    });

    return {
      driverId: driver.id,
      driverName,
      totalEvents: events.length,
      byType,
      bySeverity,
      recentEvents: events.slice(0, 20), // Return at most 20 recent events
      riskLevel,
    };
  }

  /**
   * Get safety events for a driver by breakdown context.
   * Used when logging a new breakdown case to show recent safety events
   * that may be relevant.
   */
  static async getEventsForBreakdownContext(
    driverId: string
  ): Promise<{
    events: SafetyEvent[];
    summary: { totalEvents: number; riskLevel: string; topEventTypes: string[] };
  }> {
    const events = await DriverSafetyEventManager.getRecentSafetyEvents(driverId, 7);

    const byType: Record<string, number> = {};
    for (const e of events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }

    const topEventTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    const bySeverity: Record<string, number> = {};
    for (const e of events) {
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    }

    return {
      events: events.slice(0, 10),
      summary: {
        totalEvents: events.length,
        riskLevel: calculateRiskLevel(events.length, bySeverity),
        topEventTypes,
      },
    };
  }
}
