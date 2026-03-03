'use client';

import { useEffect, useRef, useMemo } from 'react';
import type {
  MapLocation,
  TruckMapEntry,
  TrailerMapEntry,
} from '@/lib/maps/live-map-service';
import {
  buildTruckMarkerIcon,
  buildSamsaraMarkerIcon,
  buildBadgeIcon,
  formatBadgeLabel,
  getTruckMarkerColor,
  createTruckStatus,
  getMarkerSizeForZoom,
} from '@/lib/maps/marker-utils';
import { MAP_COLORS, ROUTE_STYLES } from '@/lib/maps/map-config';
import { CustomInfoWindow, type InfoWindowData } from '@/components/map/CustomInfoWindow';
import { MarkerClusterManager } from '@/components/map/marker-cluster-manager';
import { PathTrailManager } from '@/lib/maps/path-trail-manager';

interface UseMapMarkersOptions {
  map: any;
  mapZoom: number;
  filteredLoads: any[];
  filteredTrucks: TruckMapEntry[];
  filteredTrailers: TrailerMapEntry[];
  truckMapById: Map<string, TruckMapEntry>;
  showLayers: { trucks: boolean; trailers: boolean; pickups: boolean; deliveries: boolean };
  showFaultyOnly: boolean;
  showTrails: boolean;
  clusterManagerRef: React.MutableRefObject<MarkerClusterManager | null>;
  infoWindowRef: React.MutableRefObject<CustomInfoWindow | null>;
  trailManagerRef: React.MutableRefObject<PathTrailManager | null>;
  onTruckSelect: (detail: any) => void;
}

