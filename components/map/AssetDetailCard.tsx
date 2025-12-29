'use client';

/**
 * Asset Detail Card - Floating hover card for map assets
 * Shows truck/load info, diagnostics, and ETA in a compact tabbed interface
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  X, Truck, Package, User, Phone, Navigation, Gauge,
  AlertTriangle, Clock, MapPin, Activity, Thermometer, Fuel
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { MapAsset } from './UnifiedWarRoom';
import type { TruckSensors, TruckDiagnostics } from '@/lib/maps/live-map-service';

interface AssetDetailCardProps {
  asset: MapAsset;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function AssetDetailCard({ asset, position, onClose }: AssetDetailCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to keep card in viewport
  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const padding = 16;

    let x = position.x + 10;
    let y = position.y - 10;

    // Adjust horizontal position
    if (x + rect.width > window.innerWidth - padding) {
      x = position.x - rect.width - 10;
    }

    // Adjust vertical position
    if (y + rect.height > window.innerHeight - padding) {
      y = window.innerHeight - rect.height - padding;
    }
    if (y < padding) {
      y = padding;
    }

    setAdjustedPosition({ x, y });
  }, [position]);

  const isTruck = asset.type === 'TRUCK';
  const truckData = asset.truckData;
  // Use loadData from asset, or fallback to truck activeLoad
  const loadData = asset.loadData || (truckData?.activeLoad ? {
    id: truckData.activeLoad.id,
    loadNumber: truckData.activeLoad.loadNumber,
    status: truckData.activeLoad.status,
    // Generate simple route description from stops
    routeDescription: truckData.activeLoad.stops.length > 0
      ? `${truckData.activeLoad.stops[0].city || ''}, ${truckData.activeLoad.stops[0].state || ''} → ${truckData.activeLoad.stops[truckData.activeLoad.stops.length - 1].city || ''}, ${truckData.activeLoad.stops[truckData.activeLoad.stops.length - 1].state || ''}`
      : 'Active Load',
    // Construct delivery object for ETA tab compatibility
    delivery: truckData.activeLoad.stops.length > 0 ? {
      address: truckData.activeLoad.stops[truckData.activeLoad.stops.length - 1].formattedAddress,
      // We don't have lat/lng here but ETA doesn't use it for display
    } : undefined,
    // Construct pickup object
    pickup: truckData.activeLoad.stops.length > 0 ? {
      address: truckData.activeLoad.stops[0].formattedAddress,
    } : undefined,
  } : undefined);

  // Get sensors from truck data OR load's truck sensors
  const sensors = truckData?.sensors || (loadData as any)?.truckSensors;
  const diagnostics = truckData?.diagnostics || (loadData as any)?.truckDiagnostics;

  // Helper to extract value from Samsara objects (can be {time, value} or direct value)
  const extractValue = (data: any): any => {
    if (data === null || data === undefined) return undefined;
    if (typeof data === 'object' && 'value' in data) return data.value;
    return data;
  };

  // DEBUG: Log truckData and sensors to trace data flow (remove after fix)
  console.log('[AssetDetailCard] Debug:', {
    truckNumber: truckData?.truckNumber || loadData?.loadNumber,
    hasTruckData: !!truckData,
    hasLoadData: !!loadData,
    hasSensors: !!sensors,
    rawFuelPercent: sensors?.fuelPercent,
    rawFuelPercentType: typeof sensors?.fuelPercent,
    rawEngineState: sensors?.engineState,
    rawEngineStateType: typeof sensors?.engineState,
    rawSpeed: sensors?.speed,
    locationAddress: truckData?.location?.address,
  });


  // Get fuel percent with proper extraction (handles arrays, objects, and numbers)
  const fuelPercent = (() => {
    const fuel = sensors?.fuelPercent;
    if (fuel === undefined || fuel === null) return undefined;

    // Handle array format (Samsara often returns arrays for stats)
    if (Array.isArray(fuel) && fuel.length > 0) {
      const first = fuel[0];
      return typeof first === 'object' && first !== null ? first.value : first;
    }

    // Handle object format
    if (typeof fuel === 'object' && fuel !== null && 'value' in fuel) {
      return (fuel as { value: number }).value;
    }

    // Handle number format
    if (typeof fuel === 'number') return fuel;

    return undefined;
  })();

  // Get speed from sensors or asset speed
  const speed = (() => {
    const sensorSpeed = sensors?.speed;
    if (sensorSpeed?.value !== undefined) return sensorSpeed.value;
    return asset.speed || 0;
  })();

  // Calculate ETA (simplified - would need actual route data)
  const eta = loadData?.delivery ? calculateSimpleETA(speed, 100) : null;

  return (
    <Card
      ref={cardRef}
      className="fixed z-50 w-72 shadow-xl border-2"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <CardHeader className="py-2 px-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTruck ? (
              <Truck className="h-4 w-4 text-blue-600" />
            ) : (
              <Package className="h-4 w-4 text-purple-600" />
            )}
            <span className="font-semibold text-sm">{asset.label}</span>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] h-4",
                asset.status === 'MOVING' && 'bg-green-100 text-green-700',
                asset.status === 'STOPPED' && 'bg-amber-100 text-amber-700',
                asset.status === 'DELAYED' && 'bg-red-100 text-red-700',
                asset.status === 'IDLE' && 'bg-gray-100 text-gray-700',
              )}
            >
              {asset.status}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full h-7 rounded-none border-b">
            <TabsTrigger value="overview" className="text-[10px] h-6 flex-1">Overview</TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-[10px] h-6 flex-1">Diagnostics</TabsTrigger>
            <TabsTrigger value="eta" className="text-[10px] h-6 flex-1">ETA</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-3 space-y-3 mt-0">
            {/* Speed, Fuel & Key Metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-muted/50 rounded text-center">
                <Gauge className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-lg font-bold">{Math.round(speed)}</p>
                <p className="text-[10px] text-muted-foreground">mph</p>
              </div>
              <div className="p-2 bg-muted/50 rounded text-center">
                <Fuel className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <p className="text-lg font-bold">
                  {fuelPercent !== undefined ? Math.round(fuelPercent) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground">% fuel</p>
              </div>
              <div className="p-2 bg-muted/50 rounded text-center">
                <Navigation className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <p className="text-lg font-bold">{asset.heading ? Math.round(asset.heading) : '—'}</p>
                <p className="text-[10px] text-muted-foreground">heading°</p>
              </div>
            </div>

            {/* Engine State */}
            {sensors?.engineState && (
              <div className="flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-xs">
                <span className="text-muted-foreground">Engine</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    extractValue(sensors.engineState) === 'On' && 'bg-green-50 text-green-700',
                    extractValue(sensors.engineState) === 'Off' && 'bg-gray-50 text-gray-700',
                    extractValue(sensors.engineState) === 'Idle' && 'bg-amber-50 text-amber-700',
                  )}
                >
                  {extractValue(sensors.engineState)}
                </Badge>
              </div>
            )}

            {/* Odometer */}
            {sensors?.odometerMiles !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Odometer</span>
                <span className="font-medium">{Number(sensors.odometerMiles).toLocaleString()} mi</span>
              </div>
            )}

            {/* Driver Info */}
            {(loadData as any)?.driver && (
              <div className="flex items-center justify-between py-2 border-t">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="font-medium">{(loadData as any).driver.name}</p>
                    <p className="text-muted-foreground">#{(loadData as any).driver.driverNumber}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                  <Phone className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Truck Info & Location */}
            {(truckData || (loadData as any)?.truck) && (
              <div className="py-2 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Truck className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {truckData?.truckNumber || (loadData as any)?.truck?.truckNumber}
                  </span>
                  {(truckData?.status || (loadData as any)?.truck) && (
                    <Badge variant="outline" className="text-[9px] h-4">
                      {truckData?.status || 'ASSIGNED'}
                    </Badge>
                  )}
                </div>

                {/* Location Address - ADDED per user request */}
                {(asset.truckData?.location?.address || asset.loadData?.truckLocation?.address) && (
                  <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground pl-4.5">
                    <MapPin className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    <span className="leading-tight">
                      {asset.truckData?.location?.address || asset.loadData?.truckLocation?.address}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Load Route */}
            {loadData?.routeDescription && (
              <div className="py-2 border-t text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Route</span>
                </div>
                <p className="font-medium">{loadData.routeDescription}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {isTruck ? (
                // Only show View Truck if it's NOT a SAMSARA_ONLY vehicle
                !asset.id.startsWith('samsara-') && (
                  <Link href={`/dashboard/trucks/${asset.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs w-full">
                      View Truck record
                    </Button>
                  </Link>
                )
              ) : (
                <Link href={`/dashboard/loads/${asset.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs w-full">
                    View Load
                  </Button>
                </Link>
              )}
            </div>
          </TabsContent>

          {/* Diagnostics Tab */}
          <TabsContent value="diagnostics" className="p-3 space-y-2 mt-0">
            {diagnostics ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Faults</span>
                  <Badge variant={diagnostics.activeFaults > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                    {diagnostics.activeFaults}
                  </Badge>
                </div>

                {diagnostics.checkEngineLightOn && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Check Engine Light On</span>
                  </div>
                )}

                {(diagnostics as any).faults.slice(0, 3).map((fault: any, i: number) => (
                  <div key={i} className="p-2 bg-muted/50 rounded text-xs">
                    <p className="font-medium">{fault.code || 'Unknown'}</p>
                    <p className="text-muted-foreground truncate">{fault.description || 'No description'}</p>
                  </div>
                ))}

                {diagnostics.faults.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    <Activity className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    No active faults
                  </div>
                )}
              </>
            ) : sensors ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Speed */}
                  {sensors.speed?.value !== undefined && (
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-[10px]">Speed</p>
                      <p className="font-semibold text-sm">{Math.round(Number(sensors.speed.value))} mph</p>
                      {sensors.speed.limit && (
                        <p className="text-[10px] text-muted-foreground">Limit: {sensors.speed.limit} mph</p>
                      )}
                    </div>
                  )}
                  {/* Fuel */}
                  {fuelPercent !== undefined && (
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-[10px]">Fuel Level</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              fuelPercent > 50 ? 'bg-green-500' :
                                fuelPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${fuelPercent}%` }}
                          />
                        </div>
                        <span className="font-semibold">{Math.round(fuelPercent)}%</span>
                      </div>
                    </div>
                  )}
                  {/* Odometer */}
                  {sensors.odometerMiles !== undefined && (
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-[10px]">Odometer</p>
                      <p className="font-semibold text-sm">{Number(sensors.odometerMiles).toLocaleString()} mi</p>
                    </div>
                  )}
                  {/* Engine Hours */}
                  {sensors.engineHours !== undefined && (
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-[10px]">Engine Hours</p>
                      <p className="font-semibold text-sm">{Math.round(Number(sensors.engineHours)).toLocaleString()} hrs</p>
                    </div>
                  )}
                  {/* Engine State */}
                  {sensors.engineState && (
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-[10px]">Engine State</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] mt-1",
                          String(sensors.engineState) === 'On' && 'bg-green-50 text-green-700',
                          String(sensors.engineState) === 'Off' && 'bg-gray-100',
                          String(sensors.engineState) === 'Idle' && 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {String(sensors.engineState)}
                      </Badge>
                    </div>
                  )}
                  {/* Seatbelt Status */}
                  {sensors.seatbeltStatus && (
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="text-muted-foreground text-[10px]">Seatbelt</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] mt-1",
                          String(sensors.seatbeltStatus) === 'Buckled' && 'bg-green-50 text-green-700',
                          String(sensors.seatbeltStatus) === 'Unbuckled' && 'bg-red-50 text-red-700',
                        )}
                      >
                        {String(sensors.seatbeltStatus)}
                      </Badge>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <Activity className="h-6 w-6 mx-auto mb-1 opacity-50" />
                No diagnostics data
                <p className="mt-1">Samsara integration required</p>
              </div>
            )}
          </TabsContent>

          {/* ETA Tab */}
          <TabsContent value="eta" className="p-3 space-y-3 mt-0">
            {loadData ? (
              <>
                {/* Next Stop */}
                <div className="text-xs">
                  <p className="text-muted-foreground mb-1">Next Stop</p>
                  <p className="font-medium">
                    {loadData.status.includes('PICKUP') ? 'Pickup' : 'Delivery'}
                  </p>
                  {loadData.delivery && (
                    <p className="text-muted-foreground">
                      {loadData.delivery.address || 'Address not available'}
                    </p>
                  )}
                </div>

                {/* ETA Display */}
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Estimated Arrival</span>
                  </div>
                  {eta ? (
                    <>
                      <p className="text-2xl font-bold text-primary">{eta.time}</p>
                      <p className="text-xs text-muted-foreground">{eta.distance} mi remaining</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-2 text-[10px]",
                          eta.status === 'ON_TIME' && 'bg-green-50 text-green-700 border-green-200',
                          eta.status === 'AT_RISK' && 'bg-amber-50 text-amber-700 border-amber-200',
                          eta.status === 'LATE' && 'bg-red-50 text-red-700 border-red-200',
                        )}
                      >
                        {eta.status === 'ON_TIME' ? 'On Time' : eta.status === 'AT_RISK' ? 'At Risk' : 'Running Late'}
                      </Badge>
                    </>
                  ) : (
                    <p className="text-lg font-medium text-muted-foreground">—</p>
                  )}
                </div>

                {/* Load Status */}
                <div className="flex items-center justify-between py-2 border-t text-xs">
                  <span className="text-muted-foreground">Load Status</span>
                  <Badge variant="outline">{loadData.status.replace(/_/g, ' ')}</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-1 opacity-50" />
                No active load
                <p className="mt-1">ETA available when load is assigned</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface ETAResult {
  time: string;
  distance: number;
  status: 'ON_TIME' | 'AT_RISK' | 'LATE';
}

function calculateSimpleETA(currentSpeed: number, remainingMiles: number): ETAResult | null {
  if (remainingMiles <= 0) return null;

  // Use average speed of 55 mph if currently stopped
  const avgSpeed = currentSpeed > 0 ? Math.min(currentSpeed, 65) : 55;
  const hoursRemaining = remainingMiles / avgSpeed;
  const arrivalTime = new Date(Date.now() + hoursRemaining * 3600000);

  // Format time
  const time = arrivalTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Determine status (simplified)
  let status: ETAResult['status'] = 'ON_TIME';
  if (hoursRemaining > 8) status = 'AT_RISK';
  if (currentSpeed === 0 && remainingMiles > 50) status = 'LATE';

  return {
    time,
    distance: Math.round(remainingMiles),
    status,
  };
}

