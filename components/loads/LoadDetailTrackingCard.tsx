'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const etaBgColors = {
  ON_TIME: 'bg-green-50 border-green-200',
  AT_RISK: 'bg-amber-50 border-amber-200',
  LATE: 'bg-red-50 border-red-200',
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

  // Compact badge label
  let badgeLabel = '';
  if (proximityStatus === 'AT_STOP') badgeLabel = `At ${stopLabel}`;
  else if (eta) badgeLabel = `ETA ${eta.etaFormatted}`;
  else if (proximityMiles) badgeLabel = `${proximityMiles} mi`;

  const etaColor = eta ? etaBgColors[eta.status] : 'bg-blue-50 border-blue-200';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-help ${etaColor}`}>
            <Truck className="h-3 w-3 text-blue-600 flex-shrink-0" />
            <span className="font-medium text-nowrap">{truckNumber || 'Truck'}</span>
            {speed > 0 && (
              <span className="text-muted-foreground text-nowrap">
                {Math.round(speed)} mph
              </span>
            )}
            {speed === 0 && truckLocation && (
              <span className="text-muted-foreground">Stopped</span>
            )}
            {badgeLabel && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className={`font-medium text-nowrap ${eta ? etaStatusColors[eta.status] : 'text-blue-700'}`}>
                  {badgeLabel}
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-sm text-xs space-y-1.5 p-3">
          <p className="font-semibold flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-blue-600" />
            Live GPS Tracking
          </p>

          {/* Proximity */}
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
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
              <span>{proximityMiles} mi to {stopLabel.toLowerCase()}</span>
            )}
            {nextStop && (
              <span className="text-muted-foreground">
                ({nextStop.city}, {nextStop.state})
              </span>
            )}
          </div>

          {/* Speed */}
          {speed > 0 && (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <span>{Math.round(speed)} mph</span>
            </div>
          )}

          {/* ETA */}
          {eta && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={`font-medium ${etaStatusColors[eta.status]}`}>
                ETA {eta.etaFormatted}
              </span>
              {eta.statusReason && (
                <span className="text-muted-foreground">({eta.statusReason})</span>
              )}
            </div>
          )}

          {/* Address */}
          {truckLocation?.address && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Navigation className="h-3 w-3 flex-shrink-0" />
              <span>{truckLocation.address}</span>
            </div>
          )}

          <p className="text-muted-foreground pt-1 border-t text-[10px]">
            Updates every 30s via Samsara · Green = On Time · Amber = At Risk · Red = Late
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
