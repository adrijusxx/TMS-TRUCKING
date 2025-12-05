'use client';

/**
 * War Room Map Component
 * 
 * Real-time clustered map for visualizing 150+ assets.
 * Uses @googlemaps/markerclusterer for performance.
 * Fetches data from Samsara via useLiveMap hook.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 2
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Truck, Package, MapPin, Maximize2, AlertTriangle } from 'lucide-react';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import { DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';
import { useLiveMap } from '@/hooks/useLiveMap';

// ============================================
// CONFIGURATION
// ============================================

const CLUSTER_RADIUS = 60;

const STATUS_COLORS: Record<string, string> = {
  MOVING: '#22c55e',
  STOPPED: '#f59e0b',
  DELAYED: '#ef4444',
  IDLE: '#6b7280',
};

// ============================================
// COMPONENT
// ============================================

export default function WarRoomMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Use the same data source as LiveMap
  const { loads, trucks, isLoading, error, refetch } = useLiveMap();

  // Transform data into map points
  const mapPoints = useMemo(() => {
    const points: Array<{
      id: string;
      type: 'TRUCK' | 'LOAD';
      lat: number;
      lng: number;
      status: string;
      label: string;
    }> = [];

    // Add trucks with location
    trucks.forEach(truck => {
      if (truck.location?.lat && truck.location?.lng) {
        const speed = truck.location.speed || 0;
        const status = speed > 5 ? 'MOVING' : speed > 0 ? 'STOPPED' : 'IDLE';
        points.push({
          id: truck.id,
          type: 'TRUCK',
          lat: truck.location.lat,
          lng: truck.location.lng,
          status,
          label: truck.truckNumber,
        });
      }
    });

    // Add loads with truck location
    loads.forEach(load => {
      if (load.truckLocation?.lat && load.truckLocation?.lng) {
        const speed = load.truckLocation.speed || 0;
        const status = speed > 5 ? 'MOVING' : speed > 0 ? 'STOPPED' : 'IDLE';
        points.push({
          id: load.id,
          type: 'LOAD',
          lat: load.truckLocation.lat,
          lng: load.truckLocation.lng,
          status,
          label: load.loadNumber,
        });
      }
    });

    return points;
  }, [loads, trucks]);

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
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        });

        const clusterInstance = new MarkerClusterer({
          map: mapInstance,
          markers: [],
          algorithmOptions: { maxZoom: 14 },
          renderer: {
            render: ({ count, position }) => {
              return new google.maps.Marker({
                position,
                icon: createClusterIcon(count),
                label: {
                  text: String(count),
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                },
                zIndex: 1000 + count,
              });
            },
          },
        });

        setMap(mapInstance);
        setClusterer(clusterInstance);
        setMapReady(true);
      } catch (err) {
        console.error('[WarRoomMap] Init error:', err);
      }
    };

    initMap();
    return () => { mounted = false; };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map || !clusterer || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (mapPoints.length === 0) return;

    // Create new markers
    const markers = mapPoints.map(point => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        icon: createMarkerIcon(point),
        title: `${point.type}: ${point.label}`,
      });
      return marker;
    });

    markersRef.current = markers;
    clusterer.clearMarkers();
    clusterer.addMarkers(markers);

    // Fit bounds on first load
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(m => {
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds, 50);
    }
  }, [map, clusterer, mapPoints, mapReady]);

  const handleFitAll = () => {
    if (!map || markersRef.current.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markersRef.current.forEach(m => {
      const pos = m.getPosition();
      if (pos) bounds.extend(pos);
    });
    map.fitBounds(bounds, 50);
  };

  const trucksWithLocation = trucks.filter(t => t.location?.lat && t.location?.lng).length;
  const loadsWithLocation = loads.filter(l => l.truckLocation?.lat && l.truckLocation?.lng).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">War Room</span>
          <Badge variant="secondary" className="text-xs">
            {mapPoints.length} assets
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => refetch()}>
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={handleFitAll}>
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex gap-3 px-2 py-1 border-b text-xs">
        <span className="flex items-center gap-1">
          <Truck className="h-3 w-3 text-green-600" />
          {trucksWithLocation} trucks
        </span>
        <span className="flex items-center gap-1">
          <Package className="h-3 w-3 text-blue-600" />
          {loadsWithLocation} loads
        </span>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Loading state */}
        {isLoading && mapPoints.length === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="h-6 w-24 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading assets...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
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
        {!isLoading && !error && mapPoints.length === 0 && mapReady && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No assets with GPS data</p>
              <p className="text-xs text-muted-foreground">Samsara integration required</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded p-1 text-[10px] border">
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Moving
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Stopped
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-500" /> Idle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createMarkerIcon(point: { type: string; status: string }): google.maps.Icon {
  const color = STATUS_COLORS[point.status] || STATUS_COLORS.IDLE;
  const size = 28;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="bold">
        ${point.type[0]}
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
  const size = Math.min(44, 28 + Math.log10(count) * 8);
  const color = count > 50 ? '#ef4444' : count > 20 ? '#f59e0b' : '#3b82f6';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="22" fill="${color}" stroke="white" stroke-width="3"/>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}
