/**
 * Haversine Distance Utilities
 *
 * Provides distance calculations between geographic coordinates using the
 * Haversine formula. Used throughout the app to minimize Google API costs
 * by performing distance checks locally.
 */

const EARTH_RADIUS_MILES = 3958.8;
const DEFAULT_TRUCK_SPEED_MPH = 55;

/** Convert degrees to radians */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the great-circle distance between two points using Haversine formula.
 * @returns Distance in miles
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Check whether a point is within a given radius of a center point.
 * @returns true if the point is within radiusMiles of the center
 */
export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMiles: number
): boolean {
  return haversineDistance(lat1, lng1, lat2, lng2) <= radiusMiles;
}

/**
 * Estimate travel time between two points at a given average speed.
 * @param distanceMiles - Distance in miles
 * @param avgSpeedMph - Average speed in mph (default: 55 for trucks)
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTime(
  distanceMiles: number,
  avgSpeedMph: number = DEFAULT_TRUCK_SPEED_MPH
): number {
  if (avgSpeedMph <= 0) return 0;
  return (distanceMiles / avgSpeedMph) * 60;
}

/**
 * Estimate travel time between two coordinate pairs.
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTimeBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  avgSpeedMph: number = DEFAULT_TRUCK_SPEED_MPH
): number {
  const distance = haversineDistance(lat1, lng1, lat2, lng2);
  return estimateTravelTime(distance, avgSpeedMph);
}

/**
 * Build a distance matrix for an array of coordinate pairs using Haversine.
 * Returns a 2D array where matrix[i][j] is the distance in miles from point i to point j.
 */
export function buildDistanceMatrix(
  points: Array<{ lat: number; lng: number }>
): number[][] {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineDistance(
        points[i].lat,
        points[i].lng,
        points[j].lat,
        points[j].lng
      );
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }

  return matrix;
}

/**
 * Format a travel time in minutes into a human-readable string.
 * e.g. 125 -> "2h 5m"
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 1) return '< 1m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
