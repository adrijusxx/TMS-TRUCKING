/**
 * Fuel Suggestion Manager
 *
 * Orchestrates fuel station discovery along a load's route.
 * Decodes the route polyline, samples points at intervals,
 * searches for fuel stations near each sample, deduplicates,
 * and generates smart suggestions based on price + driver position + fuel level.
 */

import { prisma } from '@/lib/prisma';
import { haversineDistanceMiles } from '@/lib/utils/geo';
import { calculateRoute } from '@/lib/maps/google-maps';
import {
  createFuelStationProvider,
  TollCalculationService,
} from '@/lib/services/fuel';
import type {
  FuelStation,
  FuelStationProvider,
  FuelSuggestion,
  RouteFuelPlan,
  TollEstimate,
} from '@/lib/services/fuel';

const SAMPLE_INTERVAL_MILES = 100;
const SEARCH_RADIUS_MILES = 15;
const LOW_FUEL_THRESHOLD = 25;
const MEDIUM_FUEL_THRESHOLD = 50;
const PRICE_SAVINGS_THRESHOLD = 0.15; // $/gal below average to trigger suggestion
const NEARBY_MILES_THRESHOLD = 20;

export class FuelSuggestionManager {
  private provider: FuelStationProvider;
  private tollService: TollCalculationService;

  constructor() {
    this.provider = createFuelStationProvider();
    this.tollService = new TollCalculationService();
  }

