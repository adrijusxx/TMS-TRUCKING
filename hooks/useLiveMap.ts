import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';
import type { LoadMapEntry, TruckMapEntry, TrailerMapEntry } from '@/lib/maps/live-map-service';

interface LiveMapResponse {
  success: boolean;
  data: {
    loads: LoadMapEntry[];
    trucks: TruckMapEntry[];
    trailers: TrailerMapEntry[];
  };
  meta?: {
    samsaraConfigured: boolean;
    samsaraVehiclesFound?: boolean;
  };
}

async function fetchLiveMapData(): Promise<LiveMapResponse> {
  console.log('[LiveMap] Fetching live map data...');
  const startTime = performance.now();

  try {
    const response = await fetch(apiUrl('/api/maps/live'));
    if (!response.ok) {
      console.error('[LiveMap] API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch live map data: ${response.status} ${response.statusText}`);
    }

    const payload: LiveMapResponse = await response.json();
    const loadTime = performance.now() - startTime;

    console.log('[LiveMap] Data received:', {
      loads: payload.data?.loads?.length || 0,
      trucks: payload.data?.trucks?.length || 0,
      trailers: payload.data?.trailers?.length || 0,
      loadTime: `${loadTime.toFixed(0)}ms`,
    });

    // Log truck details
    if (payload.data?.trucks && payload.data.trucks.length > 0) {
      const trucksWithLocation = payload.data.trucks.filter(t => t.location);
      const trucksWithoutLocation = payload.data.trucks.filter(t => !t.location);

      console.log('[LiveMap] Trucks breakdown:', {
        total: payload.data.trucks.length,
        withLocation: trucksWithLocation.length,
        withoutLocation: trucksWithoutLocation.length,
        withoutLocationNumbers: trucksWithoutLocation.map(t => t.truckNumber),
      });
    }

    // Log trailer details
    if (payload.data?.trailers && payload.data.trailers.length > 0) {
      console.log('[LiveMap] Trailers with locations:',
        payload.data.trailers.filter(t => t.location).map(t => ({
          number: t.trailerNumber,
          hasLocation: !!t.location,
          matchSource: t.matchSource,
        }))
      );
    } else {
      console.warn('[LiveMap] No trailers found in response');
    }

    return payload;
  } catch (error) {
    console.error('[LiveMap] Fetch error:', error);
    throw error;
  }
}

export function useLiveMap() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['live-map'],
    queryFn: fetchLiveMapData,
    refetchInterval: DEFAULT_MAP_CONFIG.refreshInterval,
    refetchIntervalInBackground: false, // Don't refetch when tab is in background
    staleTime: 30000, // Increased from 10s to 30s to reduce unnecessary refetches
    gcTime: 300000, // 5 minutes
  });

  return {
    loads: data?.data?.loads || [],
    trucks: data?.data?.trucks || [],
    trailers: data?.data?.trailers || [],
    isSamsaraConfigured: data?.meta?.samsaraConfigured ?? true, // Default to true to avoid flashing prompt while loading
    isLoading,
    error,
    refetch,
  };
}


