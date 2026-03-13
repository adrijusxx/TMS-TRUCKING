'use client';

/**
 * War Room side effects hook
 * Manages marker updates, route rendering, traffic, trails, and click-outside
 */

import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { PathTrailManager } from '@/lib/maps/path-trail-manager';
import { HeatMapManager } from '@/lib/maps/heat-map-manager';
import type { LoadMapEntry } from '@/lib/maps/live-map-service';
import type { MapAsset, LayerState } from '@/hooks/useWarRoomState';

// ============================================
// CONSTANTS
// ============================================

const STATUS_COLORS: Record<string, string> = {
  MOVING: '#22c55e',
  STOPPED: '#f59e0b',
  DELAYED: '#ef4444',
  IDLE: '#6b7280',
};

const LOW_FUEL_COLOR = '#f97316'; // orange

const LOAD_ROUTE_COLORS: Record<string, string> = {
  EN_ROUTE_PICKUP: '#3b82f6',
  AT_PICKUP: '#f59e0b',
  LOADED: '#22c55e',
  EN_ROUTE_DELIVERY: '#8b5cf6',
  AT_DELIVERY: '#ec4899',
  DELIVERED: '#6b7280',
};

// Zoom-responsive route styles
function getRouteStyle(zoom: number) {
  if (zoom >= 10) return { strokeWeight: 3, strokeOpacity: 0.7 };
  if (zoom >= 6) return { strokeWeight: 2, strokeOpacity: 0.5 };
  return { strokeWeight: 1, strokeOpacity: 0.3 };
}

// ============================================
// TYPES
// ============================================

interface UseWarRoomEffectsOptions {
  map: google.maps.Map | null;
  clusterer: MarkerClusterer | null;
  mapReady: boolean;
  mapZoom: number;
  markersRef: React.MutableRefObject<google.maps.Marker[]>;
  routePolylinesRef: React.MutableRefObject<google.maps.Polyline[]>;
  trailManagerRef: React.MutableRefObject<PathTrailManager | null>;
  trafficLayerRef: React.MutableRefObject<google.maps.TrafficLayer | null>;
  filteredMapAssets: MapAsset[];
  mapAssets: MapAsset[];
  searchSingleResult: MapAsset | null;
  layers: LayerState;
  loads: LoadMapEntry[];
  activeStatusFilter: string | null;
  setSelectedAsset: (asset: MapAsset | null) => void;
  setCardPosition: (pos: { x: number; y: number } | null) => void;
  // Cluster hover
  setHoveredCluster: (data: { assets: MapAsset[]; position: { x: number; y: number } } | null) => void;
}

// ============================================
// HOOK
// ============================================

