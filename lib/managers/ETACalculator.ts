/**
 * ETACalculator
 *
 * Calculates estimated time of arrival using a tiered strategy to
 * minimize Google API costs:
 *   1. Samsara vehicle ETA (if available)
 *   2. Haversine distance / avg truck speed (55 mph default)
 *   3. Google Directions API as absolute last resort (cached aggressively)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/errors';
import {
  haversineDistance,
  estimateTravelTime,
  formatTravelTime,
} from '@/lib/utils/haversine';
import {
  GeocodingCacheManager,
  ApiCacheType,
} from '@/lib/managers/GeocodingCacheManager';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';

// ── Constants ────────────────────────────────────────────────────

const DEFAULT_TRUCK_SPEED_MPH = 55;
/** Road distance is typically ~1.3x straight-line Haversine distance */
const ROAD_FACTOR = 1.3;
/** Soft daily limit for Google API calls */
const GOOGLE_API_DAILY_LIMIT = 100;

// In-memory counter for the current process (resets on restart)
let googleApiCallsToday = 0;
let googleApiCounterDate = new Date().toDateString();

// ── Types ────────────────────────────────────────────────────────

export interface ETAResult {
  distanceMiles: number;
  durationMinutes: number;
  durationFormatted: string;
  etaTimestamp: string; // ISO string of the estimated arrival time
  source: 'samsara' | 'haversine' | 'google_cached' | 'google_live';
  confidence: 'high' | 'medium' | 'low';
}

export interface ETAInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

export interface BatchETAInput {
  id: string; // load ID or arbitrary identifier
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  truckSamsaraId?: string;
}

// ── Calculator ───────────────────────────────────────────────────

export class ETACalculator {
  /**
   * Calculate ETA between two points using tiered strategy.
   */
  static async calculateETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    options?: { companyId?: string; truckSamsaraId?: string }
  ): Promise<ETAResult> {
    this.validateCoordinates(originLat, originLng, destLat, destLng);

    // 1. Try Samsara ETA if truck is identified
    if (options?.truckSamsaraId && options?.companyId) {
      const samsaraResult = await this.trySamsaraETA(
        options.truckSamsaraId,
        destLat,
        destLng,
        options.companyId
      );
      if (samsaraResult) return samsaraResult;
    }

    // 2. Try cached Google Directions result
    const cachedResult = await this.tryCachedGoogle(
      originLat, originLng, destLat, destLng
    );
    if (cachedResult) return cachedResult;

    // 3. Haversine fallback (always available, no API cost)
    return this.calculateHaversineETA(
      originLat, originLng, destLat, destLng
    );
  }

  /**
   * Batch-calculate ETAs for multiple loads.
   * Uses cached distances and batches Google calls where needed.
   */
  static async batchCalculateETAs(
    loads: BatchETAInput[],
    companyId?: string
  ): Promise<Map<string, ETAResult>> {
    const results = new Map<string, ETAResult>();

    for (const load of loads) {
      try {
        const eta = await this.calculateETA(
          load.originLat,
          load.originLng,
          load.destLat,
          load.destLng,
          { companyId, truckSamsaraId: load.truckSamsaraId }
        );
        results.set(load.id, eta);
      } catch (error) {
        logger.warn('ETA calculation failed for load', {
          loadId: load.id,
          error: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    return results;
  }

  // ── Tier 1: Samsara ──────────────────────────────────────────

  private static async trySamsaraETA(
    samsaraId: string,
    destLat: number,
    destLng: number,
    companyId: string
  ): Promise<ETAResult | null> {
    try {
      const locations = await getSamsaraVehicleLocations(
        [samsaraId],
        companyId
      );
      if (!locations || locations.length === 0) return null;

      const loc = locations[0].location;
      if (!loc?.latitude || !loc?.longitude) return null;

      // Use Haversine from current Samsara position to destination
      const straightLine = haversineDistance(
        loc.latitude,
        loc.longitude,
        destLat,
        destLng
      );
      const roadDistance = straightLine * ROAD_FACTOR;

      // Use vehicle speed if available, else default
      const speed = loc.speedMilesPerHour && loc.speedMilesPerHour > 5
        ? loc.speedMilesPerHour
        : DEFAULT_TRUCK_SPEED_MPH;

      const durationMinutes = estimateTravelTime(roadDistance, speed);
      const etaTimestamp = new Date(
        Date.now() + durationMinutes * 60_000
      ).toISOString();

      return {
        distanceMiles: Math.round(roadDistance * 10) / 10,
        durationMinutes: Math.round(durationMinutes),
        durationFormatted: formatTravelTime(durationMinutes),
        etaTimestamp,
        source: 'samsara',
        confidence: 'medium',
      };
    } catch (error) {
      logger.debug('Samsara ETA unavailable', { samsaraId });
      return null;
    }
  }

  // ── Tier 2: Cached Google ────────────────────────────────────

  private static async tryCachedGoogle(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<ETAResult | null> {
    try {
      const cacheKey = GeocodingCacheManager.normalizeDistanceKey(
        [{ lat: originLat, lng: originLng }],
        [{ lat: destLat, lng: destLng }]
      );

      const cached = await GeocodingCacheManager.get<{
        distanceMeters: number;
        durationSeconds: number;
      }>(cacheKey, ApiCacheType.DISTANCE_MATRIX);

      if (!cached) return null;

      const distanceMiles = cached.distanceMeters / 1609.34;
      const durationMinutes = cached.durationSeconds / 60;
      const etaTimestamp = new Date(
        Date.now() + durationMinutes * 60_000
      ).toISOString();

      return {
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        durationMinutes: Math.round(durationMinutes),
        durationFormatted: formatTravelTime(durationMinutes),
        etaTimestamp,
        source: 'google_cached',
        confidence: 'high',
      };
    } catch {
      return null;
    }
  }

  // ── Tier 3: Haversine Fallback ───────────────────────────────

  private static calculateHaversineETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): ETAResult {
    const straightLine = haversineDistance(
      originLat, originLng, destLat, destLng
    );
    const roadDistance = straightLine * ROAD_FACTOR;
    const durationMinutes = estimateTravelTime(
      roadDistance,
      DEFAULT_TRUCK_SPEED_MPH
    );
    const etaTimestamp = new Date(
      Date.now() + durationMinutes * 60_000
    ).toISOString();

    return {
      distanceMiles: Math.round(roadDistance * 10) / 10,
      durationMinutes: Math.round(durationMinutes),
      durationFormatted: formatTravelTime(durationMinutes),
      etaTimestamp,
      source: 'haversine',
      confidence: 'low',
    };
  }

  // ── Google API Budget Guard ──────────────────────────────────

  /** Check whether we are within the daily Google API budget. */
  static isWithinGoogleBudget(): boolean {
    const today = new Date().toDateString();
    if (today !== googleApiCounterDate) {
      googleApiCallsToday = 0;
      googleApiCounterDate = today;
    }
    return googleApiCallsToday < GOOGLE_API_DAILY_LIMIT;
  }

  /** Increment the Google API counter (call after each live request). */
  static recordGoogleApiCall(): void {
    const today = new Date().toDateString();
    if (today !== googleApiCounterDate) {
      googleApiCallsToday = 0;
      googleApiCounterDate = today;
    }
    googleApiCallsToday++;
  }

  // ── Validation ───────────────────────────────────────────────

  private static validateCoordinates(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): void {
    const valid = (lat: number, lng: number) =>
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    if (!valid(lat1, lng1) || !valid(lat2, lng2)) {
      throw new ValidationError('Invalid coordinates provided');
    }
  }
}
