'use client';

import { createRoot } from 'react-dom/client';
import { Truck, Package, User, MapPin, Gauge, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MinimalTruckInfo, type MinimalTruckInfoData } from './MinimalTruckInfo';
import type { MapLocation, TruckDiagnostics, TruckSensors } from '@/lib/maps/live-map-service';

export interface InfoWindowData {
  title: string;
  subtitle?: string;
  location?: MapLocation;
  driverName?: string;
  loadNumber?: string;
  status?: string;
  speed?: number;
  diagnostics?: TruckDiagnostics;
  sensors?: TruckSensors;
  dispatcher?: {
    firstName: string;
    lastName: string;
  };
  routeDescription?: string;
  minimal?: boolean; // Use minimal view mode
}

declare global {
  interface Window {
    google: any;
  }
}

export class CustomInfoWindow {
  private infoWindow: any;
  private container: HTMLDivElement | null = null;
  private root: ReturnType<typeof createRoot> | null = null;

  constructor(map: any) {
    this.container = document.createElement('div');
    this.infoWindow = new (window.google?.maps?.InfoWindow || (class {}))({
      content: this.container,
    });
  }

  open(map: any, marker: any, data: InfoWindowData): void {
    if (!this.container) return;

    // Create root only once, reuse it for subsequent renders
    if (!this.root) {
      this.root = createRoot(this.container);
    }

    // Use minimal view if requested
    if (data.minimal) {
      // Extract truck number from title (remove "Truck " prefix if present)
      const truckNumber = data.title.replace(/^Truck\s+/i, '').replace(/\s*\(Samsara Only\)/i, '').trim();
      // Pass location with all its fields including speed
      const locationData = data.location ? {
        speed: data.location.speed ?? (data.location as any).speedMilesPerHour,
        speedMilesPerHour: (data.location as any).speedMilesPerHour,
        heading: data.location.heading,
        address: data.location.address,
      } : undefined;
      
      const minimalData: MinimalTruckInfoData = {
        truckNumber,
        status: data.status,
        diagnostics: data.diagnostics,
        sensors: data.sensors,
        location: locationData,
      };
      this.root.render(<MinimalTruckInfo data={minimalData} />);
    } else {
      this.root.render(<InfoWindowContent data={data} />);
    }

    this.infoWindow.open(map, marker);
  }

  close(): void {
    this.infoWindow.close();
  }

  getInfoWindow(): any {
    return this.infoWindow;
  }
}

function InfoWindowContent({ data }: { data: InfoWindowData }) {
  const hasActiveFaults = (data.diagnostics?.activeFaults ?? 0) > 0;
  const speed = data.sensors?.speed?.value ?? data.speed;

  return (
    <div className="p-3 min-w-[200px] max-w-[300px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-blue-600" />
            {data.title}
          </h3>
          {data.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{data.subtitle}</p>
          )}
        </div>
        {hasActiveFaults && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {data.diagnostics?.activeFaults} fault{data.diagnostics?.activeFaults !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        {data.loadNumber && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span>Load: {data.loadNumber}</span>
          </div>
        )}

        {data.driverName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{data.driverName}</span>
          </div>
        )}

        {data.dispatcher && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>Dispatcher: {data.dispatcher.firstName} {data.dispatcher.lastName}</span>
          </div>
        )}

        {data.status && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline" className="text-xs">
              {data.status}
            </Badge>
          </div>
        )}

        {speed !== undefined && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" />
            <span>{Math.round(speed)} mph</span>
          </div>
        )}

        {typeof data.sensors?.fuelPercent === 'number' && isFinite(data.sensors.fuelPercent) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>Fuel: {Math.round(data.sensors.fuelPercent)}%</span>
          </div>
        )}

        {data.routeDescription && (
          <div className="flex items-start gap-1.5 text-muted-foreground pt-1 border-t">
            <span className="text-xs">{data.routeDescription}</span>
          </div>
        )}

        {data.location?.address && (
          <div className="flex items-start gap-1.5 text-muted-foreground pt-1 border-t">
            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span className="text-xs">{data.location.address}</span>
          </div>
        )}

        {data.location?.lastUpdated && (
          <div className="text-xs text-muted-foreground pt-1">
            Updated: {new Date(data.location.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