export function useWarRoomEffects({
  map, clusterer, mapReady, mapZoom,
  markersRef, routePolylinesRef, trailManagerRef, trafficLayerRef,
  filteredMapAssets, mapAssets, searchSingleResult, layers, loads,
  activeStatusFilter,
  setSelectedAsset, setCardPosition, setHoveredCluster,
}: UseWarRoomEffectsOptions) {
  const heatMapManagerRef = useRef<HeatMapManager | null>(null);
  const initialFitDoneRef = useRef(false);

  // ---- Marker Icon Builder (circle with T/L letter) ----
  function createAssetMarkerIcon(asset: MapAsset): google.maps.Icon {
    const color = asset.isLowFuel
      ? LOW_FUEL_COLOR
      : STATUS_COLORS[asset.status] || STATUS_COLORS.IDLE;
    const size = 30;
    const letter = asset.type === 'TRUCK' ? 'T' : 'L';
    const isDelayed = asset.status === 'DELAYED';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
        ${isDelayed ? `<style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}.p{animation:pulse 2s infinite}</style>` : ''}
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" ${isDelayed ? 'class="p"' : ''}/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${letter}</text>
      </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  }

  // ---- Update markers when assets change ----
  useEffect(() => {
    if (!map || !clusterer || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // In heat map mode, don't render individual markers
    if (layers.heatMap) {
      clusterer.clearMarkers();
      return;
    }

    if (filteredMapAssets.length === 0) {
      clusterer.clearMarkers();
      return;
    }

    const markers = filteredMapAssets.map(asset => {
      const marker = new google.maps.Marker({
        position: { lat: asset.lat, lng: asset.lng },
        icon: createAssetMarkerIcon(asset),
        title: `${asset.type}: ${asset.label}`,
      });

      // Attach asset data for cluster hover
      (marker as any).__asset = asset;

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

    // Fit bounds on first load
    if (!initialFitDoneRef.current && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(m => {
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds, 50);
      initialFitDoneRef.current = true;
    }
  }, [map, clusterer, filteredMapAssets, mapReady, layers.heatMap]);

  // ---- Search highlight — pan only, no zoom change ----
  useEffect(() => {
    if (!map || !searchSingleResult) return;
    map.panTo({ lat: searchSingleResult.lat, lng: searchSingleResult.lng });
  }, [map, searchSingleResult]);

  // ---- Route polylines ----
  useEffect(() => {
    if (!map || !mapReady) return;

    routePolylinesRef.current.forEach(p => p.setMap(null));
    routePolylinesRef.current = [];

    if (!layers.routes) return;

    const { strokeWeight, strokeOpacity } = getRouteStyle(mapZoom);

    loads.forEach(load => {
      // Skip DELIVERED routes
      if (load.status === 'DELIVERED') return;
      if (!load.pickup?.lat || !load.delivery?.lat) return;

      const color = LOAD_ROUTE_COLORS[load.status] || '#6b7280';
      const isFiltered = activeStatusFilter && !filteredMapAssets.some(a => a.loadData?.id === load.id);

      const polyline = new google.maps.Polyline({
        path: [
          { lat: load.pickup.lat, lng: load.pickup.lng },
          ...(load.routeWaypoints || []),
          { lat: load.delivery.lat, lng: load.delivery.lng },
        ],
        strokeColor: color,
        strokeWeight,
        strokeOpacity: isFiltered ? 0.15 : strokeOpacity,
        map,
        zIndex: 50,
      });

      routePolylinesRef.current.push(polyline);
    });
  }, [map, mapReady, layers.routes, loads, mapZoom, activeStatusFilter, filteredMapAssets]);

  // ---- Traffic layer ----
  useEffect(() => {
    if (!map) return;

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }

    trafficLayerRef.current.setMap(layers.traffic ? map : null);
  }, [map, layers.traffic]);

  // ---- Trail management: seed historical data on enable ----
  const trailSeededRef = useRef(false);

  useEffect(() => {
    if (!map || !mapReady) return;

    if (!trailManagerRef.current) {
      trailManagerRef.current = new PathTrailManager(map);
    }

    trailManagerRef.current.setEnabled(layers.trails);

    if (!layers.trails) {
      trailSeededRef.current = false;
      return;
    }

    // Seed historical data once when trails are first enabled
    if (!trailSeededRef.current && mapAssets.length > 0) {
      trailSeededRef.current = true;
      const truckAssets = mapAssets.filter(a => a.type === 'TRUCK');
      if (truckAssets.length > 0) {
        fetch('/api/maps/trails')
          .then(res => res.json())
          .then(result => {
            if (result.success && result.data) {
              for (const vehicle of result.data) {
                // Match Samsara vehicle to truck asset by normalized name/number
                const name = (vehicle.vehicleName || '').replace(/\D/g, '');
                const asset = truckAssets.find(a => {
                  const num = a.label.replace(/\D/g, '');
                  return num && name && num === name;
                });
                if (asset && trailManagerRef.current) {
                  trailManagerRef.current.seedTrail(asset.id, vehicle.points);
                }
              }
            }
          })
          .catch(err => console.error('[Trails] Failed to fetch history:', err));
      }
    }

    // Continue accumulating live points
    mapAssets.forEach(asset => {
      if (asset.lat && asset.lng) {
        trailManagerRef.current?.addPoint(asset.id, {
          lat: asset.lat,
          lng: asset.lng,
          timestamp: Date.now(),
          heading: asset.heading,
          speed: asset.speed,
        });
      }
    });
  }, [map, mapReady, layers.trails, mapAssets]);

  // ---- Heat map ----
  useEffect(() => {
    if (!map || !mapReady) return;

    if (!heatMapManagerRef.current) {
      heatMapManagerRef.current = new HeatMapManager();
    }

    if (layers.heatMap) {
      heatMapManagerRef.current.enable(map, mapAssets);
    } else {
      heatMapManagerRef.current.disable();
    }
  }, [map, mapReady, layers.heatMap, mapAssets]);

  // ---- Click outside to close card ----
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', () => {
      setSelectedAsset(null);
      setCardPosition(null);
      setHoveredCluster(null);
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);
}
