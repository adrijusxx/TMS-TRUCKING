'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ReactNode, SVGProps } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Navigation,
  Package,
  Truck,
  User,
  RefreshCw,
  SatelliteDish,
  AlertTriangle,
  MapPin,
  Route as RouteIcon,
  Gauge,
  Fuel,
  Clock3,
  Activity,
  Camera,
  Share2,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import type {
  LoadMapEntry,
  MapLocation,
  TruckDiagnostics,
  TruckMapEntry,
  TruckSensors,
  TruckMedia,
  TruckTrip,
} from '@/lib/maps/live-map-service';

interface LiveMapResponse {
  success: boolean;
  data: {
    loads: LoadMapEntry[];
    trucks: TruckMapEntry[];
  };
}

interface SelectedTruckDetail {
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
}

async function fetchLiveMapData(): Promise<LiveMapResponse['data']> {
  const response = await fetch('/api/maps/live');
  if (!response.ok) throw new Error('Failed to fetch live map data');
  const payload: LiveMapResponse = await response.json();
  return payload.data;
}

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const loadMarkersRef = useRef<any[]>([]);
  const truckMarkersRef = useRef<any[]>([]);
  const routePolylinesRef = useRef<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFaultyOnly, setShowFaultyOnly] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<SelectedTruckDetail | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [showLayers, setShowLayers] = useState({
    trucks: true,
    trailers: true,
    pickups: false,
    deliveries: false,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['live-map'],
    queryFn: fetchLiveMapData,
    refetchInterval: 30000,
  });

  const loads = data?.loads || [];
  const trucks = data?.trucks || [];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const matchesQuery = (value?: string | null) =>
    !hasQuery || (value ?? '').toLowerCase().includes(normalizedQuery);

  const filteredLoads = useMemo(() => {
    if (!hasQuery) return loads;
    return loads.filter((load) => {
      if (matchesQuery(load.loadNumber)) return true;
      if (matchesQuery(load.driver?.name)) return true;
      if (load.truck && matchesQuery(load.truck.truckNumber)) return true;
      if (load.truckDiagnostics?.faults.some((fault) => matchesQuery(fault.code))) return true;
      return false;
    });
  }, [loads, hasQuery, normalizedQuery]);

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      if (showFaultyOnly && (truck.diagnostics?.activeFaults ?? 0) === 0) {
        return false;
      }

      if (!hasQuery) return true;

      const diagCodes =
        truck.diagnostics?.faults.map((fault) => fault.code || '').join(' ').toLowerCase() || '';

      const matchesTruck =
        matchesQuery(truck.truckNumber) ||
        matchesQuery(truck.matchSource) ||
        diagCodes.includes(normalizedQuery);

      if (matchesTruck) return true;

      return filteredLoads.some((load) => load.truck?.id === truck.id);
    });
  }, [trucks, filteredLoads, hasQuery, normalizedQuery, showFaultyOnly]);

  const truckMapById = useMemo(() => {
    const map = new Map<string, TruckMapEntry>();
    trucks.forEach((truck) => map.set(truck.id, truck));
    return map;
  }, [trucks]);

  useEffect(() => {
    if (selectedTruck) {
      setDetailTab('overview');
    }
  }, [selectedTruck?.truckId]);

  const legendItems = [
    { label: 'Truck', color: '#16a34a', icon: Truck },
    { label: 'Trailer', color: '#8b5cf6', icon: TrailerGlyph },
    { label: 'Pickup', color: '#2563eb', icon: MapPin },
    { label: 'Delivery', color: '#f97316', icon: RouteIcon },
  ];

  const { trucks: showTrucks, trailers: showTrailers, pickups: showPickups, deliveries: showDeliveries } =
    showLayers;

const badgeIconCache = new Map<string, google.maps.Icon>();

const formatBadgeLabel = (value: string | number | undefined, fallback: string, maxChars = 4) => {
  if (!value) return fallback;
  const text = String(value);
  if (text.length <= maxChars) return text;
  return text.slice(-maxChars);
};

