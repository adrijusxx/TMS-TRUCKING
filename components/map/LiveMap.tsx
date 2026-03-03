'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, RefreshCw, SatelliteDish, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import type { TruckMapEntry, TrailerMapEntry } from '@/lib/maps/live-map-service';
import { useLiveMap } from '@/hooks/useLiveMap';
import { DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';
import { CustomInfoWindow } from '@/components/map/CustomInfoWindow';
import { MarkerClusterManager } from '@/components/map/marker-cluster-manager';
import { MapControls } from '@/components/map/MapControls';
import { TruckDetailsPanel } from '@/components/map/TruckDetailsPanel';
import { PathTrailManager } from '@/lib/maps/path-trail-manager';
import MapOverviewPanel from '@/components/map/MapOverviewPanel';
import { useMapMarkers } from '@/hooks/useMapMarkers';

interface SelectedTruckDetail {
  truckId: string;
  truckNumber: string;
  status?: string;
  loadNumber?: string;
  trailerNumber?: string;
  driverName?: string;
  location?: any;
  diagnostics?: any;
  matchSource?: string;
  sensors?: any;
  latestMedia?: any;
  recentTrips?: any[];
}

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_CONFIG.defaultZoom);
  const clusterManagerRef = useRef<MarkerClusterManager | null>(null);
  const infoWindowRef = useRef<CustomInfoWindow | null>(null);
  const trailManagerRef = useRef<PathTrailManager | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFaultyOnly, setShowFaultyOnly] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<SelectedTruckDetail | null>(null);
  const [showLayers, setShowLayers] = useState({ trucks: true, trailers: false, pickups: false, deliveries: false });
  const [showTrails, setShowTrails] = useState(false);
  const [showSamsaraOnly, setShowSamsaraOnly] = useState(false);

  const { loads, trucks, trailers, isLoading, error, refetch } = useLiveMap();

  // Trail manager toggle
  useEffect(() => {
    if (trailManagerRef.current) {
      trailManagerRef.current.setEnabled(showTrails);
      if (!showTrails) trailManagerRef.current.clearAllTrails();
    }
  }, [showTrails]);

  // Search filtering
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const matchesQuery = (value?: string | null) => !hasQuery || (value ?? '').toLowerCase().includes(normalizedQuery);

  const filteredLoads = useMemo(() => {
    if (!hasQuery) return loads;
    return loads.filter((load) =>
      matchesQuery(load.loadNumber) || matchesQuery(load.driver?.name) ||
      (load.truck && matchesQuery(load.truck.truckNumber)) ||
      load.truckDiagnostics?.faults.some((f: any) => matchesQuery(f.code))
    );
  }, [loads, hasQuery, normalizedQuery]);

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      if (truck.isSamsaraOnly && !showSamsaraOnly) return false;
      if (showFaultyOnly && (truck.diagnostics?.activeFaults ?? 0) === 0) return false;
      if (!hasQuery) return true;
      const diagCodes = truck.diagnostics?.faults.map((f: any) => f.code || '').join(' ').toLowerCase() || '';
      if (matchesQuery(truck.truckNumber) || matchesQuery(truck.matchSource) || diagCodes.includes(normalizedQuery)) return true;
      return filteredLoads.some((load) => load.truck?.id === truck.id);
    });
  }, [trucks, filteredLoads, hasQuery, normalizedQuery, showFaultyOnly, showSamsaraOnly]);

  const filteredTrailers = useMemo(() => {
    return trailers.filter((t) => !hasQuery || matchesQuery(t.trailerNumber) || matchesQuery(t.matchSource));
  }, [trailers, hasQuery, normalizedQuery]);

  const truckMapById = useMemo(() => {
    const m = new Map<string, TruckMapEntry>();
    trucks.forEach((t) => m.set(t.id, t));
    return m;
  }, [trucks]);

  // Reset detail tab on truck change
  useEffect(() => {
    if (selectedTruck) { /* tab reset handled by TruckDetailsPanel key */ }
  }, [selectedTruck?.truckId]);

  // Initialize Google Maps
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await loadGoogleMapsApi(['geometry']);
        if (!mounted || !mapRef.current || !window.google) return;
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: DEFAULT_MAP_CONFIG.defaultZoom,
          center: DEFAULT_MAP_CONFIG.defaultCenter,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          minZoom: DEFAULT_MAP_CONFIG.minZoom,
          maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
        });
        mapInstance.addListener('zoom_changed', () => setMapZoom(mapInstance.getZoom() || DEFAULT_MAP_CONFIG.defaultZoom));
        clusterManagerRef.current = new MarkerClusterManager(mapInstance);
        infoWindowRef.current = new CustomInfoWindow(mapInstance);
        trailManagerRef.current = new PathTrailManager(mapInstance);
        trailManagerRef.current.setEnabled(showTrails);
        setMap(mapInstance);
      } catch (err) {
        console.error('Failed to initialize Google Maps:', err);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Marker creation hook
  const { loadMarkersRef, truckMarkersRef } = useMapMarkers({
    map, mapZoom, filteredLoads, filteredTrucks, filteredTrailers,
    truckMapById, showLayers, showFaultyOnly, showTrails,
    clusterManagerRef, infoWindowRef, trailManagerRef,
    onTruckSelect: setSelectedTruck,
  });

  const activeLoadCount = loads.length;
  const trackedTruckCount = filteredTrucks.length;
  const loadsWithLiveTrucks = filteredLoads.filter((l) => l.truckLocation).length;
  const faultyTruckCount = filteredTrucks.filter((t) => (t.diagnostics?.activeFaults ?? 0) > 0).length;

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5" />Live Map View</CardTitle>
            <CardDescription>Failed to load map data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-destructive mb-1">Error Loading Map Data</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {error instanceof Error ? error.message : 'Failed to fetch live map data'}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Verify SAMSARA_API_KEY is set in .env.local</div>
                    <div>Restart dev server after updating API key</div>
                    <div>Check API key has "Read Vehicles" permission</div>
                  </div>
                  <Button onClick={() => refetch()} className="mt-4" variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />Retry
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const layerToggles = [
    { key: 'trucks', label: 'Trucks' },
    { key: 'trailers', label: 'Trailers' },
    { key: 'pickups', label: 'Pickups' },
    { key: 'deliveries', label: 'Deliveries' },
    { key: 'trails', label: 'Trails', isTrail: true },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Live Map View
                <Badge variant="secondary" className="flex items-center gap-1">
                  <SatelliteDish className="h-3 w-3" />Real-time
                </Badge>
              </CardTitle>
              <CardDescription>Active loads, routes, and Samsara truck pins</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search trucks, loads, drivers, fault codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showFaultyOnly} onCheckedChange={setShowFaultyOnly} id="faulty-only" />
              <Label htmlFor="faulty-only" className="text-sm cursor-pointer whitespace-nowrap">Show only faulty trucks</Label>
            </div>
            {faultyTruckCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle className="h-3 w-3" />{faultyTruckCount} fault{faultyTruckCount > 1 ? 's' : ''}
              </Badge>
            )}
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="whitespace-nowrap">Clear search</Button>
            )}
            <div className="flex items-center gap-2 border-l pl-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Layers:</span>
              {layerToggles.map((layer) => (
                <div key={layer.key} className="flex items-center gap-1">
                  <Switch
                    checked={layer.isTrail ? showTrails : showLayers[layer.key as keyof typeof showLayers]}
                    onCheckedChange={(v) => layer.isTrail ? setShowTrails(v) : setShowLayers((c) => ({ ...c, [layer.key]: v }))}
                    id={`layer-${layer.key}`}
                    className="scale-75"
                  />
                  <Label htmlFor={`layer-${layer.key}`} className="text-xs cursor-pointer whitespace-nowrap">{layer.label}</Label>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-l pl-3">
              <Switch checked={showSamsaraOnly} onCheckedChange={setShowSamsaraOnly} id="samsara-only" className="scale-75" />
              <Label htmlFor="samsara-only" className="text-xs cursor-pointer whitespace-nowrap">Show Samsara-only</Label>
              {trucks.filter(t => t.isSamsaraOnly).length > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">{trucks.filter(t => t.isSamsaraOnly).length}</Badge>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="relative">
            <div ref={mapRef} className="w-full h-[600px] rounded-lg border" />
            {map && (
              <MapControls
                map={map}
                selectedTruck={selectedTruck}
                onFitBounds={() => {
                  const bounds = new google.maps.LatLngBounds();
                  [...loadMarkersRef.current, ...truckMarkersRef.current].forEach((m) => {
                    const pos = m.getPosition();
                    if (pos) bounds.extend(pos);
                  });
                  if (bounds && Object.keys(bounds).length > 0) map.fitBounds(bounds);
                }}
                onCenterSelected={() => {
                  if (selectedTruck?.location) {
                    map.setCenter({ lat: selectedTruck.location.lat, lng: selectedTruck.location.lng });
                    map.setZoom(15);
                  }
                }}
              />
            )}
            {isLoading && (
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-muted-foreground border shadow-lg">
                Loading map data from Google Maps/Samsara...
              </div>
            )}
          </div>

          {/* Overview Panel */}
          <MapOverviewPanel
            activeLoadCount={activeLoadCount}
            trackedTruckCount={trackedTruckCount}
            loadsWithLiveTrucks={loadsWithLiveTrucks}
            faultyTruckCount={faultyTruckCount}
            filteredTrucks={filteredTrucks}
            onSelectTruck={setSelectedTruck}
          />
        </CardContent>
      </Card>

      {selectedTruck && (
        <TruckDetailsPanel
          key={selectedTruck.truckId}
          truck={selectedTruck}
          onClose={() => setSelectedTruck(null)}
          onCenterMap={() => {
            if (map && selectedTruck.location) {
              map.setCenter({ lat: selectedTruck.location.lat, lng: selectedTruck.location.lng });
              map.setZoom(15);
            }
          }}
        />
      )}
    </div>
  );
}
