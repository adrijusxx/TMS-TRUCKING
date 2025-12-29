'use client';

/**
 * War Room Page
 * 
 * High-level overview of all fleet assets with clustered markers.
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 2
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Load WarRoomMap client-side only (no SSR for Google Maps)
const WarRoomMap = dynamic(
  () => import('@/components/map/WarRoomMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="space-y-2 text-center">
          <Skeleton className="h-8 w-32 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function WarRoomPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">War Room</h1>
        <p className="text-muted-foreground">
          Real-time fleet overview with clustered asset visualization
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)] min-h-[500px]">
        <WarRoomMap />
      </div>
    </div>
  );
}
