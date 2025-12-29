/**
 * Map Point Types for War Room Map
 * 
 * Lightweight data structure for efficient map rendering.
 * Max payload: 5KB per the OPERATIONAL_OVERHAUL spec.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 2.2
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export type MapPointType = 'TRUCK' | 'LOAD' | 'DRIVER';
export type MapPointStatus = 'MOVING' | 'STOPPED' | 'DELAYED' | 'IDLE';

/**
 * Lightweight map point for rendering
 * Minimal data - details fetched on click
 */
export interface MapPoint {
  id: string;
  type: MapPointType;
  lat: number;
  lng: number;
  status: MapPointStatus;
  heading: number; // 0-360 for icon rotation
  label: string; // Short label for marker (e.g., "TRK-101")
  clusterGroup?: string; // Optional region grouping
}

/**
 * Response from /api/map-data
 */
export interface MapDataResponse {
  success: boolean;
  data: MapPoint[];
  meta: {
    totalCount: number;
    byType: {
      trucks: number;
      loads: number;
      drivers: number;
    };
    timestamp: string;
  };
}

// ============================================
// ZOD SCHEMAS
// ============================================

export const MapPointSchema = z.object({
  id: z.string(),
  type: z.enum(['TRUCK', 'LOAD', 'DRIVER']),
  lat: z.number(),
  lng: z.number(),
  status: z.enum(['MOVING', 'STOPPED', 'DELAYED', 'IDLE']),
  heading: z.number().min(0).max(360),
  label: z.string(),
  clusterGroup: z.string().optional(),
});

export const MapDataResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MapPointSchema),
  meta: z.object({
    totalCount: z.number(),
    byType: z.object({
      trucks: z.number(),
      loads: z.number(),
      drivers: z.number(),
    }),
    timestamp: z.string(),
  }),
});

// ============================================
// HELPERS
// ============================================

/**
 * Determine status based on speed and last update
 */
export function determineStatus(
  speed?: number | null,
  lastUpdateMs?: number
): MapPointStatus {
  // If no recent update (>30 min), mark as IDLE
  if (lastUpdateMs && lastUpdateMs > 30 * 60 * 1000) {
    return 'IDLE';
  }
  
  // If speed > 5 mph, moving
  if (speed && speed > 5) {
    return 'MOVING';
  }
  
  return 'STOPPED';
}

/**
 * Get cluster group based on coordinates (quadrant-based)
 */
export function getClusterGroup(lat: number, lng: number): string {
  // Simple US quadrant grouping
  const ns = lat >= 39 ? 'North' : 'South';
  const ew = lng >= -100 ? 'East' : 'West';
  return `${ns}${ew}`;
}

/**
 * Create short label for marker
 */
export function createMarkerLabel(type: MapPointType, identifier: string): string {
  const prefix = type === 'TRUCK' ? 'T' : type === 'LOAD' ? 'L' : 'D';
  // Get last 4 chars or full string if shorter
  const short = identifier.length > 4 
    ? identifier.slice(-4) 
    : identifier;
  return `${prefix}-${short}`;
}





