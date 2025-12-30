'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Truck, MapPinOff } from 'lucide-react';
import LoadMap from '@/components/loads/LoadMap';

interface LoadRouteMapTabProps {
  load: {
    id: string;
    loadNumber: string;
    driver?: {
      id: string;
      driverNumber: string;
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
    truck?: {
      id: string;
      truckNumber: string;
    } | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    pickupAddress?: string | null;
    pickupZip?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    deliveryAddress?: string | null;
    deliveryZip?: string | null;
    totalMiles?: number | null;
    loadedMiles?: number | null;
    emptyMiles?: number | null;
    stops?: Array<{
      id: string;
      stopType: 'PICKUP' | 'DELIVERY';
      sequence: number;
      city: string;
      state: string;
      address: string;
      zip?: string | null;
      company?: string | null;
    }>;
  };
}

export default function LoadRouteMapTab({ load }: LoadRouteMapTabProps) {
  const hasValidRoute =
    (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState) ||
    (load.stops && load.stops.length >= 2);

  return (
    <div className="space-y-4">
      {/* Route Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Route Summary
          </CardTitle>
          <CardDescription>
            Visual representation of the load route
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route Info Badges */}
          <div className="flex flex-wrap gap-2">
            {load.totalMiles && (
              <Badge variant="info-outline">
                Total: {load.totalMiles.toFixed(0)} mi
              </Badge>
            )}
            {load.loadedMiles && (
              <Badge variant="success-outline">
                Loaded: {load.loadedMiles.toFixed(0)} mi
              </Badge>
            )}
            {load.emptyMiles && (
              <Badge variant="neutral-outline">
                Empty: {load.emptyMiles.toFixed(0)} mi
              </Badge>
            )}
            {load.driver && (
              <Badge variant="secondary">
                <Truck className="h-3 w-3 mr-1" />
                {load.driver.user.firstName} {load.driver.user.lastName}
              </Badge>
            )}
            {load.truck && (
              <Badge variant="secondary">
                Truck #{load.truck.truckNumber}
              </Badge>
            )}
          </div>

          {/* Route Points */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="font-medium">Origin:</span>
              <span className="text-muted-foreground">
                {load.stops && load.stops.length > 0
                  ? `${load.stops.find((s) => s.stopType === 'PICKUP')?.city || ''}, ${load.stops.find((s) => s.stopType === 'PICKUP')?.state || ''}`
                  : `${load.pickupCity || 'N/A'}, ${load.pickupState || 'N/A'}`}
              </span>
            </div>
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="font-medium">Destination:</span>
              <span className="text-muted-foreground">
                {load.stops && load.stops.length > 0
                  ? (() => {
                    const deliveries = load.stops.filter((s) => s.stopType === 'DELIVERY');
                    const lastDelivery = deliveries[deliveries.length - 1];
                    return `${lastDelivery?.city || ''}, ${lastDelivery?.state || ''}`;
                  })()
                  : `${load.deliveryCity || 'N/A'}, ${load.deliveryState || 'N/A'}`}
              </span>
            </div>
          </div>

          {/* Multi-Stop Indicator */}
          {load.stops && load.stops.length > 2 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                Multi-stop load with {load.stops.length} stops (
                {load.stops.filter((s) => s.stopType === 'PICKUP').length} pickups,{' '}
                {load.stops.filter((s) => s.stopType === 'DELIVERY').length} deliveries)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Route Map
          </CardTitle>
          {load.driver && load.truck && (
            <CardDescription>
              Live driver location tracking enabled via Samsara integration
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {hasValidRoute ? (
            <div className="h-[500px] w-full rounded-lg overflow-hidden border">
              <LoadMap load={load} />
            </div>
          ) : (
            <div className="h-[300px] w-full rounded-lg border bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPinOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No Route Available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add pickup and delivery locations to view the route map
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





