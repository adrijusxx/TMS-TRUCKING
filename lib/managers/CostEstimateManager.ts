/**
 * CostEstimateManager
 *
 * Estimates trip costs (fuel + tolls) for dispatch assignment previews.
 * Uses Haversine distance when actual miles are not available.
 */

import { logger } from '@/lib/utils/logger';

// Default cost assumptions (national averages, easily overridable)
const DEFAULT_FUEL_PRICE_PER_GALLON = 3.85; // $/gallon (USDOE avg)
const DEFAULT_MPG = 6.5; // avg for Class 8 trucks
const DEFAULT_TOLL_RATE_PER_MILE = 0.12; // $/mile rough national avg
const EARTH_RADIUS_MILES = 3958.8;

export interface TripCostEstimate {
  distanceMiles: number;
  fuelCostEstimate: number;
  tollEstimate: number;
  totalEstimate: number;
  fuelGallonsEstimate: number;
  breakdown: {
    fuelPricePerGallon: number;
    mpg: number;
    tollRatePerMile: number;
  };
}

export interface CostEstimateOptions {
  fuelPricePerGallon?: number;
  mpg?: number;
  tollRatePerMile?: number;
}

/**
 * Haversine formula: calculate great-circle distance between two points.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

/**
 * Rough lat/lng lookup for US state capitals (fallback when geocoding unavailable).
 * Used only on the server side for quick estimates.
 */
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.3182, lng: -86.9023 }, AK: { lat: 64.2008, lng: -152.4937 },
  AZ: { lat: 34.0489, lng: -111.0937 }, AR: { lat: 35.2010, lng: -91.8318 },
  CA: { lat: 36.7783, lng: -119.4179 }, CO: { lat: 39.5501, lng: -105.7821 },
  CT: { lat: 41.6032, lng: -73.0877 }, DE: { lat: 38.9108, lng: -75.5277 },
  FL: { lat: 27.6648, lng: -81.5158 }, GA: { lat: 32.1656, lng: -83.5085 },
  HI: { lat: 19.8968, lng: -155.5828 }, ID: { lat: 44.0682, lng: -114.7420 },
  IL: { lat: 40.6331, lng: -89.3985 }, IN: { lat: 40.2672, lng: -86.1349 },
  IA: { lat: 41.8780, lng: -93.0977 }, KS: { lat: 39.0119, lng: -98.4842 },
  KY: { lat: 37.8393, lng: -84.2700 }, LA: { lat: 30.9843, lng: -91.9623 },
  ME: { lat: 45.2538, lng: -69.4455 }, MD: { lat: 39.0458, lng: -76.6413 },
  MA: { lat: 42.4072, lng: -71.3824 }, MI: { lat: 44.3148, lng: -85.6024 },
  MN: { lat: 46.7296, lng: -94.6859 }, MS: { lat: 32.3547, lng: -89.3985 },
  MO: { lat: 37.9643, lng: -91.8318 }, MT: { lat: 46.8797, lng: -110.3626 },
  NE: { lat: 41.4925, lng: -99.9018 }, NV: { lat: 38.8026, lng: -116.4194 },
  NH: { lat: 43.1939, lng: -71.5724 }, NJ: { lat: 40.0583, lng: -74.4057 },
  NM: { lat: 34.5199, lng: -105.8701 }, NY: { lat: 40.7128, lng: -74.0060 },
  NC: { lat: 35.7596, lng: -79.0193 }, ND: { lat: 47.5515, lng: -101.0020 },
  OH: { lat: 40.4173, lng: -82.9071 }, OK: { lat: 35.4676, lng: -97.5164 },
  OR: { lat: 43.8041, lng: -120.5542 }, PA: { lat: 41.2033, lng: -77.1945 },
  RI: { lat: 41.5801, lng: -71.4774 }, SC: { lat: 33.8361, lng: -81.1637 },
  SD: { lat: 43.9695, lng: -99.9018 }, TN: { lat: 35.5175, lng: -86.5804 },
  TX: { lat: 31.9686, lng: -99.9018 }, UT: { lat: 39.3210, lng: -111.0937 },
  VT: { lat: 44.5588, lng: -72.5778 }, VA: { lat: 37.4316, lng: -78.6569 },
  WA: { lat: 47.7511, lng: -120.7401 }, WV: { lat: 38.5976, lng: -80.4549 },
  WI: { lat: 43.7844, lng: -88.7879 }, WY: { lat: 43.0760, lng: -107.2903 },
  DC: { lat: 38.9072, lng: -77.0369 },
};

export class CostEstimateManager {
  /**
   * Estimate trip cost given origin, destination, and optional known miles.
   */
  static estimateTripCost(
    originState: string,
    destinationState: string,
    knownMiles?: number | null,
    options?: CostEstimateOptions
  ): TripCostEstimate {
    const fuelPrice = options?.fuelPricePerGallon ?? DEFAULT_FUEL_PRICE_PER_GALLON;
    const mpg = options?.mpg ?? DEFAULT_MPG;
    const tollRate = options?.tollRatePerMile ?? DEFAULT_TOLL_RATE_PER_MILE;

    let distanceMiles = knownMiles ?? 0;

    // Use Haversine if no actual miles provided
    if (!distanceMiles || distanceMiles <= 0) {
      const origin = STATE_COORDS[originState?.toUpperCase()];
      const dest = STATE_COORDS[destinationState?.toUpperCase()];

      if (origin && dest) {
        // Haversine gives straight-line; multiply by 1.3 for road-distance approximation
        distanceMiles = Math.round(
          haversineDistance(origin.lat, origin.lng, dest.lat, dest.lng) * 1.3
        );
      } else {
        logger.warn('[CostEstimateManager] Could not resolve state coords', {
          originState,
          destinationState,
        });
        distanceMiles = 0;
      }
    }

    const fuelGallons = distanceMiles / mpg;
    const fuelCost = fuelGallons * fuelPrice;
    const tollCost = distanceMiles * tollRate;

    return {
      distanceMiles: Math.round(distanceMiles),
      fuelCostEstimate: Math.round(fuelCost * 100) / 100,
      tollEstimate: Math.round(tollCost * 100) / 100,
      totalEstimate: Math.round((fuelCost + tollCost) * 100) / 100,
      fuelGallonsEstimate: Math.round(fuelGallons * 10) / 10,
      breakdown: {
        fuelPricePerGallon: fuelPrice,
        mpg,
        tollRatePerMile: tollRate,
      },
    };
  }

  /**
   * Estimate cost using lat/lng coordinates directly.
   */
  static estimateFromCoordinates(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    options?: CostEstimateOptions
  ): TripCostEstimate {
    const straightLine = haversineDistance(originLat, originLng, destLat, destLng);
    const roadMiles = Math.round(straightLine * 1.3);
    return CostEstimateManager.estimateTripCost('', '', roadMiles, options);
  }
}
