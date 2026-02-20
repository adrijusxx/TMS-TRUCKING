'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Loader2, ChevronRight } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import FuelStationCard from './FuelStationCard';
import FuelNotificationBanner from './FuelNotificationBanner';
import Link from 'next/link';
import type { FuelStation, FuelSuggestion, TollEstimate } from '@/lib/services/fuel/FuelStationProvider';

interface LoadFuelStopsProps {
  loadId: string;
  totalMiles?: number;
}

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

export default function LoadFuelStops({ loadId, totalMiles }: LoadFuelStopsProps) {
  const { location } = useDriverLocation();

  const { data: stationsData, isLoading } = useQuery<{ data: StationsResponse }>({
    queryKey: ['fuel-stations-route', loadId],
    queryFn: async () => {
      const params = new URLSearchParams({ loadId });
      if (location) {
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
      }
      const res = await fetch(apiUrl(`/api/mobile/fuel/stations?${params}`));
      if (!res.ok) throw new Error('Failed to fetch fuel data');
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: suggestionsData } = useQuery<{ data: SuggestionsResponse }>({
    queryKey: ['fuel-suggestions', loadId, location?.lat, location?.lng],
    queryFn: async () => {
      const params = new URLSearchParams({
        loadId,
        lat: location!.lat.toString(),
        lng: location!.lng.toString(),
      });
      const res = await fetch(apiUrl(`/api/mobile/fuel/suggestions?${params}`));
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json();
    },
    enabled: !!location,
    refetchInterval: 15 * 60 * 1000,
  });

  const data = stationsData?.data;
  const topStations = data?.stations?.slice(0, 3) || [];
  const highPriority =
    suggestionsData?.data?.suggestions?.find(
      (s) => s.urgency === 'HIGH' || s.urgency === 'MEDIUM'
    ) ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Fuel & Tolls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Notification banner */}
        <FuelNotificationBanner suggestion={highPriority} />

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Cost summary */}
        {data && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-bold text-green-600">
                ${data.cheapestDieselPrice?.toFixed(2) || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Cheapest</p>
            </div>
            <div>
              <p className="font-bold">
                {formatCurrency(data.estimatedTotalFuelCost)}
              </p>
              <p className="text-[10px] text-muted-foreground">Est. Fuel</p>
            </div>
            <div>
              <p className="font-bold">
                {data.tollEstimate
                  ? formatCurrency(data.tollEstimate.totalTollCost)
                  : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Est. Tolls</p>
            </div>
          </div>
        )}

        {/* Top 3 stations */}
        {topStations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Cheapest Diesel Along Route
            </p>
            {topStations.map((station) => (
              <FuelStationCard
                key={station.id}
                station={station}
                averagePrice={data?.averageDieselPrice}
                compact
              />
            ))}
          </div>
        )}

        {/* Link to full view */}
        <Link
          href={`/driver/fuel?loadId=${loadId}`}
          className="flex items-center justify-center gap-1 text-sm text-primary font-medium py-2 hover:underline"
        >
          View All Fuel Stops
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
