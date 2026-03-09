/**
 * Samsara Geofence (Addresses) Integration
 * Fetches geofence zones from Samsara's /addresses endpoint
 */

import { samsaraRequest } from './client';
import type { Geofence } from '@/components/map/GeofenceLayer';

// ============================================
// TYPES
// ============================================

export interface SamsaraAddress {
  id: string;
  name: string;
  notes?: string;
  formattedAddress?: string;
  geofence?: {
    circle?: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
    };
    polygon?: {
      vertices: Array<{ latitude: number; longitude: number }>;
    };
  };
  tags?: Array<{ id: string; name: string }>;
  externalIds?: Record<string, string>;
}

// ============================================
// COLOR MAP
// ============================================

const GEOFENCE_COLORS: Record<string, string> = {
  yard: '#22c55e',
  terminal: '#22c55e',
  warehouse: '#22c55e',
  customer: '#3b82f6',
  shipper: '#3b82f6',
  receiver: '#3b82f6',
  fuel: '#f59e0b',
  rest: '#8b5cf6',
  default: '#6b7280',
};

function resolveGeofenceColor(tags?: Array<{ name: string }>): string {
  if (!tags?.length) return GEOFENCE_COLORS.default;
  const tagName = tags[0].name.toLowerCase();

  for (const [key, color] of Object.entries(GEOFENCE_COLORS)) {
    if (tagName.includes(key)) return color;
  }
  return GEOFENCE_COLORS.default;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch all geofences (addresses) from Samsara with cursor pagination
 */
export async function getSamsaraGeofences(companyId?: string): Promise<SamsaraAddress[]> {
  const allAddresses: SamsaraAddress[] = [];
  let after: string | undefined;

  while (true) {
    const params = new URLSearchParams({ limit: '512' });
    if (after) params.set('after', after);

    const result = await samsaraRequest<{
      data?: SamsaraAddress[];
      pagination?: { endCursor?: string; hasNextPage?: boolean };
    }>(`/addresses?${params.toString()}`, {}, companyId);

    if (!result) break;
    if (Array.isArray(result.data)) allAddresses.push(...result.data);
    if (result.pagination?.hasNextPage && result.pagination.endCursor) {
      after = result.pagination.endCursor;
    } else {
      break;
    }
  }

  return allAddresses;
}

/**
 * Transform Samsara addresses into GeofenceLayer-compatible format
 */
export function transformSamsaraGeofences(addresses: SamsaraAddress[]): Geofence[] {
  const geofences: Geofence[] = [];

  for (const addr of addresses) {
    if (!addr.geofence) continue;
    const color = resolveGeofenceColor(addr.tags);

    if (addr.geofence.circle) {
      geofences.push({
        id: addr.id,
        name: addr.name,
        type: 'circle',
        center: {
          lat: addr.geofence.circle.latitude,
          lng: addr.geofence.circle.longitude,
        },
        radius: addr.geofence.circle.radiusMeters,
        color,
      });
    } else if (addr.geofence.polygon?.vertices?.length) {
      geofences.push({
        id: addr.id,
        name: addr.name,
        type: 'polygon',
        path: addr.geofence.polygon.vertices.map(v => ({
          lat: v.latitude,
          lng: v.longitude,
        })),
        color,
      });
    }
  }

  return geofences;
}
