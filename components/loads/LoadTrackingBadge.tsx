'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Navigation, Gauge, CheckCircle2, Circle, SignalZero } from 'lucide-react';
import { useLoadTracking, LoadTrackingData } from '@/hooks/useLoadTracking';

const TRACKING_TOOLTIP = 'Live GPS via Samsara, updates every 30s. ETA based on current speed and distance. Green = On Time, Amber = At Risk, Red = Late.';

const ACTIVE_STATUSES = new Set([
  'ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY',
]);

const DEFAULT_TRACKING_WINDOW_DAYS = 7;

const COMPLETED_STATUSES = new Set([
  'DELIVERED', 'BILLED', 'READY_TO_BILL', 'READY_TO_SETTLE', 'SETTLED', 'PAID', 'INVOICED',
]);

const PRE_DISPATCH_STATUSES = new Set([
  'DRAFT', 'PENDING', 'QUOTED', 'BOOKED',
]);

function isWithinTrackingWindow(pickupDate: Date | string, windowDays?: number): boolean {
  const days = windowDays ?? DEFAULT_TRACKING_WINDOW_DAYS;
  const pickup = new Date(pickupDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return pickup >= cutoff;
}

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
  if (!tracking || tracking.proximityStatus === 'NO_DATA') {
    return (
      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
        <SignalZero className="h-3 w-3" /> No GPS
      </span>
    );
  }

  const { proximityStatus, proximityMiles, eta, truckLocation, nextStop } = tracking;
  const speed = truckLocation?.speed ?? 0;
  const stopLabel = nextStop?.stopType === 'PICKUP' ? 'pickup' : 'delivery';

  let content: React.ReactNode = null;

  if (proximityStatus === 'AT_STOP') {
    content = (
      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] h-5 gap-1 whitespace-nowrap">
        <MapPin className="h-3 w-3" /> At {stopLabel}
      </Badge>
    );
  } else if (proximityStatus === 'APPROACHING') {
    content = (
      <>
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] h-5 gap-1 whitespace-nowrap">
          <Navigation className="h-3 w-3" /> ~{proximityMiles} mi from {stopLabel}
        </Badge>
        {!compact && speed > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Gauge className="h-2.5 w-2.5" /> {Math.round(speed)} mph
          </span>
        )}
      </>
    );
  } else if (eta) {
    content = (
      <>
        <Badge variant="outline" className={`${etaColors[eta.status]} text-[10px] h-5 gap-1 whitespace-nowrap`}>
          <Navigation className="h-3 w-3" /> ETA {eta.etaFormatted}
        </Badge>
        {!compact && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            {speed > 0 && <><Gauge className="h-2.5 w-2.5" /> {Math.round(speed)} mph &middot; </>}
            {eta.remainingMiles} mi to {stopLabel}
          </span>
        )}
      </>
    );
  }

  if (!content) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-0.5 cursor-help whitespace-nowrap">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {TRACKING_TOOLTIP}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Self-fetching variant: accepts a loadId and fetches tracking data via the hook.
 * Used in table columns and dispatch board cards where data isn't pre-fetched.
 */
function isPastDeliveryCutoff(deliveryDate: Date | string): boolean {
  const delivery = new Date(deliveryDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  return delivery < cutoff;
}

export function SelfFetchingTrackingBadge({
  loadId, loadStatus, pickupDate, deliveryDate, compact,
}: { loadId: string; loadStatus?: string; pickupDate?: Date | string | null; deliveryDate?: Date | string | null; compact?: boolean }) {
  const isActive = !loadStatus || ACTIVE_STATUSES.has(loadStatus);
  const isRecent = !pickupDate || isWithinTrackingWindow(pickupDate);
  const isNotPastDelivery = !deliveryDate || !isPastDeliveryCutoff(deliveryDate);
  const shouldTrack = isActive && isRecent && isNotPastDelivery;
  const { data, isLoading } = useLoadTracking(loadId, shouldTrack);

  if (!shouldTrack) {
    if (loadStatus && COMPLETED_STATUSES.has(loadStatus)) {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Delivered
        </span>
      );
    }
    if (loadStatus === 'CANCELLED') {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          — Cancelled
        </span>
      );
    }
    if (loadStatus && PRE_DISPATCH_STATUSES.has(loadStatus)) {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Circle className="h-3 w-3" /> Pending
        </span>
      );
    }
    if (loadStatus === 'AT_DELIVERY') {
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> At delivery
        </span>
      );
    }
    return (
      <span className="text-[10px] text-muted-foreground">—</span>
    );
  }

  return (
    <LoadTrackingBadge
      tracking={data}
      isLoading={isLoading}
      loadStatus={loadStatus}
      compact={compact}
    />
  );
}
