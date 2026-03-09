'use client';

/**
 * Hook to fetch Samsara geofences for the map
 */

import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import type { Geofence } from '@/components/map/GeofenceLayer';

export function useSamsaraGeofences(enabled: boolean) {
  return useQuery<Geofence[]>({
    queryKey: ['samsara-geofences'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/maps/geofences'));
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data as Geofence[]) || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — geofences don't move
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