  async getRouteFuelPlan(
    loadId: string,
    driverLat?: number,
    driverLng?: number
  ): Promise<RouteFuelPlan> {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
        route: true,
        truck: { select: { samsaraId: true } },
        company: { select: { id: true } },
      },
    });

    if (!load) throw new Error('Load not found');

    const stations = await this.findStationsAlongRoute(load);
    const stationsWithPrice = stations.filter((s) => s.dieselPrice != null);
    const avgPrice = this.calculateAveragePrice(stationsWithPrice);
    const cheapest = stationsWithPrice[0]?.dieselPrice ?? 0;

    const suggestions = this.generateSuggestions(
      stationsWithPrice,
      avgPrice,
      driverLat,
      driverLng
    );

    const tollEstimate = await this.getTollEstimate(load);

    const estimatedFuelCost = this.estimateFuelCost(
      load.totalMiles ?? 0,
      avgPrice
    );

    return {
      loadId,
      stations: stationsWithPrice,
      suggestions: suggestions.slice(0, 3),
      averageDieselPrice: avgPrice,
      cheapestDieselPrice: cheapest,
      estimatedTotalFuelCost: estimatedFuelCost,
      tollEstimate,
    };
  }

  async getNearbyStations(
    lat: number,
    lng: number,
    radiusMiles = 25
  ): Promise<FuelStation[]> {
    const stations = await this.provider.searchNearby({
      lat,
      lng,
      radiusMiles,
      fuelType: 'DIESEL',
    });

    return stations
      .map((s) => ({
        ...s,
        distanceFromRoute: haversineDistanceMiles(lat, lng, s.lat, s.lng),
      }))
      .sort((a, b) => (a.dieselPrice ?? Infinity) - (b.dieselPrice ?? Infinity));
  }

  async getSmartSuggestions(
    loadId: string,
    driverLat: number,
    driverLng: number,
    fuelPercent?: number
  ): Promise<FuelSuggestion[]> {
    const plan = await this.getRouteFuelPlan(loadId, driverLat, driverLng);
    const suggestions: FuelSuggestion[] = [];

    // HIGH urgency: low fuel
    if (fuelPercent != null && fuelPercent < LOW_FUEL_THRESHOLD) {
      const nearest = this.findNearestStation(
        plan.stations,
        driverLat,
        driverLng
      );
      if (nearest) {
        suggestions.push({
          station: nearest,
          urgency: 'HIGH',
          reason: `Low fuel (${fuelPercent}%)! ${nearest.name} is ${nearest.distanceFromRoute?.toFixed(1)} mi away`,
          estimatedSavings: this.calcSavings(nearest, plan.averageDieselPrice) ?? undefined,
        });
      }
    }

    // MEDIUM urgency: cheap station nearby + fuel below 50%
    if (
      (fuelPercent == null || fuelPercent < MEDIUM_FUEL_THRESHOLD) &&
      plan.stations.length > 0
    ) {
      const cheapNearby = plan.stations.find((s) => {
        if (!s.dieselPrice) return false;
        const dist = haversineDistanceMiles(
          driverLat,
          driverLng,
          s.lat,
          s.lng
        );
        return (
          dist <= NEARBY_MILES_THRESHOLD &&
          s.dieselPrice <= plan.averageDieselPrice - PRICE_SAVINGS_THRESHOLD
        );
      });

      if (cheapNearby && !suggestions.some((s) => s.station.id === cheapNearby.id)) {
        suggestions.push({
          station: cheapNearby,
          urgency: 'MEDIUM',
          reason: `Save $${this.calcSavings(cheapNearby, plan.averageDieselPrice)?.toFixed(2)}/gal at ${cheapNearby.name}`,
          estimatedSavings: this.calcSavings(
            cheapNearby,
            plan.averageDieselPrice
          ) ?? undefined,
        });
      }
    }

    // LOW urgency: cheapest along route
    if (plan.suggestions.length > 0 && suggestions.length === 0) {
      suggestions.push(...plan.suggestions.slice(0, 1).map((s) => ({
        ...s,
        urgency: 'LOW' as const,
      })));
    }

    return suggestions;
  }

  // -- Route analysis helpers --

  private async findStationsAlongRoute(load: {
    pickupCity?: string | null;
    pickupState?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    totalMiles?: number | null;
    stops: Array<{ lat?: number | null; lng?: number | null; city: string; state: string }>;
    route?: { waypoints: unknown } | null;
  }): Promise<FuelStation[]> {
    let polylinePoints: Array<{ lat: number; lng: number }> = [];

    // Try route waypoints first (if stored as encoded polyline string)
    if (load.route?.waypoints && typeof load.route.waypoints === 'string') {
      polylinePoints = FuelSuggestionManager.decodePolyline(load.route.waypoints);
    }

    // Fallback: calculate route via Google Directions API
    if (polylinePoints.length === 0 && load.pickupCity && load.deliveryCity) {
      const routeResult = await calculateRoute([
        { city: load.pickupCity, state: load.pickupState || '' },
        ...load.stops
          .filter((s) => s.lat && s.lng)
          .map((s) => ({ lat: s.lat!, lng: s.lng! })),
        { city: load.deliveryCity, state: load.deliveryState || '' },
      ]);
      if (routeResult?.polyline) {
        polylinePoints = FuelSuggestionManager.decodePolyline(routeResult.polyline);
      }
    }

    // Fallback: use stop coordinates directly
    if (polylinePoints.length === 0) {
      polylinePoints = load.stops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({ lat: s.lat!, lng: s.lng! }));
    }

    if (polylinePoints.length === 0) return [];

    const samplePoints = FuelSuggestionManager.samplePointsAlongPolyline(
      polylinePoints,
      SAMPLE_INTERVAL_MILES
    );

    const allStations: FuelStation[] = [];
    for (const sample of samplePoints) {
      const nearby = await this.provider.searchNearby({
        lat: sample.lat,
        lng: sample.lng,
        radiusMiles: SEARCH_RADIUS_MILES,
        fuelType: 'DIESEL',
      });
      for (const station of nearby) {
        station.milesAlongRoute = sample.milesFromStart;
      }
      allStations.push(...nearby);
    }

    return this.deduplicateStations(allStations);
  }

  private async getTollEstimate(load: {
    stops: Array<{ lat?: number | null; lng?: number | null; city: string; state: string; sequence: number }>;
    pickupCity?: string | null;
    pickupState?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
  }): Promise<TollEstimate | null> {
    const stopsWithCoords = load.stops.filter(
      (s) => s.lat != null && s.lng != null
    );

    if (stopsWithCoords.length >= 2) {
      const sorted = [...stopsWithCoords].sort((a, b) => a.sequence - b.sequence);
      const origin = { lat: sorted[0].lat!, lng: sorted[0].lng! };
      const dest = {
        lat: sorted[sorted.length - 1].lat!,
        lng: sorted[sorted.length - 1].lng!,
      };
      const waypoints = sorted.slice(1, -1).map((s) => ({
        lat: s.lat!,
        lng: s.lng!,
      }));
      return this.tollService.calculateTolls(origin, dest, waypoints);
    }

    // Fallback: geocode pickup/delivery
    if (load.pickupCity && load.deliveryCity) {
      const { geocodeAddress } = await import('@/lib/maps/google-maps');
      const [originGeo, destGeo] = await Promise.all([
        geocodeAddress(`${load.pickupCity}, ${load.pickupState}`),
        geocodeAddress(`${load.deliveryCity}, ${load.deliveryState}`),
      ]);
      if (originGeo && destGeo) {
        return this.tollService.calculateTolls(originGeo, destGeo);
      }
    }

    return null;
  }

  // -- Utility methods --

  private generateSuggestions(
    stations: FuelStation[],
    avgPrice: number,
    driverLat?: number,
    driverLng?: number
  ): FuelSuggestion[] {
    return stations.slice(0, 5).map((station) => {
      const savings = this.calcSavings(station, avgPrice);
      let reason = `Diesel $${station.dieselPrice?.toFixed(2)}/gal`;
      if (savings && savings > 0) {
        reason += ` — save $${savings.toFixed(2)}/gal vs route avg`;
      }
      if (driverLat != null && driverLng != null) {
        const dist = haversineDistanceMiles(
          driverLat,
          driverLng,
          station.lat,
          station.lng
        );
        station.distanceFromRoute = dist;
      }
      return {
        station,
        urgency: 'LOW' as const,
        reason,
        estimatedSavings: savings ?? undefined,
      };
    });
  }

  private findNearestStation(
    stations: FuelStation[],
    lat: number,
    lng: number
  ): FuelStation | undefined {
    let nearest: FuelStation | undefined;
    let minDist = Infinity;
    for (const s of stations) {
      const dist = haversineDistanceMiles(lat, lng, s.lat, s.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...s, distanceFromRoute: dist };
      }
    }
    return nearest;
  }

  private calcSavings(
    station: FuelStation,
    avgPrice: number
  ): number | null {
    if (!station.dieselPrice) return null;
    return Math.max(0, avgPrice - station.dieselPrice);
  }

  private calculateAveragePrice(stations: FuelStation[]): number {
    const priced = stations.filter((s) => s.dieselPrice != null);
    if (priced.length === 0) return 0;
    return (
      priced.reduce((sum, s) => sum + (s.dieselPrice ?? 0), 0) / priced.length
    );
  }

  private estimateFuelCost(totalMiles: number, avgDieselPrice: number): number {
    const avgMpg = 6.5; // Average truck MPG
    if (totalMiles <= 0 || avgDieselPrice <= 0) return 0;
    return (totalMiles / avgMpg) * avgDieselPrice;
  }

  private deduplicateStations(stations: FuelStation[]): FuelStation[] {
    const map = new Map<string, FuelStation>();
    for (const station of stations) {
      const existing = map.get(station.id);
      if (
        !existing ||
        (station.dieselPrice != null &&
          (existing.dieselPrice == null ||
            station.dieselPrice < existing.dieselPrice))
      ) {
        map.set(station.id, station);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => (a.dieselPrice ?? Infinity) - (b.dieselPrice ?? Infinity)
    );
  }

  // -- Polyline utilities --

  static decodePolyline(
    encoded: string
  ): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
  }

  static samplePointsAlongPolyline(
    points: Array<{ lat: number; lng: number }>,
    intervalMiles: number
  ): Array<{ lat: number; lng: number; milesFromStart: number }> {
    if (points.length === 0) return [];

    const samples: Array<{ lat: number; lng: number; milesFromStart: number }> =
      [{ ...points[0], milesFromStart: 0 }];

    let accumulatedMiles = 0;
    let nextSampleAt = intervalMiles;

    for (let i = 1; i < points.length; i++) {
      const segmentMiles = haversineDistanceMiles(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
      accumulatedMiles += segmentMiles;

      while (accumulatedMiles >= nextSampleAt) {
        const overshoot = accumulatedMiles - nextSampleAt;
        const ratio = segmentMiles > 0 ? 1 - overshoot / segmentMiles : 1;
        const sampleLat =
          points[i - 1].lat + ratio * (points[i].lat - points[i - 1].lat);
        const sampleLng =
          points[i - 1].lng + ratio * (points[i].lng - points[i - 1].lng);

        samples.push({ lat: sampleLat, lng: sampleLng, milesFromStart: nextSampleAt });
        nextSampleAt += intervalMiles;
      }
    }

    // Include end point if far enough from last sample
    const lastPoint = points[points.length - 1];
    const lastSample = samples[samples.length - 1];
    if (accumulatedMiles - lastSample.milesFromStart > 10) {
      samples.push({ ...lastPoint, milesFromStart: accumulatedMiles });
    }

    return samples;
  }
}
