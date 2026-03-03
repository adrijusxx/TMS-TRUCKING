'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import { MAP_COLORS, DEFAULT_MAP_CONFIG } from '@/lib/maps/map-config';

interface LoadPin {
  id: string;
  loadNumber: string;
  pickupCity?: string | null;
  pickupState?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  status: string;
  revenue?: number;
}

interface DriverPin {
  id: string;
  name: string;
  truckNumber?: string;
  lat?: number;
  lng?: number;
}

interface DispatchMapProps {
  loads: LoadPin[];
  drivers: DriverPin[];
}

const COMPACT_HEIGHT = 300;
const EXPANDED_HEIGHT = 550;

/** Geocode a "City, State" string into lat/lng using Google Geocoder */
async function geocodeLocation(
  geocoder: google.maps.Geocoder,
  city: string,
  state: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const result = await geocoder.geocode({ address: `${city}, ${state}, USA` });
    if (result.results.length > 0) {
      const loc = result.results[0].geometry.location;
      return { lat: loc.lat(), lng: loc.lng() };
    }
  } catch {
    // Geocoding failures are non-critical
  }
  return null;
}

export default function DispatchMap({ loads, drivers }: DispatchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const google = await loadGoogleMapsApi();
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT_MAP_CONFIG.defaultCenter,
          zoom: DEFAULT_MAP_CONFIG.defaultZoom,
          minZoom: DEFAULT_MAP_CONFIG.minZoom,
          maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (err) {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : 'Failed to load map');
        }
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, []);

  // Plot markers when data changes
  const plotMarkers = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const google = window.google;
    if (!google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let hasValidBounds = false;

    // Plot load pickup/delivery pins
    for (const load of loads) {
      if (load.pickupCity && load.pickupState) {
        const pos = await geocodeLocation(geocoder, load.pickupCity, load.pickupState);
        if (pos) {
          const marker = new google.maps.Marker({
            position: pos,
            map,
            title: `Pickup: ${load.loadNumber} - ${load.pickupCity}, ${load.pickupState}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: MAP_COLORS.pickup,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8,
            },
          });
          markersRef.current.push(marker);
          bounds.extend(pos);
          hasValidBounds = true;
        }
      }

      if (load.deliveryCity && load.deliveryState) {
        const pos = await geocodeLocation(geocoder, load.deliveryCity, load.deliveryState);
        if (pos) {
          const marker = new google.maps.Marker({
            position: pos,
            map,
            title: `Delivery: ${load.loadNumber} - ${load.deliveryCity}, ${load.deliveryState}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: MAP_COLORS.delivery,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8,
            },
          });
          markersRef.current.push(marker);
          bounds.extend(pos);
          hasValidBounds = true;
        }
      }
    }

    // Plot driver locations
    for (const driver of drivers) {
      if (driver.lat && driver.lng) {
        const pos = { lat: driver.lat, lng: driver.lng };
        const marker = new google.maps.Marker({
          position: pos,
          map,
          title: `${driver.name}${driver.truckNumber ? ` (${driver.truckNumber})` : ''}`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: MAP_COLORS.healthy,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
            rotation: 0,
          },
        });
        markersRef.current.push(marker);
        bounds.extend(pos);
        hasValidBounds = true;
      }
    }

    if (hasValidBounds) {
      map.fitBounds(bounds, { top: 30, bottom: 30, left: 30, right: 30 });
    }
  }, [loads, drivers]);

  useEffect(() => {
    if (mapReady) {
      plotMarkers();
    }
  }, [mapReady, plotMarkers]);

  // Resize map on expand/collapse
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        google.maps.event.trigger(mapInstanceRef.current!, 'resize');
      }, 100);
    }
  }, [expanded]);

  const loadCount = loads.length;
  const driverCount = drivers.filter((d) => d.lat && d.lng).length;

  if (mapError) {
    return (
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm flex items-center gap-1">
            <Map className="h-4 w-4" />
            Dispatch Map
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 px-3">
          <p className="text-xs text-muted-foreground text-center">{mapError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1">
            <Map className="h-4 w-4" />
            Dispatch Map
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] h-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ backgroundColor: MAP_COLORS.pickup }} />
              {loadCount} loads
            </Badge>
            <Badge variant="outline" className="text-[10px] h-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ backgroundColor: MAP_COLORS.healthy }} />
              {driverCount} drivers
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => plotMarkers()}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={mapRef}
          style={{ height: expanded ? EXPANDED_HEIGHT : COMPACT_HEIGHT }}
          className="w-full rounded-b-lg transition-all duration-200"
        />
      </CardContent>
    </Card>
  );
}
