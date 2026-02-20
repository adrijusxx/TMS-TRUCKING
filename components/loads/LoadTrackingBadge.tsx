'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Gauge } from 'lucide-react';
import { useLoadTracking, LoadTrackingData } from '@/hooks/useLoadTracking';

const ACTIVE_STATUSES = new Set([
  'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY',
]);

interface Props {
  tracking?: LoadTrackingData | undefined;
  isLoading?: boolean;
  loadStatus?: string;
  compact?: boolean;
}

const etaColors = {
  ON_TIME: 'bg-green-100 text-green-700 border-green-200',
  AT_RISK: 'bg-amber-100 text-amber-700 border-amber-200',
  LATE: 'bg-red-100 text-red-700 border-red-200',
} as const;

export default function LoadTrackingBadge({ tracking, isLoading, loadStatus, compact }: Props) {
  if (loadStatus && !ACTIVE_STATUSES.has(loadStatus)) return null;
  if (isLoading) return <Skeleton className="h-5 w-20" />;
  if (!tracking || tracking.proximityStatus === 'NO_DATA') return null;

  const { proximityStatus, proximityMiles, eta, truckLocation, nextStop } = tracking;
  const speed = truckLocation?.speed ?? 0;
  const stopLabel = nextStop?.stopType === 'PICKUP' ? 'pickup' : 'delivery';

  if (proximityStatus === 'AT_STOP') {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] h-5 gap-1">
          <MapPin className="h-3 w-3" /> At {stopLabel}
        </Badge>
      </div>
    );
  }

  if (proximityStatus === 'APPROACHING') {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] h-5 gap-1">
          <Navigation className="h-3 w-3" /> ~{proximityMiles} mi from {stopLabel}
        </Badge>
        {!compact && speed > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Gauge className="h-2.5 w-2.5" /> {Math.round(speed)} mph
          </span>
        )}
      </div>
    );
  }

  // EN_ROUTE
  if (!eta) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="outline" className={`${etaColors[eta.status]} text-[10px] h-5 gap-1`}>
        <Navigation className="h-3 w-3" /> ETA {eta.etaFormatted}
      </Badge>
      {!compact && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          {speed > 0 && <><Gauge className="h-2.5 w-2.5" /> {Math.round(speed)} mph &middot; </>}
          {eta.remainingMiles} mi to {stopLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Self-fetching variant: accepts a loadId and fetches tracking data via the hook.
 * Used in table columns and dispatch board cards where data isn't pre-fetched.
 */
export function SelfFetchingTrackingBadge({
  loadId, loadStatus, compact,
}: { loadId: string; loadStatus?: string; compact?: boolean }) {
  const isActive = !loadStatus || ACTIVE_STATUSES.has(loadStatus);
  const { data, isLoading } = useLoadTracking(loadId, isActive);

  if (!isActive) return null;

  return (
    <LoadTrackingBadge
      tracking={data}
      isLoading={isLoading}
      loadStatus={loadStatus}
      compact={compact}
    />
  );
}
