'use client';

/**
 * War Room Map initialization hook
 * Handles Google Maps instance, clusterer, refs, and zoom tracking
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import { DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';
import { PathTrailManager } from '@/lib/maps/path-trail-manager';

const AUTO_CLUSTER_ZOOM = 10;

function createClusterIcon(count: number): google.maps.Icon {
  const size = Math.min(48, 32 + Math.log10(count) * 8);
  const color = count > 50 ? '#ef4444' : count > 20 ? '#f59e0b' : '#3b82f6';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="22" fill="${color}" stroke="white" stroke-width="3" />
    </svg>`;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

export function useWarRoomMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_CONFIG.defaultZoom);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const trailManagerRef = useRef<PathTrailManager | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  // Initialize map
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMapsApi(['visualization']);
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

        // Track zoom level
        mapInstance.addListener('zoom_changed', () => {
          setMapZoom(mapInstance.getZoom() ?? DEFAULT_MAP_CONFIG.defaultZoom);
        });

        const clusterInstance = new MarkerClusterer({
          map: mapInstance,
          markers: [],
          algorithmOptions: { maxZoom: AUTO_CLUSTER_ZOOM },
          renderer: {
            render: ({ count, position }) => {
              const marker = new google.maps.Marker({
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
              return marker;
            },
          },
        });

        clusterInstance.addListener('clusterclick', (cluster: any) => {
          const bounds = cluster.bounds;
          if (!bounds) return;
          // Fit to cluster bounds with generous padding, but cap max zoom
          mapInstance.fitBounds(bounds, 100);
          // After fitBounds completes, cap the zoom to avoid going too deep
          google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
            const zoom = mapInstance.getZoom() ?? 5;
            if (zoom > 10) mapInstance.setZoom(10);
          });
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

  const handleFitAll = useCallback(() => {
    if (!map || markersRef.current.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markersRef.current.forEach(m => {
      const pos = m.getPosition();
      if (pos) bounds.extend(pos);
    });
    map.fitBounds(bounds, 50);
  }, [map]);

  return {
    mapRef,
    map,
    clusterer,
    mapReady,
    mapZoom,
    markersRef,
    routePolylinesRef,
    trailManagerRef,
    trafficLayerRef,
    handleFitAll,
  };
}
