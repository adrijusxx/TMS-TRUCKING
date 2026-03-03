/**
 * StopReorderManager
 *
 * Optimizes the order of load stops using Haversine-based distance
 * calculations. Implements a nearest-neighbor heuristic for route
 * optimization. No Google Distance Matrix calls — purely local math.
 */

import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/errors';
import {
  haversineDistance,
  buildDistanceMatrix,
  estimateTravelTime,
  formatTravelTime,
} from '@/lib/utils/haversine';

// ── Types ────────────────────────────────────────────────────────

export interface StopInput {
  id: string;
  lat: number;
  lng: number;
  /** Original sequence number (1-based) */
  sequence: number;
  stopType?: string; // PICKUP | DELIVERY
  name?: string;
}

export interface OptimizedStop extends StopInput {
  /** New sequence after optimization (1-based) */
  newSequence: number;
  /** Distance from the previous stop in miles */
  distanceFromPrev: number;
  /** Cumulative distance from start in miles */
  cumulativeDistance: number;
}

export interface OptimizationResult {
  stops: OptimizedStop[];
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  totalDurationFormatted: string;
  originalDistanceMiles: number;
  savingsMiles: number;
  savingsPercent: number;
}

export interface DistanceMatrixResult {
  matrix: number[][];
  stops: StopInput[];
}

// ── Manager ──────────────────────────────────────────────────────

export class StopReorderManager {
  /**
   * Optimize the order of stops using a nearest-neighbor heuristic.
   * Starts from the first stop and greedily picks the closest unvisited stop.
   *
   * This is O(n^2) which is fine for typical load stop counts (2-20 stops).
   * Does NOT call any Google APIs.
   */
  static optimizeStopOrder(stops: StopInput[]): OptimizationResult {
    if (stops.length < 2) {
      throw new ValidationError(
        'At least 2 stops are required for optimization'
      );
    }

    this.validateStops(stops);

    const n = stops.length;
    const matrix = buildDistanceMatrix(
      stops.map((s) => ({ lat: s.lat, lng: s.lng }))
    );

    // Nearest-neighbor starting from the first stop
    const visited = new Set<number>();
    const order: number[] = [];

    let current = 0; // start at the first stop
    visited.add(current);
    order.push(current);

    while (order.length < n) {
      let nearest = -1;
      let nearestDist = Infinity;

      for (let j = 0; j < n; j++) {
        if (visited.has(j)) continue;
        if (matrix[current][j] < nearestDist) {
          nearestDist = matrix[current][j];
          nearest = j;
        }
      }

      if (nearest === -1) break;
      visited.add(nearest);
      order.push(nearest);
      current = nearest;
    }

    // Build optimized stop list
    const optimized = this.buildOptimizedStops(stops, order, matrix);

    // Calculate original route distance for comparison
    const originalDistance = this.calculateRouteDistance(stops);

    const totalDistance = optimized.reduce(
      (sum, s) => sum + s.distanceFromPrev,
      0
    );
    const totalDuration = estimateTravelTime(totalDistance);
    const savings = originalDistance - totalDistance;
    const savingsPercent =
      originalDistance > 0
        ? Math.round((savings / originalDistance) * 100)
        : 0;

    logger.info('Stop order optimized', {
      stopCount: n,
      originalMiles: Math.round(originalDistance * 10) / 10,
      optimizedMiles: Math.round(totalDistance * 10) / 10,
      savingsPercent,
    });

    return {
      stops: optimized,
      totalDistanceMiles: Math.round(totalDistance * 10) / 10,
      totalDurationMinutes: Math.round(totalDuration),
      totalDurationFormatted: formatTravelTime(totalDuration),
      originalDistanceMiles: Math.round(originalDistance * 10) / 10,
      savingsMiles: Math.round(savings * 10) / 10,
      savingsPercent: Math.max(0, savingsPercent),
    };
  }

  /**
   * Calculate the total route distance for stops in their current order.
   * Uses Haversine — no Google API.
   */
  static calculateRouteDistance(stops: StopInput[]): number {
    if (stops.length < 2) return 0;

    const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
    let total = 0;

    for (let i = 1; i < sorted.length; i++) {
      total += haversineDistance(
        sorted[i - 1].lat,
        sorted[i - 1].lng,
        sorted[i].lat,
        sorted[i].lng
      );
    }

    return total;
  }

  /**
   * Build a stop-to-stop distance matrix using Haversine.
   */
  static getStopDistanceMatrix(
    stops: StopInput[]
  ): DistanceMatrixResult {
    this.validateStops(stops);
    const matrix = buildDistanceMatrix(
      stops.map((s) => ({ lat: s.lat, lng: s.lng }))
    );
    return { matrix, stops };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private static buildOptimizedStops(
    stops: StopInput[],
    order: number[],
    matrix: number[][]
  ): OptimizedStop[] {
    let cumulative = 0;

    return order.map((idx, position) => {
      const distFromPrev =
        position === 0 ? 0 : matrix[order[position - 1]][idx];
      cumulative += distFromPrev;

      return {
        ...stops[idx],
        newSequence: position + 1,
        distanceFromPrev: Math.round(distFromPrev * 10) / 10,
        cumulativeDistance: Math.round(cumulative * 10) / 10,
      };
    });
  }

  private static validateStops(stops: StopInput[]): void {
    for (const stop of stops) {
      if (
        stop.lat < -90 || stop.lat > 90 ||
        stop.lng < -180 || stop.lng > 180
      ) {
        throw new ValidationError(
          `Invalid coordinates for stop ${stop.id}`
        );
      }
    }
  }
}
