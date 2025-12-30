'use client';

import { Badge } from '@/components/ui/badge';
import type { TruckDiagnostics, TruckSensors } from '@/lib/maps/live-map-service';
import { AlertTriangle, Gauge, Fuel } from 'lucide-react';

export interface MinimalTruckInfoData {
  truckNumber: string;
  status?: string;
  diagnostics?: TruckDiagnostics;
  sensors?: TruckSensors;
  location?: {
    speed?: number;
    speedMilesPerHour?: number;
    heading?: number;
    address?: string;
  };
}

interface MinimalTruckInfoProps {
  data: MinimalTruckInfoData;
}

export function MinimalTruckInfo({ data }: MinimalTruckInfoProps) {
  // Normalize status
  const activeStatus = data.status === 'IN_USE' || data.status === 'AVAILABLE'
    ? 'Active'
    : data.status || 'Unknown';

  // Get speed from multiple sources
  const speed = data.sensors?.speed?.value
    ?? data.location?.speed
    ?? data.location?.speedMilesPerHour;

  // Get fuel from sensors - validate it's a valid finite number
  const rawFuelPercent = data.sensors?.fuelPercent;
  const fuelPercent = typeof rawFuelPercent === 'number' && isFinite(rawFuelPercent)
    ? rawFuelPercent
    : undefined;

  // Fault info
  const activeFaults = data.diagnostics?.activeFaults ?? 0;
  const hasActiveFaults = activeFaults > 0;

  return (
    <div className="w-[180px]" style={{ margin: '-6px -10px', padding: '6px 8px' }}>
      {/* Header: Truck # + Status + Faults */}
      <div className="flex items-center gap-1 pb-0.5 mb-0.5 border-b border-border">
        <span className="font-bold text-xs text-foreground">{data.truckNumber}</span>
        <Badge
          variant={activeStatus === 'Active' ? 'default' : 'outline'}
          className="text-[9px] px-1 py-0 h-[16px] leading-tight"
        >
          {activeStatus}
        </Badge>
        {hasActiveFaults && (
          <Badge
            variant="warning-outline"
            className="text-[9px] px-1 py-0 h-[16px] leading-tight"
          >
            <AlertTriangle className="h-2 w-2 mr-0.5" />
            {activeFaults}
          </Badge>
        )}
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-0.5">
          <Gauge className="h-2.5 w-2.5 text-muted-foreground/70" />
          <span>Speed</span>
        </div>
        <span className={speed !== undefined ? 'font-semibold text-foreground' : 'text-muted-foreground/70'}>
          {speed !== undefined ? `${Math.round(speed)} mph` : '—'}
        </span>

        <div className="flex items-center gap-0.5">
          <Fuel className="h-2.5 w-2.5 text-muted-foreground/70" />
          <span>Fuel</span>
        </div>
        <span className={fuelPercent !== undefined ? 'font-semibold text-foreground' : 'text-muted-foreground/70'}>
          {fuelPercent !== undefined ? `${Math.round(fuelPercent)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

