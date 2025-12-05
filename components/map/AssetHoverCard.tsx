'use client';

/**
 * Asset Hover Card
 * 
 * Displays asset details when clicking a marker on the War Room map.
 * Fetches full details via React Query (per OPERATIONAL_OVERHAUL spec).
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 2.2
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Truck, Package, User, MapPin, Clock, Phone, ArrowRight } from 'lucide-react';
import type { MapPoint } from '@/lib/types/map-point';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface AssetHoverCardProps {
  point: MapPoint;
  position: { x: number; y: number };
  onClose: () => void;
}

interface TruckDetails {
  id: string;
  truckNumber: string;
  status: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  driver?: {
    name: string;
    phone?: string;
  };
  currentLoad?: {
    loadNumber: string;
    status: string;
    destination?: string;
  };
}

interface LoadDetails {
  id: string;
  loadNumber: string;
  status: string;
  customer?: { name: string };
  driver?: { name: string };
  truck?: { truckNumber: string };
  pickupCity?: string;
  pickupState?: string;
  deliveryCity?: string;
  deliveryState?: string;
  revenue?: number;
}

// ============================================
// COMPONENT
// ============================================

export function AssetHoverCard({ point, position, onClose }: AssetHoverCardProps) {
  // Fetch details based on type
  const { data, isLoading } = useQuery({
    queryKey: ['asset-details', point.type, point.id],
    queryFn: async () => {
      const endpoint = point.type === 'TRUCK' 
        ? `/api/trucks/${point.id}`
        : point.type === 'LOAD'
          ? `/api/loads/${point.id}`
          : `/api/drivers/${point.id}`;
      
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch details');
      const json = await res.json();
      return json.data || json;
    },
    staleTime: 60000, // 1 minute
  });

  // Calculate position (keep card in viewport)
  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x + 10, window.innerWidth - 320),
    top: Math.min(position.y - 10, window.innerHeight - 300),
    zIndex: 1000,
    width: 300,
  };

  const statusColor = {
    MOVING: 'bg-green-500',
    STOPPED: 'bg-amber-500',
    DELAYED: 'bg-red-500',
    IDLE: 'bg-gray-500',
  }[point.status] || 'bg-gray-500';

  return (
    <Card style={cardStyle} className="shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {point.type === 'TRUCK' && <Truck className="h-4 w-4" />}
            {point.type === 'LOAD' && <Package className="h-4 w-4" />}
            {point.type === 'DRIVER' && <User className="h-4 w-4" />}
            {point.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${statusColor} text-white text-xs`}>
              {point.status}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Truck Details */}
            {point.type === 'TRUCK' && (
              <TruckDetailsContent data={data as TruckDetails} />
            )}

            {/* Load Details */}
            {point.type === 'LOAD' && (
              <LoadDetailsContent data={data as LoadDetails} />
            )}

            {/* View Full Details Link */}
            <div className="pt-2 border-t">
              <Link 
                href={`/dashboard/${point.type.toLowerCase()}s/${point.id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View full details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No details available</p>
        )}

        {/* Location info */}
        <div className="mt-3 pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function TruckDetailsContent({ data }: { data: TruckDetails }) {
  return (
    <>
      <div className="text-sm">
        <span className="font-medium">{data.truckNumber}</span>
        {data.make && data.model && (
          <span className="text-muted-foreground ml-2">
            {data.year} {data.make} {data.model}
          </span>
        )}
      </div>

      {data.driver && (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{data.driver.name}</span>
          {data.driver.phone && (
            <a href={`tel:${data.driver.phone}`} className="text-primary">
              <Phone className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {data.currentLoad && (
        <div className="bg-muted/50 rounded p-2 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3" />
            <span className="font-medium">Load {data.currentLoad.loadNumber}</span>
            <Badge variant="outline" className="text-xs">
              {data.currentLoad.status}
            </Badge>
          </div>
          {data.currentLoad.destination && (
            <div className="text-xs text-muted-foreground mt-1">
              → {data.currentLoad.destination}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function LoadDetailsContent({ data }: { data: LoadDetails }) {
  return (
    <>
      <div className="text-sm">
        <span className="font-medium">Load #{data.loadNumber}</span>
        <Badge variant="outline" className="ml-2 text-xs">
          {data.status}
        </Badge>
      </div>

      {data.customer && (
        <div className="text-sm text-muted-foreground">
          Customer: {data.customer.name}
        </div>
      )}

      <div className="bg-muted/50 rounded p-2 text-sm space-y-1">
        {data.pickupCity && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{data.pickupCity}, {data.pickupState}</span>
          </div>
        )}
        {data.deliveryCity && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>{data.deliveryCity}, {data.deliveryState}</span>
          </div>
        )}
      </div>

      {data.driver && (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{data.driver.name}</span>
        </div>
      )}

      {data.truck && (
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-3 w-3 text-muted-foreground" />
          <span>{data.truck.truckNumber}</span>
        </div>
      )}

      {data.revenue !== undefined && (
        <div className="text-sm font-medium text-green-600">
          ${data.revenue.toLocaleString()}
        </div>
      )}
    </>
  );
}