export function useMapMarkers({
  map,
  mapZoom,
  filteredLoads,
  filteredTrucks,
  filteredTrailers,
  truckMapById,
  showLayers,
  showFaultyOnly,
  showTrails,
  clusterManagerRef,
  infoWindowRef,
  trailManagerRef,
  onTruckSelect,
}: UseMapMarkersOptions) {
  const loadMarkersRef = useRef<any[]>([]);
  const truckMarkersRef = useRef<any[]>([]);
  const routePolylinesRef = useRef<any[]>([]);
  const previousDataRef = useRef<{ loads: any[]; trucks: any[]; trailers: TrailerMapEntry[] } | null>(null);
  const hasInitialBoundsRef = useRef(false);

  const { trucks: showTrucks, trailers: showTrailers, pickups: showPickups, deliveries: showDeliveries } = showLayers;

  useEffect(() => {
    if (!map || !window.google) return;

    const currentData = { loads: filteredLoads, trucks: filteredTrucks, trailers: filteredTrailers };
    const prev = previousDataRef.current;

    const loadsChanged = !prev || prev.loads.length !== currentData.loads.length ||
      prev.loads.some((l, i) => {
        const c = currentData.loads[i];
        return !c || l.id !== c.id || l.status !== c.status ||
          l.truckLocation?.lat !== c.truckLocation?.lat || l.truckLocation?.lng !== c.truckLocation?.lng;
      });

    const trucksChanged = !prev || prev.trucks.length !== currentData.trucks.length ||
      prev.trucks.some((t, i) => {
        const c = currentData.trucks[i];
        return !c || t.id !== c.id || t.location?.lat !== c.location?.lat ||
          t.location?.lng !== c.location?.lng || t.diagnostics?.activeFaults !== c.diagnostics?.activeFaults;
      });

    const trailersChanged = !prev || prev.trailers?.length !== currentData.trailers.length ||
      prev.trailers?.some((t: TrailerMapEntry, i: number) => {
        const c = currentData.trailers[i];
        return !c || t.id !== c.id || t.location?.lat !== c.location?.lat || t.location?.lng !== c.location?.lng;
      });

    if (loadsChanged || trucksChanged || trailersChanged) {
      loadMarkersRef.current.forEach((m) => m.setMap(null));
      truckMarkersRef.current.forEach((m) => m.setMap(null));
      routePolylinesRef.current.forEach((p) => p.setMap(null));
    }

    previousDataRef.current = currentData;

    const google = window.google;
    const newLoadMarkers: any[] = [];
    const newTruckMarkers: any[] = [];
    const newPolylines: any[] = [];
    const bounds = new google.maps.LatLngBounds();

    const addMarker = (location: MapLocation, options: google.maps.MarkerOptions, onClick?: () => void) => {
      if (!location?.lat || !location?.lng) return null;
      const marker = new google.maps.Marker({ map, position: { lat: location.lat, lng: location.lng }, ...options });
      bounds.extend(marker.getPosition() as google.maps.LatLng);
      if (onClick) marker.addListener('click', onClick);
      return marker;
    };

    const trackedTruckIds = new Set<string>();

    // Process loads
    filteredLoads.forEach((load) => {
      const matchedTruck = load.truck?.id ? truckMapById.get(load.truck.id) : undefined;

      if (showPickups && load.pickup) {
        const m = addMarker(load.pickup, {
          icon: buildBadgeIcon({ label: formatBadgeLabel(load.loadNumber, 'P'), fill: MAP_COLORS.pickup, size: 24 }),
          title: `Load ${load.loadNumber} pickup`,
        });
        if (m) newLoadMarkers.push(m);
      }

      if (showDeliveries && load.delivery) {
        const m = addMarker(load.delivery, {
          icon: buildBadgeIcon({ label: formatBadgeLabel(load.loadNumber, 'D'), fill: MAP_COLORS.delivery, size: 24 }),
          title: `Load ${load.loadNumber} delivery`,
        });
        if (m) newLoadMarkers.push(m);
      }

      // Route polylines (only at zoom >= 8)
      if (load.routeWaypoints && load.routeWaypoints.length > 1 && mapZoom >= 8) {
        const path = load.routeWaypoints.map((p: any) => ({ lat: p.lat, lng: p.lng }));
        const polyline = new google.maps.Polyline({ path, strokeColor: ROUTE_STYLES.strokeColor, strokeWeight: ROUTE_STYLES.strokeWeight, strokeOpacity: ROUTE_STYLES.strokeOpacity, zIndex: ROUTE_STYLES.zIndex, map });
        newPolylines.push(polyline);
        if (path.length >= 2) {
          const mid = path[Math.floor(path.length / 2)];
          const label = new google.maps.Marker({
            position: mid, map,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
            label: { text: load.loadNumber, color: '#ffffff', fontSize: '10px', fontWeight: 'bold' },
            zIndex: 1000,
          });
          newLoadMarkers.push(label);
        }
      }

      // Load truck markers
      if (showTrucks && load.truck && load.truckLocation) {
        const hasActiveFaults = (load.truckDiagnostics?.activeFaults ?? 0) > 0;
        const truckStatus = createTruckStatus(hasActiveFaults, true);
        const color = getTruckMarkerColor(truckStatus, showFaultyOnly);
        const size = getMarkerSizeForZoom(mapZoom);
        const lbl = formatBadgeLabel(load.truck.truckNumber, 'TRK');
        const useSamsara = load.truckLocation.source === 'samsara' || matchedTruck?.matchSource;
        const iconFn = useSamsara ? buildSamsaraMarkerIcon : buildTruckMarkerIcon;

        const m = addMarker(load.truckLocation, {
          icon: iconFn({ label: lbl, fill: color, size, heading: load.truckLocation.heading, showDirection: true, pulse: false }),
          title: `Truck ${load.truck.truckNumber} (Load ${load.loadNumber})`,
        }, () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.open(map, m, {
              title: `Truck ${load.truck!.truckNumber}`, subtitle: `Load ${load.loadNumber}`,
              location: load.truckLocation, driverName: load.driver?.name, loadNumber: load.loadNumber,
              status: load.status, speed: load.truckLocation?.speed, diagnostics: load.truckDiagnostics,
              sensors: load.truckSensors || matchedTruck?.sensors, dispatcher: load.dispatcher,
              routeDescription: load.routeDescription, minimal: true,
            });
          }
          onTruckSelect({
            truckId: load.truck!.id, truckNumber: load.truck!.truckNumber, status: load.status,
            loadNumber: load.loadNumber, trailerNumber: load.trailer?.trailerNumber, driverName: load.driver?.name,
            location: load.truckLocation, diagnostics: load.truckDiagnostics, matchSource: 'load-assignment',
            sensors: load.truckSensors || matchedTruck?.sensors, latestMedia: load.truckMedia || matchedTruck?.latestMedia,
            recentTrips: load.truckTrips || matchedTruck?.recentTrips,
          });
        });

        if (m) {
          newTruckMarkers.push(m);
          trackedTruckIds.add(load.truck.id);
          if (trailManagerRef.current?.isEnabled() && load.truckLocation) {
            trailManagerRef.current.addPoint(load.truck.id, { lat: load.truckLocation.lat, lng: load.truckLocation.lng, timestamp: Date.now(), heading: load.truckLocation.heading });
          }
        }
      }

      // Load trailer markers
      if (showTrailers && load.trailer) {
        const tFromSamsara = filteredTrailers.find((t) => t.id === load.trailer!.id);
        const tLoc = tFromSamsara?.location ?? load.truckLocation ?? load.delivery ?? load.pickup;
        if (tLoc) {
          const m = addMarker(tLoc, {
            icon: buildTruckMarkerIcon({ label: formatBadgeLabel(load.trailer.trailerNumber, 'TRL'), fill: MAP_COLORS.trailer, size: getMarkerSizeForZoom(mapZoom), heading: tLoc?.heading, showDirection: true, pulse: false }),
            title: `Trailer ${load.trailer.trailerNumber}`,
          }, () => {
            if (infoWindowRef.current) {
              infoWindowRef.current.open(map, m, { title: `Trailer ${load.trailer!.trailerNumber}`, status: tFromSamsara?.status, location: tLoc, minimal: true });
            }
          });
          if (m) newTruckMarkers.push(m);
        }
      }
    });

    // Standalone trucks (not assigned to loads)
    if (showTrucks) {
      const standaloneTrucks = filteredTrucks.filter((t) => t.location && !trackedTruckIds.has(t.id));
      standaloneTrucks.forEach((truck) => {
        const hasActiveFaults = (truck.diagnostics?.activeFaults ?? 0) > 0;
        const truckStatus = createTruckStatus(hasActiveFaults, false);
        const color = getTruckMarkerColor(truckStatus, showFaultyOnly);
        const size = getMarkerSizeForZoom(mapZoom);
        const lbl = formatBadgeLabel(truck.truckNumber, truck.isSamsaraOnly ? 'SAM' : 'TRK');
        const useSamsara = truck.isSamsaraOnly || truck.location?.source === 'samsara' || truck.matchSource;
        const iconFn = useSamsara ? buildSamsaraMarkerIcon : buildTruckMarkerIcon;
        const assignedLoad = filteredLoads.find((l) => l.truck?.id === truck.id);

        const m = addMarker(truck.location as MapLocation, {
          icon: iconFn({ label: lbl, fill: color, size, heading: truck.location?.heading, showDirection: true, pulse: false }),
          title: truck.isSamsaraOnly ? `${truck.truckNumber} (Samsara Only)` : `Truck ${truck.truckNumber}`,
        }, () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.open(map, m, {
              title: truck.isSamsaraOnly ? `${truck.truckNumber} (Samsara Only)` : `Truck ${truck.truckNumber}`,
              subtitle: truck.isSamsaraOnly ? 'Not in system' : truck.status,
              location: truck.location, status: truck.isSamsaraOnly ? 'SAMSARA_ONLY' : truck.status,
              speed: truck.location?.speed, diagnostics: truck.diagnostics, sensors: truck.sensors,
              dispatcher: assignedLoad?.dispatcher, routeDescription: assignedLoad?.routeDescription, minimal: true,
            });
          }
          onTruckSelect({
            truckId: truck.id, truckNumber: truck.truckNumber, status: truck.status,
            location: truck.location, diagnostics: truck.diagnostics, matchSource: truck.matchSource,
            sensors: truck.sensors, latestMedia: truck.latestMedia, recentTrips: truck.recentTrips,
          });
        });

        if (m) {
          newTruckMarkers.push(m);
          if (trailManagerRef.current?.isEnabled() && truck.location) {
            trailManagerRef.current.addPoint(truck.id, { lat: truck.location.lat, lng: truck.location.lng, timestamp: Date.now(), heading: truck.location.heading });
          }
        }
      });
    }

    // Standalone trailers from Samsara
    if (showTrailers) {
      const loadTrailerIds = new Set(filteredLoads.filter((l) => l.trailer?.id).map((l) => l.trailer!.id));
      const standaloneTrailers = filteredTrailers.filter((t) => t.location && !loadTrailerIds.has(t.id));
      standaloneTrailers.forEach((trailer) => {
        const m = addMarker(trailer.location as MapLocation, {
          icon: buildTruckMarkerIcon({ label: formatBadgeLabel(trailer.trailerNumber, 'TRL'), fill: MAP_COLORS.trailer, size: getMarkerSizeForZoom(mapZoom), heading: trailer.location?.heading, showDirection: true, pulse: false }),
          title: `Trailer ${trailer.trailerNumber}`,
        }, () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.open(map, m, { title: `Trailer ${trailer.trailerNumber}`, status: trailer.status, location: trailer.location, minimal: true });
          }
        });
        if (m) newTruckMarkers.push(m);
      });
    }

    // Fit bounds on initial load only
    if (!bounds.isEmpty() && !hasInitialBoundsRef.current) {
      map.fitBounds(bounds);
      hasInitialBoundsRef.current = true;
    }

    loadMarkersRef.current = newLoadMarkers;
    truckMarkersRef.current = newTruckMarkers;
    routePolylinesRef.current = newPolylines;

    if (clusterManagerRef.current && newTruckMarkers.length > 0 && mapZoom < 10) {
      clusterManagerRef.current.updateMarkers(newTruckMarkers);
    } else if (clusterManagerRef.current && mapZoom >= 10) {
      clusterManagerRef.current.clearMarkers();
    }
  }, [map, filteredLoads, filteredTrucks, filteredTrailers, truckMapById, showTrucks, showTrailers, showPickups, showDeliveries, mapZoom]);

  return { loadMarkersRef, truckMarkersRef };
}
