'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Share2,
  X,
  Gauge,
  Fuel,
  Clock3,
  Activity,
  AlertTriangle,
  Camera,
  History,
  MapPin,
  Navigation,
} from 'lucide-react';
import type {
  MapLocation,
  TruckDiagnostics,
  TruckSensors,
  TruckMedia,
  TruckTrip,
} from '@/lib/maps/live-map-service';
import type { ReactNode } from 'react';

interface TruckDetailsPanelProps {
  truck: {
    truckId: string;
    truckNumber: string;
    status?: string;
    loadNumber?: string;
    trailerNumber?: string;
    driverName?: string;
    location?: MapLocation;
    diagnostics?: TruckDiagnostics;
    matchSource?: string;
    sensors?: TruckSensors;
    latestMedia?: TruckMedia;
    recentTrips?: TruckTrip[];
  };
  onClose: () => void;
  onCenterMap?: () => void;
}

/** Validate fuel percent is a finite number */
function isValidFuelPercent(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

function SeatbeltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="10" width="8" height="4" rx="1" />
      <rect x="14" y="10" width="8" height="4" rx="1" />
      <path d="M10 12h4" />
    </svg>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-md border px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold">{value ?? '—'}</div>
    </div>
  );
}

export function TruckDetailsPanel({ truck, onClose, onCenterMap }: TruckDetailsPanelProps) {
  const [detailTab, setDetailTab] = useState('overview');

  // Reset to overview when truck changes
  useEffect(() => {
    setDetailTab('overview');
  }, [truck.truckId]);


  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Truck {truck.truckNumber}</CardTitle>
          <CardDescription>
            {truck.loadNumber
              ? `Assigned to load ${truck.loadNumber}`
              : 'Unassigned truck'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onCenterMap && truck.location && (
            <Button variant="outline" size="sm" onClick={onCenterMap}>
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              Center
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sensors" className="text-xs sm:text-sm">
              Sensors
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-xs sm:text-sm">
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="media" className="text-xs sm:text-sm">
              Media
            </TabsTrigger>
            <TabsTrigger value="trips" className="text-xs sm:text-sm">
              Trips
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 pt-4">
            {/* Full Location */}
            {truck.location ? (
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase text-muted-foreground mb-1">Current Location</div>
                    <div className="text-sm font-semibold break-words">
                      {truck.location.address || 
                       (truck.location.lat !== undefined && truck.location.lng !== undefined
                         ? `${truck.location.lat.toFixed(6)}, ${truck.location.lng.toFixed(6)}`
                         : 'Location unavailable')}
                    </div>
                    {truck.location.lat !== undefined && truck.location.lng !== undefined && !truck.location.address && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Coordinates: {truck.location.lat.toFixed(6)}, {truck.location.lng.toFixed(6)}
                      </div>
                    )}
                    {truck.location.lastUpdated && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Updated: {new Date(truck.location.lastUpdated).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                No live location for this truck.
              </div>
            )}

            {/* Key Metrics: Speed and Fuel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Speed */}
              <div className="rounded-lg border p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
                <div className="flex items-center gap-3 mb-2">
                  <Gauge className="h-5 w-5 text-blue-600" />
                  <div className="text-xs uppercase text-muted-foreground">Current Speed</div>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {truck.sensors?.speed?.value !== undefined
                    ? `${Math.round(truck.sensors.speed.value)} mph`
                    : truck.location?.speed !== undefined
                    ? `${Math.round(truck.location.speed)} mph`
                    : 'No data'}
                </div>
                {truck.sensors?.speed?.limit !== undefined && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Speed limit: {Math.round(truck.sensors.speed.limit)} mph
                  </div>
                )}
                {!truck.sensors?.speed?.value && !truck.location?.speed && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Speed data not available
                  </div>
                )}
              </div>

              {/* Fuel Level */}
              <div className="rounded-lg border p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
                <div className="flex items-center gap-3 mb-2">
                  <Fuel className="h-5 w-5 text-green-600" />
                  <div className="text-xs uppercase text-muted-foreground">Fuel Level</div>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {isValidFuelPercent(truck.sensors?.fuelPercent)
                    ? `${Math.round(truck.sensors.fuelPercent)}%`
                    : 'No data'}
                </div>
                {isValidFuelPercent(truck.sensors?.fuelPercent) ? (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          truck.sensors.fuelPercent > 50
                            ? 'bg-green-600'
                            : truck.sensors.fuelPercent > 25
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${truck.sensors.fuelPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    Fuel data not available
                  </div>
                )}
              </div>
            </div>

            {/* Camera/Media Preview - Always show section */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-purple-600" />
                <div className="text-xs uppercase text-muted-foreground">
                  Latest Camera Feed
                  {truck.latestMedia?.cameraType && ` • ${truck.latestMedia.cameraType}`}
                </div>
              </div>
              {truck.latestMedia?.url ? (
                <>
                  <div className="overflow-hidden rounded-lg border bg-muted/30">
                    <img
                      src={truck.latestMedia.url}
                      alt={`Camera feed from ${truck.latestMedia.cameraType || 'camera'}`}
                      className="w-full h-auto max-h-64 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground">
                              <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Unable to load camera image</span>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                  {truck.latestMedia.capturedAt && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Captured: {new Date(truck.latestMedia.capturedAt).toLocaleString()}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                  <Camera className="h-8 w-8 mb-2 opacity-50" />
                  <span>No camera feed available</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {truck.trailerNumber && (
                <div className="rounded-lg border p-4 text-sm">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Trailer</div>
                  <div className="font-medium">#{truck.trailerNumber}</div>
                </div>
              )}
              {truck.driverName && (
                <div className="rounded-lg border p-4 text-sm">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Driver</div>
                  <div className="font-medium">{truck.driverName}</div>
                </div>
              )}
            </div>

          </TabsContent>
          <TabsContent value="sensors" className="pt-4">
            {truck.sensors ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                  icon={<SeatbeltIcon className="h-4 w-4 text-emerald-500" />}
                  label="Seatbelt"
                  value={truck.sensors.seatbeltStatus || 'Unknown'}
                />
                <StatCard
                  icon={<Activity className="h-4 w-4 text-indigo-500" />}
                  label="Engine"
                  value={truck.sensors.engineState || 'Unknown'}
                />
                <StatCard
                  icon={<Clock3 className="h-4 w-4 text-amber-500" />}
                  label="Engine Hours"
                  value={
                    truck.sensors.engineHours !== undefined
                      ? `${truck.sensors.engineHours.toLocaleString()} h`
                      : '—'
                  }
                />
                <StatCard
                  icon={<Gauge className="h-4 w-4 text-sky-500" />}
                  label="Odometer"
                  value={
                    truck.sensors.odometerMiles !== undefined
                      ? `${truck.sensors.odometerMiles.toLocaleString()} mi`
                      : '—'
                  }
                />
                <StatCard
                  icon={<Fuel className="h-4 w-4 text-lime-500" />}
                  label="Fuel"
                  value={
                    isValidFuelPercent(truck.sensors.fuelPercent)
                      ? `${Math.round(truck.sensors.fuelPercent)}%`
                      : '—'
                  }
                />
                <StatCard
                  icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                  label="Check Engine"
                  value={truck.diagnostics?.checkEngineLightOn ? 'On' : 'Off'}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No sensor data reported.</div>
            )}
          </TabsContent>
          <TabsContent value="diagnostics" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {truck.diagnostics?.activeFaults || 0} active fault
                {(truck.diagnostics?.activeFaults || 0) === 1 ? '' : 's'}
              </div>
              <Button variant="link" size="sm">
                View history
              </Button>
            </div>
            {truck.diagnostics?.faults.length ? (
              <div className="space-y-2">
                {truck.diagnostics.faults.map((fault, index) => (
                  <div
                    key={`${fault.code}-${index}`}
                    className="rounded-md border p-3 text-xs leading-relaxed"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{fault.code || 'Unknown code'}</span>
                      <Badge variant="outline">{fault.severity || 'N/A'}</Badge>
                    </div>
                    <div>{fault.description || 'No description provided'}</div>
                    <div className="text-muted-foreground">
                      State: {fault.active === false ? 'Resolved' : 'Active'}
                      {fault.occurredAt
                        ? ` · Since ${new Date(fault.occurredAt).toLocaleString()}`
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No fault codes reported.</div>
            )}
          </TabsContent>
          <TabsContent value="media" className="pt-4">
            {truck.latestMedia ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {truck.latestMedia.cameraType || 'Camera'} ·{' '}
                  {new Date(truck.latestMedia.capturedAt).toLocaleString()}
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={truck.latestMedia.url}
                    alt="Camera still"
                    className="max-h-96 w-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border p-6 text-sm text-muted-foreground">
                <Camera className="mb-2 h-6 w-6" />
                No camera media available.
              </div>
            )}
          </TabsContent>
          <TabsContent value="trips" className="space-y-3 pt-4">
            {truck.recentTrips?.length ? (
              truck.recentTrips.map((trip) => (
                <div key={trip.id} className="rounded-md border p-3 text-sm">
                  <div className="font-medium flex items-center justify-between">
                    <span>{trip.startAddress || 'Unknown origin'}</span>
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">
                    to {trip.endAddress || 'Unknown destination'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {trip.distanceMiles ? `${trip.distanceMiles.toFixed(1)} mi · ` : ''}
                    {trip.durationSeconds
                      ? `${Math.round(trip.durationSeconds / 60)} min`
                      : ''}
                    {trip.startedAt
                      ? ` · ${new Date(trip.startedAt).toLocaleString()}`
                      : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No recent trips recorded.</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

