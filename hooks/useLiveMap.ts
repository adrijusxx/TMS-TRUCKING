import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';
import type { LoadMapEntry, TruckMapEntry } from '@/lib/maps/live-map-service';

interface LiveMapResponse {
  success: boolean;
  data: {
    loads: LoadMapEntry[];
    trucks: TruckMapEntry[];
  };
}

async function fetchLiveMapData(): Promise<LiveMapResponse['data']> {
  const response = await fetch(apiUrl('/api/maps/live'));
  if (!response.ok) throw new Error('Failed to fetch live map data');
  const payload: LiveMapResponse = await response.json();
  return payload.data;
}

export function useLiveMap() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['live-map'],
    queryFn: fetchLiveMapData,
    refetchInterval: DEFAULT_MAP_CONFIG.refreshInterval,
    staleTime: 10000,
    gcTime: 300000, // 5 minutes
  });

  return {
    loads: data?.loads || [],
    trucks: data?.trucks || [],
    isLoading,
    error,
    refetch,
  };
}