const buildBadgeIcon = ({
  label,
  fill,
  size,
  labelColor = '#0f172a',
}: {
  label: string;
  fill: string;
  size: number;
  labelColor?: string;
}): google.maps.Icon => {
  const cacheKey = `${fill}-${size}-${label}-${labelColor}`;
  if (badgeIconCache.has(cacheKey)) {
    return badgeIconCache.get(cacheKey)!;
  }

  const labelSize = label.length > 4 ? 8 : label.length > 2 ? 9 : 11;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${fill}" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="white" />
      <text x="50%" y="55%" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${labelSize}" font-weight="600" fill="${labelColor}">${label}</text>
    </svg>
  `;

  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };

  badgeIconCache.set(cacheKey, icon);
  return icon;
};

  useEffect(() => {
    let isMounted = true;

    const loadMaps = async () => {
      try {
        await loadGoogleMapsApi(['geometry']);
        if (!isMounted || !mapRef.current || !window.google) return;

        const google = window.google;
        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: 5,
          center: { lat: 39.8283, lng: -98.5795 },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMap(mapInstance);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
      }
    };

    loadMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!map || !window.google) return;

    loadMarkersRef.current.forEach((marker) => marker.setMap(null));
    truckMarkersRef.current.forEach((marker) => marker.setMap(null));
    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));

    const google = window.google;
    const newLoadMarkers: any[] = [];
    const newTruckMarkers: any[] = [];
    const newPolylines: any[] = [];
    const bounds = new google.maps.LatLngBounds();

    const addMarker = (
      location: MapLocation,
      options: google.maps.MarkerOptions,
      onClick?: () => void
    ) => {
      if (!location?.lat || !location?.lng) return null;
      const marker = new google.maps.Marker({
        map,
        position: { lat: location.lat, lng: location.lng },
        ...options,
      });
      bounds.extend(marker.getPosition() as google.maps.LatLng);
      if (onClick) {
        marker.addListener('click', onClick);
      }
      return marker;
    };

    const handleTruckSelect = (detail: SelectedTruckDetail) => {
      setSelectedTruck(detail);
    };

    const trackedTruckIds = new Set<string>();

    filteredLoads.forEach((load) => {
      const matchedTruck = load.truck?.id ? truckMapById.get(load.truck.id) : undefined;
      if (showPickups && load.pickup) {
        const pickupLabel = formatBadgeLabel(load.loadNumber, 'P');
        const marker = addMarker(load.pickup, {
          icon: buildBadgeIcon({ label: pickupLabel, fill: '#1d4ed8', size: 24 }),
          title: `Load ${load.loadNumber} pickup`,
        });
        if (marker) newLoadMarkers.push(marker);
      }

      if (showDeliveries && load.delivery) {
        const deliveryLabel = formatBadgeLabel(load.loadNumber, 'D');
        const marker = addMarker(load.delivery, {
          icon: buildBadgeIcon({ label: deliveryLabel, fill: '#f97316', size: 24 }),
          title: `Load ${load.loadNumber} delivery`,
        });
        if (marker) newLoadMarkers.push(marker);
      }

      if (load.routeWaypoints && load.routeWaypoints.length > 1) {
        const polyline = new google.maps.Polyline({
          path: load.routeWaypoints.map((point) => ({ lat: point.lat, lng: point.lng })),
          strokeColor: '#0ea5e9',
          strokeWeight: 3,
          strokeOpacity: 0.7,
          map,
        });
        newPolylines.push(polyline);
      }

      if (showTrucks && load.truck && load.truckLocation) {
        const infoWindow = new google.maps.InfoWindow({
          content: [
            '<div style="padding:8px;">',
            `<strong>Truck ${load.truck.truckNumber}</strong><br/>`,
            `Load: ${load.loadNumber}<br/>`,
            `Status: ${load.status}<br/>`,
            load.driver ? `Driver: ${load.driver.name}<br/>` : '',
            load.truckLocation.address ? `${load.truckLocation.address}<br/>` : '',
            load.truckLocation.lastUpdated
              ? `Updated: ${new Date(load.truckLocation.lastUpdated).toLocaleString()}`
              : '',
            '</div>',
          ].join(''),
        });

        const truckLabel = formatBadgeLabel(load.truck.truckNumber, 'TRK');
        const marker = addMarker(
          load.truckLocation,
          {
            icon: buildBadgeIcon({ label: truckLabel, fill: '#2563eb', size: 26 }),
            title: `Truck ${load.truck.truckNumber} (Load ${load.loadNumber})`,
          },
          () => {
            infoWindow.open(map, marker);
            handleTruckSelect({
              truckId: load.truck!.id,
              truckNumber: load.truck!.truckNumber,
              status: load.status,
              loadNumber: load.loadNumber,
              trailerNumber: load.trailer?.trailerNumber,
              driverName: load.driver?.name,
              location: load.truckLocation,
              diagnostics: load.truckDiagnostics,
              matchSource: 'load-assignment',
              sensors: matchedTruck?.sensors,
              latestMedia: matchedTruck?.latestMedia,
              recentTrips: matchedTruck?.recentTrips,
            });
          }
        );

        if (marker) {
          newTruckMarkers.push(marker);
          trackedTruckIds.add(load.truck.id);
        }
      }

      if (showTrailers && load.trailer) {
        const trailerAnchor = load.truckLocation ?? load.delivery ?? load.pickup;
        if (trailerAnchor) {
          const trailerInfo = new google.maps.InfoWindow({
            content: [
              '<div style="padding:8px;">',
              `<strong>Trailer ${load.trailer.trailerNumber}</strong><br/>`,
              load.truckLocation?.address
                ? `${load.truckLocation.address}<br/>`
                : 'Location pending<br/>',
              load.truckLocation?.lastUpdated
                ? `Updated: ${new Date(load.truckLocation.lastUpdated).toLocaleString()}`
                : '',
              '</div>',
            ].join(''),
          });

          const trailerLabel = formatBadgeLabel(load.trailer.trailerNumber, 'TRL');
          const trailerMarker = addMarker(
            trailerAnchor,
            {
              icon: buildBadgeIcon({ label: trailerLabel, fill: '#0ea5e9', size: 24 }),
              title: `Trailer ${load.trailer.trailerNumber}`,
            },
            () => trailerInfo.open(map, trailerMarker)
          );

          if (trailerMarker) {
            newTruckMarkers.push(trailerMarker);
          }
        }
      }
    });

    if (showTrucks) {
      const standaloneTrucks = filteredTrucks.filter(
        (truck) => truck.location && !trackedTruckIds.has(truck.id)
      );

      standaloneTrucks.forEach((truck) => {
        const infoWindow = new google.maps.InfoWindow({
          content: [
            '<div style="padding:8px;">',
            `<strong>Truck ${truck.truckNumber}</strong><br/>`,
            `Status: ${truck.status}<br/>`,
            truck.location?.address ? `${truck.location.address}<br/>` : '',
            truck.location?.lastUpdated
              ? `Updated: ${new Date(truck.location.lastUpdated).toLocaleString()}<br/>`
              : '',
            truck.matchSource
              ? `<div style="margin-top:4px;font-size:12px;">Source: ${truck.matchSource}</div>`
              : '',
            '</div>',
          ].join(''),
        });

        const truckLabel = formatBadgeLabel(truck.truckNumber, 'TRK');
        const marker = addMarker(
          truck.location as MapLocation,
          {
            icon: buildBadgeIcon({ label: truckLabel, fill: '#f97316', size: 26 }),
            title: `Truck ${truck.truckNumber}`,
          },
          () => {
            infoWindow.open(map, marker);
            handleTruckSelect({
              truckId: truck.id,
              truckNumber: truck.truckNumber,
              status: truck.status,
              location: truck.location,
              diagnostics: truck.diagnostics,
              matchSource: truck.matchSource,
              sensors: truck.sensors,
              latestMedia: truck.latestMedia,
              recentTrips: truck.recentTrips,
            });
          }
        );

        if (marker) {
          newTruckMarkers.push(marker);
        }
      });
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }

    loadMarkersRef.current = newLoadMarkers;
    truckMarkersRef.current = newTruckMarkers;
    routePolylinesRef.current = newPolylines;
  }, [map, filteredLoads, filteredTrucks, truckMapById, showTrucks, showTrailers, showPickups, showDeliveries]);

  const activeLoadCount = loads.length;
  const trackedTruckCount = filteredTrucks.length;
  const loadsWithLiveTrucks = filteredLoads.filter((load) => load.truckLocation).length;
  const faultyTruckCount = filteredTrucks.filter(
    (truck) => (truck.diagnostics?.activeFaults ?? 0) > 0
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live Map</h1>
          <p className="text-muted-foreground">Google Maps + Samsara truck telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{activeLoadCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tracked Trucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{trackedTruckCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Loads w/ Live Truck</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{loadsWithLiveTrucks}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search trucks, loads, drivers, or isolate fault codes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search trucks, loads, drivers, fault codes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="flex items-center gap-3">
            <Switch checked={showFaultyOnly} onCheckedChange={setShowFaultyOnly} id="faulty-only" />
            <Label htmlFor="faulty-only" className="text-sm">
              Show only trucks with active faults
            </Label>
            {faultyTruckCount > 0 && (
              <Badge variant="destructive" className="ml-auto flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {faultyTruckCount} truck{faultyTruckCount > 1 ? 's' : ''} affected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layers</CardTitle>
          <CardDescription>Choose which assets appear on the map</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'trucks', label: 'Trucks' },
            { key: 'trailers', label: 'Trailers' },
            { key: 'pickups', label: 'Pickup points' },
            { key: 'deliveries', label: 'Delivery points' },
          ].map((layer) => (
            <div key={layer.key} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm font-medium">{layer.label}</span>
              <Switch
                checked={showLayers[layer.key as keyof typeof showLayers]}
                onCheckedChange={(value) =>
                  setShowLayers((current) => ({ ...current, [layer.key]: value }))
                }
                id={`layer-${layer.key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Map View
            <Badge variant="secondary" className="flex items-center gap-1">
              <SatelliteDish className="h-3 w-3" />
              Real-time
            </Badge>
          </CardTitle>
          <CardDescription>Active loads, routes, and Samsara truck pins</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-[600px] rounded-lg border" />
          {isLoading && (
            <div className="mt-4 text-sm text-muted-foreground">
              Loading map data from Google Maps/Samsara...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
          <CardDescription>Marker styles used on the map</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {legendItems.map(({ label, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center rounded-md border px-2 py-1"
                style={{ borderColor: color, color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracked Trucks ({filteredTrucks.length})</CardTitle>
          <CardDescription>Click to view diagnostics and telemetry</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrucks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No trucks match this filter.</div>
          ) : (
            <div className="max-h-72 overflow-auto divide-y rounded-lg border">
              {filteredTrucks.map((truck) => (
                <button
                  key={truck.id}
                  className="w-full text-left px-4 py-3 hover:bg-muted/70 flex items-center justify-between gap-4"
                  onClick={() =>
                    setSelectedTruck({
                      truckId: truck.id,
                      truckNumber: truck.truckNumber,
                      status: truck.status,
                      location: truck.location,
                      diagnostics: truck.diagnostics,
                      matchSource: truck.matchSource,
                      sensors: truck.sensors,
                      latestMedia: truck.latestMedia,
                      recentTrips: truck.recentTrips,
                    })
                  }
                >
                  <div>
                    <div className="font-medium">{truck.truckNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: {truck.status}
                      {truck.matchSource ? ` · Match: ${truck.matchSource}` : ''}
                    </div>
                  </div>
                  {truck.diagnostics?.activeFaults ? (
                    <Badge variant="destructive">
                      {truck.diagnostics.activeFaults} active fault
                      {truck.diagnostics.activeFaults > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Healthy</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTruck && (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Truck {selectedTruck.truckNumber}</CardTitle>
              <CardDescription>
                {selectedTruck.loadNumber
                  ? `Assigned to load ${selectedTruck.loadNumber}`
                  : 'Unassigned truck'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Live Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTruck(null)}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sensors">Sensors</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="trips">Trips</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 pt-4">
                {selectedTruck.location ? (
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Location</div>
                        <div className="text-sm font-semibold">
                          {selectedTruck.location.address || 'Coordinates only'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated{' '}
                        {selectedTruck.location.lastUpdated
                          ? new Date(selectedTruck.location.lastUpdated).toLocaleString()
                          : 'just now'}
                      </div>
                    </div>
                    {selectedTruck.sensors?.speed && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <StatCard
                          icon={<Gauge className="h-4 w-4 text-blue-600" />}
                          label="Speed"
                          value={
                            selectedTruck.sensors.speed.value !== undefined
                              ? `${Math.round(selectedTruck.sensors.speed.value)} mph`
                              : '—'
                          }
                        />
                        <StatCard
                          icon={<Activity className="h-4 w-4 text-orange-500" />}
                          label="Limit"
                          value={
                            selectedTruck.sensors.speed.limit !== undefined
                              ? `${Math.round(selectedTruck.sensors.speed.limit)} mph`
                              : '—'
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    No live location for this truck.
                  </div>
                )}
                {selectedTruck.trailerNumber && (
                  <div className="rounded-lg border p-4 text-sm">
                    <div className="text-xs uppercase text-muted-foreground">Trailer</div>
                    <div className="font-medium">#{selectedTruck.trailerNumber}</div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="sensors" className="pt-4">
                {selectedTruck.sensors ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard
                      icon={<SeatbeltIcon className="h-4 w-4 text-emerald-500" />}
                      label="Seatbelt"
                      value={selectedTruck.sensors.seatbeltStatus || 'Unknown'}
                    />
                    <StatCard
                      icon={<Activity className="h-4 w-4 text-indigo-500" />}
                      label="Engine"
                      value={selectedTruck.sensors.engineState || 'Unknown'}
                    />
                    <StatCard
                      icon={<Clock3 className="h-4 w-4 text-amber-500" />}
                      label="Engine Hours"
                      value={
                        selectedTruck.sensors.engineHours !== undefined
                          ? `${selectedTruck.sensors.engineHours.toLocaleString()} h`
                          : '—'
                      }
                    />
                    <StatCard
                      icon={<Gauge className="h-4 w-4 text-sky-500" />}
                      label="Odometer"
                      value={
                        selectedTruck.sensors.odometerMiles !== undefined
                          ? `${selectedTruck.sensors.odometerMiles.toLocaleString()} mi`
                          : '—'
                      }
                    />
                    <StatCard
                      icon={<Fuel className="h-4 w-4 text-lime-500" />}
                      label="Fuel"
                      value={
                        selectedTruck.sensors.fuelPercent !== undefined
                          ? `${selectedTruck.sensors.fuelPercent}%`
                          : '—'
                      }
                    />
                    <StatCard
                      icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                      label="Check Engine"
                      value={selectedTruck.diagnostics?.checkEngineLightOn ? 'On' : 'Off'}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No sensor data reported.</div>
                )}
              </TabsContent>
              <TabsContent value="diagnostics" className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedTruck.diagnostics?.activeFaults || 0} active fault
                    {(selectedTruck.diagnostics?.activeFaults || 0) === 1 ? '' : 's'}
                  </div>
                  <Button variant="link" size="sm">
                    View history
                  </Button>
                </div>
                {selectedTruck.diagnostics?.faults.length ? (
                  <div className="space-y-2">
                    {selectedTruck.diagnostics.faults.map((fault, index) => (
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
                {selectedTruck.latestMedia ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {selectedTruck.latestMedia.cameraType || 'Camera'} ·{' '}
                      {new Date(selectedTruck.latestMedia.capturedAt).toLocaleString()}
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                      <img
                        src={selectedTruck.latestMedia.url}
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
                {selectedTruck.recentTrips?.length ? (
                  selectedTruck.recentTrips.map((trip) => (
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
      )}
    </div>
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

function SeatbeltIcon(props: SVGProps<SVGSVGElement>) {
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

function TrailerGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" {...props}>
      <rect x="1" y="3" width="20" height="10" rx="2" />
      <rect x="23" y="5" width="8" height="6" rx="1.5" />
      <circle cx="7" cy="14" r="2" fill="currentColor" />
      <circle cx="18" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

