'use client';

/**
 * Unified War Room Map Component
 * 
 * Single clustered map with drill-down, hover cards, and feature layers.
 * Replaces both WarRoomMap and LiveMap with unified experience.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw, Truck, Package, MapPin, Maximize2, AlertTriangle,
  Route, History, Shield, Cloud, Layers, Phone, Fuel, Search
} from 'lucide-react';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import { DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';
import { useLiveMap } from '@/hooks/useLiveMap';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { LoadMapEntry, TruckMapEntry } from '@/lib/maps/live-map-service';
import AssetDetailCard from './AssetDetailCard';
import LayerControls from './LayerControls';
import GeofenceLayer, { SAMPLE_GEOFENCES, type Geofence } from './GeofenceLayer';
import { PathTrailManager } from '@/lib/maps/path-trail-manager';
import { SamsaraTokenPrompt } from '@/components/settings/integrations/SamsaraTokenPrompt';

// ============================================
// TYPES
// ============================================

export interface MapAsset {
  id: string;
  type: 'TRUCK' | 'LOAD';
  lat: number;
  lng: number;
  status: 'MOVING' | 'STOPPED' | 'IDLE' | 'DELAYED';
  label: string;
  speed?: number;
  heading?: number;
  // Source data
  truckData?: TruckMapEntry;
  loadData?: LoadMapEntry;
}

export interface LayerState {
  routes: boolean;
  trails: boolean;
  geofences: boolean;
  traffic: boolean;
  weather: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const CLUSTER_RADIUS = 60;
const AUTO_CLUSTER_ZOOM = 10;

const STATUS_COLORS: Record<string, string> = {
  MOVING: '#22c55e',
  STOPPED: '#f59e0b',
  DELAYED: '#ef4444',
  IDLE: '#6b7280',
};

const LOAD_ROUTE_COLORS: Record<string, string> = {
  EN_ROUTE_PICKUP: '#3b82f6',
  AT_PICKUP: '#f59e0b',
  LOADED: '#22c55e',
  EN_ROUTE_DELIVERY: '#8b5cf6',
  AT_DELIVERY: '#ec4899',
  DELIVERED: '#6b7280',
};

// ============================================
// COMPONENT
// ============================================

export default function UnifiedWarRoom() {
  const { loads, trucks, trailers, isLoading, isSamsaraConfigured, error, refetch } = useLiveMap();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const trailManagerRef = useRef<PathTrailManager | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geofences] = useState<Geofence[]>(SAMPLE_GEOFENCES);
  const [selectedAsset, setSelectedAsset] = useState<MapAsset | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [layers, setLayers] = useState<LayerState>({
    routes: true,
    trails: false,
    geofences: false,
    traffic: false,
    weather: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data


  // Transform data into map assets
  const mapAssets = useMemo(() => {
    const assets: MapAsset[] = [];
    const truckIdsWithLoads = new Set<string>();

    // Track which trucks have active loads
    loads.forEach(load => {
      if (load.truck?.id) {
        truckIdsWithLoads.add(load.truck.id);
      }
    });

    // Add trucks with location
    // Add trucks with location
    trucks.forEach(truck => {
      if (truck.location?.lat && truck.location?.lng) {
        const speed = truck.location.speed || 0;
        const status = speed > 5 ? 'MOVING' : speed > 0 ? 'STOPPED' : 'IDLE';
        // Find active load for this truck, if any
        const activeLoad = loads.find(load => load.truck?.id === truck.id);

        assets.push({
          id: truck.id,
          type: 'TRUCK',
          lat: truck.location.lat,
          lng: truck.location.lng,
          status,
          label: truck.truckNumber,
          speed,
          heading: truck.location.heading,
          truckData: truck,
          // Attach load data for ETA tab (may be undefined if no load assigned)
          loadData: activeLoad,
        });
      }
    });

    // Add loads with location (from truck position)
    loads.forEach(load => {
      if (load.truckLocation?.lat && load.truckLocation?.lng) {
        const speed = load.truckLocation.speed || 0;
        let status: MapAsset['status'] = speed > 5 ? 'MOVING' : speed > 0 ? 'STOPPED' : 'IDLE';

        // Check if load is delayed (simplified logic)
        if (load.status === 'EN_ROUTE_DELIVERY' && speed === 0) {
          status = 'DELAYED';
        }

        assets.push({
          id: load.id,
          type: 'LOAD',
          lat: load.truckLocation.lat,
          lng: load.truckLocation.lng,
          status,
          label: load.loadNumber,
          speed,
          heading: load.truckLocation.heading,
          loadData: load,
        });
      }
    });

    return assets;
  }, [loads, trucks]);

  // Filter assets based on search query
  const filteredMapAssets = useMemo(() => {
    if (!searchQuery.trim()) return mapAssets;

    const query = searchQuery.toLowerCase();
    return mapAssets.filter(asset =>
      asset.label.toLowerCase().includes(query) ||
      asset.id.toLowerCase().includes(query)
    );
  }, [mapAssets, searchQuery]);

  // Initialize map
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMapsApi();
        if (!mounted || !mapRef.current || !window.google) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: DEFAULT_MAP_CONFIG.defaultZoom,
          center: DEFAULT_MAP_CONFIG.defaultCenter,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        });

        const clusterInstance = new MarkerClusterer({
          map: mapInstance,
          markers: [],
          algorithmOptions: { maxZoom: AUTO_CLUSTER_ZOOM },
          renderer: {
            render: ({ count, position }) => {
              return new google.maps.Marker({
                position,
                icon: createClusterIcon(count),
                label: {
                  text: String(count),
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                },
                zIndex: 1000 + count,
              });
            },
          },
        });

        // Click on cluster to zoom in
        clusterInstance.addListener('clusterclick', (cluster: any) => {
          const bounds = cluster.bounds;
          if (bounds) {
            mapInstance.fitBounds(bounds);
          }
        });

        setMap(mapInstance);
        setClusterer(clusterInstance);
        setMapReady(true);
      } catch (err) {
        console.error('[UnifiedWarRoom] Init error:', err);
      }
    };

    initMap();
    return () => { mounted = false; };
  }, []);

  // Update markers when assets change
  useEffect(() => {
    if (!map || !clusterer || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (filteredMapAssets.length === 0) return;

    // Create new markers
    const markers = filteredMapAssets.map(asset => {
      const marker = new google.maps.Marker({
        position: { lat: asset.lat, lng: asset.lng },
        icon: createAssetMarkerIcon(asset),
        title: `${asset.type}: ${asset.label}`,
      });

      // Click handler - show detail card
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        setSelectedAsset(asset);
        if (e.domEvent) {
          const event = e.domEvent as MouseEvent;
          setCardPosition({ x: event.clientX, y: event.clientY });
        }
      });

      return marker;
    });

    markersRef.current = markers;
    clusterer.clearMarkers();
    clusterer.addMarkers(markers);

    // Fit bounds on first load with data
    if (markers.length > 0 && markersRef.current.length === markers.length) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(m => {
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds, 50);
    }
  }, [map, clusterer, filteredMapAssets, mapReady]);

  // Update route polylines when layer is toggled
  useEffect(() => {
    if (!map || !mapReady) return;

    // Clear existing routes
    routePolylinesRef.current.forEach(p => p.setMap(null));
    routePolylinesRef.current = [];

    if (!layers.routes) return;

    // Draw routes for active loads
    loads.forEach(load => {
      if (load.pickup && load.delivery && load.pickup.lat && load.delivery.lat) {
        const color = LOAD_ROUTE_COLORS[load.status] || '#6b7280';

        const polyline = new google.maps.Polyline({
          path: [
            { lat: load.pickup.lat, lng: load.pickup.lng },
            ...(load.routeWaypoints || []),
            { lat: load.delivery.lat, lng: load.delivery.lng },
          ],
          strokeColor: color,
          strokeWeight: 3,
          strokeOpacity: 0.7,
          map,
          zIndex: 50,
        });

        routePolylinesRef.current.push(polyline);
      }
    });
  }, [map, mapReady, layers.routes, loads]);

  // Toggle traffic layer
  useEffect(() => {
    if (!map) return;

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }

    if (layers.traffic) {
      trafficLayerRef.current.setMap(map);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  }, [map, layers.traffic]);

  // Initialize and manage path trails
  useEffect(() => {
    if (!map || !mapReady) return;

    if (!trailManagerRef.current) {
      trailManagerRef.current = new PathTrailManager(map);
    }

    trailManagerRef.current.setEnabled(layers.trails);

    // Add current positions to trails when enabled
    if (layers.trails) {
      mapAssets.forEach(asset => {
        if (asset.lat && asset.lng) {
          trailManagerRef.current?.addPoint(asset.id, {
            lat: asset.lat,
            lng: asset.lng,
            timestamp: Date.now(),
            heading: asset.heading,
          });
        }
      });
    }
  }, [map, mapReady, layers.trails, mapAssets]);

  // Click outside to close card
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', () => {
      setSelectedAsset(null);
      setCardPosition(null);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  // Actions
  const handleFitAll = useCallback(() => {
    if (!map || markersRef.current.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markersRef.current.forEach(m => {
      const pos = m.getPosition();
      if (pos) bounds.extend(pos);
    });
    map.fitBounds(bounds, 50);
  }, [map]);

  const handleLayerToggle = useCallback((layer: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedAsset(null);
    setCardPosition(null);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const trucksWithLocation = trucks.filter(t => t.location?.lat);
    const lowFuelTrucks = trucksWithLocation.filter(t =>
      t.sensors?.fuelPercent !== undefined && t.sensors.fuelPercent < 25
    );

    return {
      trucks: trucksWithLocation.length,
      loads: loads.filter(l => l.truckLocation?.lat).length,
      moving: mapAssets.filter(a => a.status === 'MOVING').length,
      stopped: mapAssets.filter(a => a.status === 'STOPPED' || a.status === 'IDLE').length,
      delayed: mapAssets.filter(a => a.status === 'DELAYED').length,
      lowFuel: lowFuelTrucks.length,
    };
  }, [trucks, loads, mapAssets]);

  return (
    <>
      <SamsaraTokenPrompt isOpen={!isSamsaraConfigured} />
      <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-fit">
              {filteredMapAssets.length} / {mapAssets.length}
            </Badge>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search trucks, loads..."
                className="h-7 text-xs pl-7 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleFitAll}>
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-b text-xs bg-background">
          <span className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-blue-600" />
            <span className="font-medium">{stats.trucks}</span> trucks
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3 text-purple-600" />
            <span className="font-medium">{stats.loads}</span> loads
          </span>
          <div className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">{stats.moving}</span> moving
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-medium">{stats.stopped}</span> stopped
          </span>
          {stats.delayed > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-medium">{stats.delayed}</span> delayed
            </span>
          )}
          {stats.lowFuel > 0 && (
            <>
              <div className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1 text-amber-600">
                <Fuel className="h-3 w-3" />
                <span className="font-medium">{stats.lowFuel}</span> low fuel
              </span>
            </>
          )}
        </div>

        {/* Layer Controls */}
        <LayerControls layers={layers} onToggle={handleLayerToggle} />

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Loading state */}
          {isLoading && mapAssets.length === 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <Skeleton className="h-6 w-24 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Loading fleet data...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-xs text-destructive">Failed to load map data</p>
                <Button variant="outline" size="sm" className="mt-2 h-6 text-xs" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* No data state */}
          {!isLoading && !error && mapAssets.length === 0 && mapReady && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <div className="text-center p-4">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No assets with GPS data</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Samsara integration provides real-time location data
                </p>
              </div>
            </div>
          )}

          {/* Geofence Layer */}
          <GeofenceLayer
            map={map}
            geofences={geofences}
            enabled={layers.geofences}
          />

          {/* Asset Detail Card */}
          {selectedAsset && cardPosition && (
            <AssetDetailCard
              asset={selectedAsset}
              position={cardPosition}
              onClose={handleCloseCard}
            />
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg p-2 text-[10px] border shadow-sm z-20">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Moving
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Stopped
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Delayed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Idle
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createAssetMarkerIcon(asset: MapAsset): google.maps.Icon {
  const color = STATUS_COLORS[asset.status] || STATUS_COLORS.IDLE;
  const size = 30;
  const letter = asset.type === 'TRUCK' ? 'T' : 'L';

  // Rotate icon based on heading
  const rotation = asset.heading || 0;

  const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" />
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="bold">
          ${letter}
        </text>
      </svg>
      `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

function createClusterIcon(count: number): google.maps.Icon {
  const size = Math.min(48, 32 + Math.log10(count) * 8);
  const color = count > 50 ? '#ef4444' : count > 20 ? '#f59e0b' : '#3b82f6';

  const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="22" fill="${color}" stroke="white" stroke-width="3" />
      </svg>
      `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

