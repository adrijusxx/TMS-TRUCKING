'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Navigation, Gauge, Clock } from 'lucide-react';
import { useLoadTracking } from '@/hooks/useLoadTracking';

const ACTIVE_STATUSES = new Set([
  'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY',
]);

const etaStatusColors = {
  ON_TIME: 'text-green-600',
  AT_RISK: 'text-amber-600',
  LATE: 'text-red-600',
} as const;

interface Props {
  loadId: string;
  loadStatus: string;
}

export function LoadDetailTrackingCard({ loadId, loadStatus }: Props) {
  const isActive = ACTIVE_STATUSES.has(loadStatus);
  const { data: tracking, isLoading } = useLoadTracking(loadId, isActive);

  if (!isActive) return null;
  if (isLoading) return null;
  if (!tracking || tracking.proximityStatus === 'NO_DATA') return null;

  const { truckLocation, nextStop, eta, proximityStatus, proximityMiles, truckNumber } = tracking;
  const speed = truckLocation?.speed ?? 0;
  const stopLabel = nextStop?.stopType === 'PICKUP' ? 'Pickup' : 'Delivery';

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="py-2 px-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Truck + Speed */}
          <div className="flex items-center gap-3">
            <Truck className="h-4 w-4 text-blue-600" />
            <div className="text-xs">
              <span className="font-medium">{truckNumber || 'Truck'}</span>
              {speed > 0 && (
                <span className="text-muted-foreground ml-2">
                  <Gauge className="h-3 w-3 inline mr-0.5" />
                  {Math.round(speed)} mph
                </span>
              )}
              {speed === 0 && truckLocation && (
                <span className="text-muted-foreground ml-2">Stopped</span>
              )}
            </div>
          </div>

          {/* Proximity */}
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {proximityStatus === 'AT_STOP' && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] h-5">
                At {stopLabel}
              </Badge>
            )}
            {proximityStatus === 'APPROACHING' && (
              <span className="font-medium text-blue-700">
                ~{proximityMiles} mi from {stopLabel.toLowerCase()}
              </span>
            )}
            {proximityStatus === 'EN_ROUTE' && proximityMiles && (
              <span className="text-muted-foreground">
                {proximityMiles} mi to {stopLabel.toLowerCase()}
              </span>
            )}
            {nextStop && (
              <span className="text-muted-foreground">
                ({nextStop.city}, {nextStop.state})
              </span>
            )}
          </div>

          {/* ETA */}
          {eta && (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={`font-medium ${etaStatusColors[eta.status]}`}>
                ETA {eta.etaFormatted}
              </span>
              {eta.statusReason && (
                <span className="text-muted-foreground">({eta.statusReason})</span>
              )}
            </div>
          )}
        </div>

        {/* Address */}
        {truckLocation?.address && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Navigation className="h-2.5 w-2.5" />
            {truckLocation.address}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
