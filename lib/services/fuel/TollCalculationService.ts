/**
 * Toll Calculation Service
 *
 * Uses Google Routes API v2 to calculate toll costs for a route.
 * Supports truck-specific toll estimation via vehicle emission type.
 *
 * API: POST https://routes.googleapis.com/directions/v2:computeRoutes
 * Docs: https://developers.google.com/maps/documentation/routes/toll-estimation
 */

import {
  GeocodingCacheManager,
  ApiCacheType,
} from '@/lib/managers/GeocodingCacheManager';
import type { TollEstimate } from './FuelStationProvider';

const TOLL_CACHE_TTL_DAYS = 7;

interface RoutesApiTollInfo {
  estimatedPrice?: Array<{
    currencyCode: string;
    units: string;
    nanos?: number;
  }>;
}

interface RoutesApiRoute {
  distanceMeters?: number;
  duration?: string;
  travelAdvisory?: {
    tollInfo?: RoutesApiTollInfo;
  };
}

export class TollCalculationService {
  async calculateTolls(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints?: Array<{ lat: number; lng: number }>
  ): Promise<TollEstimate | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured, toll calculation unavailable');
      return null;
    }

    const cacheKey = GeocodingCacheManager.normalizeTollKey(origin, destination);
    const cached = await GeocodingCacheManager.get<TollEstimate>(
      cacheKey,
      ApiCacheType.DIRECTIONS
    );
    if (cached) return cached;

    try {
      const body: Record<string, unknown> = {
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        travelMode: 'DRIVE',
        routeModifiers: {
          vehicleInfo: { emissionType: 'DIESEL' },
        },
        extraComputations: ['TOLLS'],
      };

      if (waypoints && waypoints.length > 0) {
        body.intermediates = waypoints.map((wp) => ({
          location: {
            latLng: { latitude: wp.lat, longitude: wp.lng },
          },
        }));
      }

      const response = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.travelAdvisory.tollInfo,routes.distanceMeters,routes.duration',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        console.error('Google Routes API error:', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const route: RoutesApiRoute = data.routes?.[0];
      if (!route) return null;

      const estimate = this.parseTollEstimate(route);

      if (estimate) {
        await GeocodingCacheManager.set(
          cacheKey,
          ApiCacheType.DIRECTIONS,
          estimate,
          { ttlDays: TOLL_CACHE_TTL_DAYS }
        );
      }

      return estimate;
    } catch (error) {
      console.error('Toll calculation error:', error);
      return null;
    }
  }

  private parseTollEstimate(route: RoutesApiRoute): TollEstimate | null {
    const tollInfo = route.travelAdvisory?.tollInfo;

    let totalTollCost = 0;
    let currency = 'USD';
    const tollSegments: TollEstimate['tollSegments'] = [];

    if (tollInfo?.estimatedPrice) {
      for (const price of tollInfo.estimatedPrice) {
        const amount =
          parseFloat(price.units || '0') + (price.nanos || 0) / 1_000_000_000;
        totalTollCost += amount;
        currency = price.currencyCode || 'USD';
        tollSegments.push({ estimatedPrice: amount });
      }
    }

    const durationStr = route.duration || '0s';
    const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 0;

    return {
      totalTollCost,
      currency,
      tollSegments,
      routeDistanceMeters: route.distanceMeters || 0,
      routeDurationSeconds: durationSeconds,
    };
  }
}
