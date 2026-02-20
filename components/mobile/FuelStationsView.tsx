'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, MapPin, Loader2 } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import FuelStationCard from './FuelStationCard';
import FuelNotificationBanner from './FuelNotificationBanner';
import type { FuelStation, FuelSuggestion, TollEstimate } from '@/lib/services/fuel/FuelStationProvider';

interface StationsResponse {
  stations: FuelStation[];
  averageDieselPrice: number;
  cheapestDieselPrice: number;
  estimatedTotalFuelCost: number;
  tollEstimate: TollEstimate | null;
}

interface SuggestionsResponse {
  suggestions: FuelSuggestion[];
  fuelPercent: number | null;
}

export default function FuelStationsView() {
  const [tab, setTab] = useState<'route' | 'nearby'>('route');
  const { location } = useDriverLocation({ watch: true });

  // Fetch active loads to pick one
  const { data: loadsData } = useQuery({
    queryKey: ['driver-active-loads'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/mobile/loads?status=EN_ROUTE_DELIVERY'));
      if (!res.ok) {
        const fallback = await fetch(apiUrl('/api/mobile/loads?status=DISPATCHED'));
        if (!fallback.ok) return { data: { loads: [] } };
        return fallback.json();
      }
      return res.json();
    },
  });

  const activeLoad = loadsData?.data?.loads?.[0];
  const loadId = activeLoad?.id;

  // Fetch route stations
  const { data: routeData, isLoading: routeLoading } = useQuery<{ data: StationsResponse }>({
    queryKey: ['fuel-stations-route', loadId, location?.lat, location?.lng],
    queryFn: async () => {
      const params = new URLSearchParams({ loadId: loadId! });
      if (location) {
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
      }
      const res = await fetch(apiUrl(`/api/mobile/fuel/stations?${params}`));
      if (!res.ok) throw new Error('Failed to fetch stations');
      return res.json();
    },
    enabled: !!loadId,
    refetchInterval: 15 * 60 * 1000, // 15 min
  });

  // Fetch suggestions
  const { data: suggestionsData } = useQuery<{ data: SuggestionsResponse }>({
    queryKey: ['fuel-suggestions', loadId, location?.lat, location?.lng],
    queryFn: async () => {
      const params = new URLSearchParams({
        loadId: loadId!,
        lat: location!.lat.toString(),
        lng: location!.lng.toString(),
      });
      const res = await fetch(apiUrl(`/api/mobile/fuel/suggestions?${params}`));
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json();
    },
    enabled: !!loadId && !!location,
    refetchInterval: 15 * 60 * 1000,
  });

  // Fetch nearby stations
  const { data: nearbyData, isLoading: nearbyLoading } = useQuery<{ data: { stations: FuelStation[] } }>({
    queryKey: ['fuel-stations-nearby', location?.lat, location?.lng],
    queryFn: async () => {
      const res = await fetch(
        apiUrl(`/api/mobile/fuel/stations?lat=${location!.lat}&lng=${location!.lng}&radius=25`)
      );
      if (!res.ok) throw new Error('Failed to fetch nearby stations');
      return res.json();
    },
    enabled: tab === 'nearby' && !!location,
  });

  const routeStations = routeData?.data?.stations || [];
  const nearbyStations = nearbyData?.data?.stations || [];
  const highPrioritySuggestion =
    suggestionsData?.data?.suggestions?.find((s) => s.urgency === 'HIGH' || s.urgency === 'MEDIUM') ?? null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      <div className="bg-white dark:bg-zinc-900 shadow-sm sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Fuel Stops
          </h1>
          {activeLoad && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Load #{activeLoad.loadNumber} — {activeLoad.pickup?.city}, {activeLoad.pickup?.state} to{' '}
              {activeLoad.delivery?.city}, {activeLoad.delivery?.state}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
              tab === 'route'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setTab('route')}
          >
            Route Stops
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${
              tab === 'nearby'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => setTab('nearby')}
          >
            <MapPin className="h-3.5 w-3.5 inline mr-1" />
            Nearby
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      <div className="mt-3">
        <FuelNotificationBanner suggestion={highPrioritySuggestion} />
      </div>

      {/* Route Summary */}
      {tab === 'route' && routeData?.data && (
        <div className="px-4 mb-3">
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">
                    ${routeData.data.cheapestDieselPrice?.toFixed(2) || '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Cheapest</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    ${routeData.data.averageDieselPrice?.toFixed(2) || '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Avg Price</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {formatCurrency(routeData.data.estimatedTotalFuelCost)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Est. Fuel Cost</p>
                </div>
              </div>
              {routeData.data.tollEstimate && (
                <div className="mt-2 pt-2 border-t text-center">
                  <p className="text-sm">
                    Estimated tolls:{' '}
                    <span className="font-semibold">
                      {formatCurrency(routeData.data.tollEstimate.totalTollCost)}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Station List */}
      <div className="px-4 space-y-3">
        {tab === 'route' && !loadId && (
          <Card>
            <CardContent className="p-8 text-center">
              <Fuel className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active load found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fuel stops will appear when you have an active load
              </p>
            </CardContent>
          </Card>
        )}

        {(tab === 'route' ? routeLoading : nearbyLoading) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {tab === 'route' && routeStations.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                {routeStations.length} stations along route
              </h2>
              <Badge variant="outline" className="text-xs">
                Sorted by price
              </Badge>
            </div>
            {routeStations.map((station) => (
              <FuelStationCard
                key={station.id}
                station={station}
                averagePrice={routeData?.data?.averageDieselPrice}
              />
            ))}
          </>
        )}

        {tab === 'nearby' && !location && (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Waiting for location...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Allow location access to see nearby fuel stations
              </p>
            </CardContent>
          </Card>
        )}

        {tab === 'nearby' && nearbyStations.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground">
              {nearbyStations.length} stations nearby
            </h2>
            {nearbyStations.map((station) => (
              <FuelStationCard key={station.id} station={station} />
            ))}
          </>
        )}

        {tab === 'route' && !routeLoading && loadId && routeStations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No fuel stations found along route</p>
            </CardContent>
          </Card>
        )}

        {tab === 'nearby' && !nearbyLoading && location && nearbyStations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No fuel stations found nearby</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
