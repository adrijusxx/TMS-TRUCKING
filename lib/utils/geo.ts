/**
 * Shared geographic utility functions
 *
 * Haversine distance calculations for GPS coordinates.
 * Used by LoadLocationTrackingService, ETA calculator, and tracking endpoints.
 */

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Core haversine formula — returns distance in the unit determined by Earth radius
 */
function haversineCore(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  earthRadius: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

/**
 * Calculate distance between two GPS coordinates in miles
 */
export function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  return haversineCore(lat1, lng1, lat2, lng2, 3959); // Earth radius in miles
}

/**
 * Calculate distance between two GPS coordinates in kilometers
 */
export function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  return haversineCore(lat1, lng1, lat2, lng2, 6371); // Earth radius in km
}
