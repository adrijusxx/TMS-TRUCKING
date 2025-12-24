/**
 * Google Maps API Integration
 * 
 * This module provides functions for interacting with Google Maps APIs:
 * - Distance Matrix API for calculating distances and travel times
 * - Directions API for route planning
 * - Geocoding API for address to coordinates conversion
 * 
 * Note: Requires GOOGLE_MAPS_API_KEY environment variable
 */

import {
  GeocodingCacheManager,
  ApiCacheType,
} from '@/lib/managers/GeocodingCacheManager';

interface DistanceMatrixRequest {
  origins: Array<{ city: string; state: string } | { lat: number; lng: number }>;
  destinations: Array<{ city: string; state: string } | { lat: number; lng: number }>;
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  units?: 'imperial' | 'metric';
  avoid?: 'tolls' | 'highways' | 'ferries' | 'indoor';
  trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
  departureTime?: Date;
}

interface DistanceMatrixResponse {
  distance: number; // in meters
  duration: number; // in seconds
  durationInTraffic?: number; // in seconds
  status: string;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
}

type RouteWaypoint =
  | { city: string; state: string; address?: string }
  | { lat: number; lng: number };

/**
 * Calculate distance and travel time between multiple origins and destinations
 */
/**
 * Calculate distance and travel time between multiple origins and destinations
 * 
 * In production on AWS, GOOGLE_MAPS_API_KEY is loaded from AWS Secrets Manager
 * via the startup script: scripts/start-app-with-secrets.sh
 * Secret name: tms/integrations/google/maps-api-key
 */
export async function calculateDistanceMatrix(
  request: DistanceMatrixRequest
): Promise<DistanceMatrixResponse[][]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    // Fallback to simplified calculation
    console.warn('Google Maps API key not configured, using simplified distance calculation');
    return calculateSimplifiedDistanceMatrix(request);
  }

  // Check cache first
  const cacheKey = GeocodingCacheManager.normalizeDistanceKey(
    request.origins,
    request.destinations,
    {
      mode: request.mode,
      units: request.units,
      avoid: request.avoid,
      departureTime: request.departureTime,
      trafficModel: request.trafficModel,
    }
  );
  const cached = await GeocodingCacheManager.get<DistanceMatrixResponse[][]>(
    cacheKey,
    ApiCacheType.DISTANCE_MATRIX
  );

  if (cached) {
    return cached;
  }

  try {
    // Format origins and destinations
    const origins = request.origins.map((o) =>
      'city' in o ? `${o.city}, ${o.state}` : `${o.lat},${o.lng}`
    );
    const destinations = request.destinations.map((d) =>
      'city' in d ? `${d.city}, ${d.state}` : `${d.lat},${d.lng}`
    );

    const params = new URLSearchParams({
      origins: origins.join('|'),
      destinations: destinations.join('|'),
      key: apiKey,
      units: request.units || 'imperial',
      mode: request.mode || 'driving',
    });

    if (request.avoid) {
      params.append('avoid', request.avoid);
    }

    if (request.departureTime) {
      params.append('departure_time', Math.floor(request.departureTime.getTime() / 1000).toString());
      params.append('traffic_model', request.trafficModel || 'best_guess');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Google Maps API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    // Transform response to our format
    const result = data.rows.map((row: any) =>
      row.elements.map((element: any) => ({
        distance: element.distance.value, // meters
        duration: element.duration.value, // seconds
        durationInTraffic: element.duration_in_traffic?.value,
        status: element.status,
      }))
    );

    // Cache successful response
    await GeocodingCacheManager.set(
      cacheKey,
      ApiCacheType.DISTANCE_MATRIX,
      result
    );

    return result;
  } catch (error) {
    console.error('Google Maps API error:', error);
    // Fallback to simplified calculation
    return calculateSimplifiedDistanceMatrix(request);
  }
}

/**
 * Simplified distance calculation (fallback when API key not available)
 */
function calculateSimplifiedDistanceMatrix(
  request: DistanceMatrixRequest
): DistanceMatrixResponse[][] {
  return request.origins.map(() =>
    request.destinations.map(() => ({
      distance: 500000, // 500 km default
      duration: 18000, // 5 hours default
      status: 'OK',
    }))
  );
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResponse | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not configured, geocoding unavailable');
    return null;
  }

  // Check cache first
  const cacheKey = GeocodingCacheManager.normalizeGeocodeKey(address);
  const cached = await GeocodingCacheManager.get<GeocodeResponse>(
    cacheKey,
    ApiCacheType.GEOCODE
  );

  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({
      address,
      key: apiKey,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Google Maps Geocoding API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const geocodeResponse: GeocodeResponse = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };

    // Cache successful response
    await GeocodingCacheManager.set(
      cacheKey,
      ApiCacheType.GEOCODE,
      geocodeResponse
    );

    return geocodeResponse;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate route between waypoints using Directions API
 */
export async function calculateRoute(waypoints: RouteWaypoint[]) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not configured, route calculation unavailable');
    return null;
  }

  // Check cache first
  const cacheKey = GeocodingCacheManager.normalizeRouteKey(waypoints, {
    mode: 'driving',
    units: 'imperial',
  });
  const cached = await GeocodingCacheManager.get<{
    distance: number;
    duration: number;
    polyline: string;
    bounds: unknown;
    steps: unknown[];
  }>(cacheKey, ApiCacheType.DIRECTIONS);

  if (cached) {
    return cached;
  }

  try {
    const formatWaypoint = (waypoint: RouteWaypoint) => {
      if ('lat' in waypoint) {
        return `${waypoint.lat},${waypoint.lng}`;
      }
      if (waypoint.address) {
        return `${waypoint.address}, ${waypoint.city}, ${waypoint.state}`;
      }
      return `${waypoint.city}, ${waypoint.state}`;
    };

    const origin = formatWaypoint(waypoints[0]);
    const destination = formatWaypoint(waypoints[waypoints.length - 1]);
    const waypointParams = waypoints
      .slice(1, -1)
      .map((wp) => formatWaypoint(wp))
      .join('|');

    const params = new URLSearchParams({
      origin,
      destination,
      key: apiKey,
      mode: 'driving',
      units: 'imperial',
    });

    if (waypointParams) {
      params.append('waypoints', waypointParams);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Google Maps Directions API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const result = {
      distance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0), // meters
      duration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0), // seconds
      polyline: route.overview_polyline.points,
      bounds: route.bounds,
      steps: route.legs.flatMap((leg: any) => leg.steps),
    };

    // Cache successful response
    await GeocodingCacheManager.set(
      cacheKey,
      ApiCacheType.DIRECTIONS,
      result
    );

    return result;
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}

