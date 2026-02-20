'use client';

import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';

export interface LoadTrackingData {
  loadId: string;
  truckNumber: string | null;
  truckLocation: {
    lat: number;
    lng: number;
    speed: number;
    heading: number | null;
    address: string | null;
    lastUpdated: string;
  } | null;
  nextStop: {
    stopType: string;
    city: string;
    state: string;
    scheduledArrival: string | null;
  } | null;
  eta: {
    etaFormatted: string;
    remainingMiles: number;
    remainingMinutes: number;
    status: 'ON_TIME' | 'AT_RISK' | 'LATE';
    statusReason: string | null;
  } | null;
  proximityStatus: 'AT_STOP' | 'APPROACHING' | 'EN_ROUTE' | 'NO_DATA';
  proximityMiles: number | null;
}

/**
 * Fetch live tracking data for a single load. Polls every 30s.
 */
export function useLoadTracking(loadId: string | undefined, enabled = true) {
  return useQuery<LoadTrackingData>({
    queryKey: ['load-tracking', loadId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/loads/${loadId}/tracking`));
      if (!res.ok) throw new Error('Failed to fetch tracking');
      const json = await res.json();
      return json.data;
    },
    enabled: enabled && !!loadId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

/**
 * Fetch live tracking data for multiple loads in one batched call. Polls every 30s.
 */
export function useBatchLoadTracking(loadIds: string[], enabled = true) {
  const key = loadIds.sort().join(',');

  return useQuery<Record<string, LoadTrackingData>>({
    queryKey: ['load-tracking-batch', key],
    queryFn: async () => {
      if (loadIds.length === 0) return {};
      const res = await fetch(apiUrl(`/api/loads/tracking/batch?ids=${loadIds.join(',')}`));
      if (!res.ok) throw new Error('Failed to fetch batch tracking');
      const json = await res.json();
      return json.data;
    },
    enabled: enabled && loadIds.length > 0,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}
