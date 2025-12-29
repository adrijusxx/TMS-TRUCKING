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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import type {
  MapLocation,
  TruckDiagnostics,
  TruckMapEntry,
  TrailerMapEntry,
  TruckSensors,
  TruckMedia,
  TruckTrip,
} from '@/lib/maps/live-map-service';
import { useLiveMap } from '@/hooks/useLiveMap';
import {
  buildTruckMarkerIcon,
  buildSamsaraMarkerIcon,
  buildBadgeIcon,
  formatBadgeLabel,
  getTruckMarkerColor,
  createTruckStatus,
  getMarkerSizeForZoom,
} from '@/lib/maps/marker-utils';
import { MAP_COLORS, DEFAULT_MAP_CONFIG, ROUTE_STYLES } from '@/lib/maps/map-config';
import { CustomInfoWindow, type InfoWindowData } from '@/components/map/CustomInfoWindow';
import { MarkerClusterManager } from '@/components/map/marker-cluster-manager';
import { MapControls } from '@/components/map/MapControls';
import { TruckDetailsPanel } from '@/components/map/TruckDetailsPanel';
import { PathTrailManager } from '@/lib/maps/path-trail-manager';

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

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_CONFIG.defaultZoom);
  const loadMarkersRef = useRef<any[]>([]);
  const truckMarkersRef = useRef<any[]>([]);
  const routePolylinesRef = useRef<any[]>([]);
  const clusterManagerRef = useRef<MarkerClusterManager | null>(null);
  const infoWindowRef = useRef<CustomInfoWindow | null>(null);
  const trailManagerRef = useRef<PathTrailManager | null>(null);
  const previousDataRef = useRef<{ loads: any[]; trucks: any[]; trailers: TrailerMapEntry[] } | null>(null);
  const hasInitialBoundsRef = useRef(false); // Track if we've set initial bounds
  const [searchQuery, setSearchQuery] = useState('');
  const [showFaultyOnly, setShowFaultyOnly] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<SelectedTruckDetail | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [showLayers, setShowLayers] = useState({
    trucks: true,
    trailers: false,
    pickups: false,
    deliveries: false,
  });
  const [showTrails, setShowTrails] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showTrackedTrucks, setShowTrackedTrucks] = useState(false);
  const [showSamsaraOnly, setShowSamsaraOnly] = useState(false); // Toggle for Samsara-only vehicles
  const [isMounted, setIsMounted] = useState(false);

  const { loads, trucks, trailers, isLoading, error, refetch } = useLiveMap();

  // Prevent hydration mismatch by only rendering collapsibles after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug logging for trailers
  useEffect(() => {
    if (trailers && trailers.length > 0) {
      console.log('[LiveMap Component] Trailers received:', {
        total: trailers.length,
        withLocations: trailers.filter(t => t.location).length,
        trailers: trailers.map(t => ({
          id: t.id,
          number: t.trailerNumber,
          hasLocation: !!t.location,
          matchSource: t.matchSource,
        })),
      });
    } else {
      console.warn('[LiveMap Component] No trailers in data');
    }
  }, [trailers]);

  // Debug logging for data changes
  useEffect(() => {
    console.log('[LiveMap Component] Data update:', {
      loads: loads.length,
      trucks: trucks.length,
      trailers: trailers.length,
      isLoading,
      error: error?.message,
    });
  }, [loads.length, trucks.length, trailers.length, isLoading, error]);

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
      // Filter out Samsara-only vehicles if toggle is off
      if (truck.isSamsaraOnly && !showSamsaraOnly) {
        return false;
      }

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
  }, [trucks, filteredLoads, hasQuery, normalizedQuery, showFaultyOnly, showSamsaraOnly]);

  const filteredTrailers = useMemo(() => {
    return trailers.filter((trailer) => {
      if (!hasQuery) return true;
      return matchesQuery(trailer.trailerNumber) || matchesQuery(trailer.matchSource);
    });
  }, [trailers, hasQuery, normalizedQuery]);

  const truckMapById = useMemo(() => {
    const map = new Map<string, TruckMapEntry>();
    trucks.forEach((truck) => map.set(truck.id, truck));
    return map;
  }, [trucks]);

  useEffect(() => {
    if (selectedTruck) {
      // Reset to overview tab when a new truck is selected
      setDetailTab('overview');
    }
  }, [selectedTruck?.truckId]);

  // Update trail manager when showTrails changes
  useEffect(() => {
    if (trailManagerRef.current) {
      trailManagerRef.current.setEnabled(showTrails);
      if (!showTrails) {
        trailManagerRef.current.clearAllTrails();
      }
    }
  }, [showTrails]);

  const legendItems = [
    { label: 'Truck (Healthy)', color: MAP_COLORS.healthy, icon: Truck },
    { label: 'Truck (Faulty)', color: MAP_COLORS.faulty, icon: Truck },
    { label: 'Truck (Assigned)', color: MAP_COLORS.assigned, icon: Truck },
    { label: 'Trailer', color: MAP_COLORS.trailer, icon: TrailerGlyph },
    { label: 'Pickup', color: MAP_COLORS.pickup, icon: MapPin },
    { label: 'Delivery', color: MAP_COLORS.delivery, icon: RouteIcon },
  ];

  const { trucks: showTrucks, trailers: showTrailers, pickups: showPickups, deliveries: showDeliveries } =
    showLayers;

  useEffect(() => {
    let isMounted = true;

    const loadMaps = async () => {
      try {
        await loadGoogleMapsApi(['geometry']);
        if (!isMounted || !mapRef.current || !window.google) return;

        const google = window.google;
        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: DEFAULT_MAP_CONFIG.defaultZoom,
          center: DEFAULT_MAP_CONFIG.defaultCenter,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          minZoom: DEFAULT_MAP_CONFIG.minZoom,
          maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
        });

        // Track zoom level
        mapInstance.addListener('zoom_changed', () => {
          setMapZoom(mapInstance.getZoom() || DEFAULT_MAP_CONFIG.defaultZoom);
        });

        // Initialize managers
        clusterManagerRef.current = new MarkerClusterManager(mapInstance);
        infoWindowRef.current = new CustomInfoWindow(mapInstance);
        trailManagerRef.current = new PathTrailManager(mapInstance);
        trailManagerRef.current.setEnabled(showTrails);

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

    // Only clear and recreate if data has actually changed
    const currentData = { loads: filteredLoads, trucks: filteredTrucks, trailers: filteredTrailers };
    const previousData = previousDataRef.current;

    // Improved comparison - check IDs and key properties
    const loadsChanged =
      !previousData ||
      previousData.loads.length !== currentData.loads.length ||
      previousData.loads.some((l, i) => {
        const current = currentData.loads[i];
        return !current || 
          l.id !== current.id ||
          l.status !== current.status ||
          (l.truckLocation?.lat !== current.truckLocation?.lat) ||
          (l.truckLocation?.lng !== current.truckLocation?.lng);
      });

    const trucksChanged =
      !previousData ||
      previousData.trucks.length !== currentData.trucks.length ||
      previousData.trucks.some((t, i) => {
        const current = currentData.trucks[i];
        return !current ||
          t.id !== current.id ||
          (t.location?.lat !== current.location?.lat) ||
          (t.location?.lng !== current.location?.lng) ||
          (t.diagnostics?.activeFaults !== current.diagnostics?.activeFaults);
      });

    const trailersChanged =
      !previousData ||
      previousData.trailers?.length !== currentData.trailers.length ||
      previousData.trailers?.some((t: TrailerMapEntry, i: number) => {
        const current = currentData.trailers[i];
        return !current ||
          t.id !== current.id ||
          (t.location?.lat !== current.location?.lat) ||
          (t.location?.lng !== current.location?.lng);
      });

    if (loadsChanged || trucksChanged || trailersChanged) {
      loadMarkersRef.current.forEach((marker) => marker.setMap(null));
      truckMarkersRef.current.forEach((marker) => marker.setMap(null));
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    }

    previousDataRef.current = currentData;

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
      // Use the load's truck telemetry data (truckSensors, truckMedia) which comes from the service
      // matchedTruck is kept for fallback but load.truckSensors/truckMedia should be preferred
      const matchedTruck = load.truck?.id ? truckMapById.get(load.truck.id) : undefined;
      if (showPickups && load.pickup) {
        const pickupLabel = formatBadgeLabel(load.loadNumber, 'P');
        const marker = addMarker(load.pickup, {
          icon: buildBadgeIcon({
            label: pickupLabel,
            fill: MAP_COLORS.pickup,
            size: 24,
          }),
          title: `Load ${load.loadNumber} pickup`,
        });
        if (marker) newLoadMarkers.push(marker);
      }

      if (showDeliveries && load.delivery) {
        const deliveryLabel = formatBadgeLabel(load.loadNumber, 'D');
        const marker = addMarker(load.delivery, {
          icon: buildBadgeIcon({
            label: deliveryLabel,
            fill: MAP_COLORS.delivery,
            size: 24,
          }),
          title: `Load ${load.loadNumber} delivery`,
        });
        if (marker) newLoadMarkers.push(marker);
      }

      // Enhanced route visualization - only show when zoomed in enough (lazy load)
      // Routes are expensive to render, so only show when zoom >= 8
      if (load.routeWaypoints && load.routeWaypoints.length > 1 && mapZoom >= 8) {
        const path = load.routeWaypoints.map((point) => ({ lat: point.lat, lng: point.lng }));
        
        // Create main route polyline
        const polyline = new google.maps.Polyline({
          path,
          strokeColor: ROUTE_STYLES.strokeColor,
          strokeWeight: ROUTE_STYLES.strokeWeight,
          strokeOpacity: ROUTE_STYLES.strokeOpacity,
          zIndex: ROUTE_STYLES.zIndex,
          map,
        });
        newPolylines.push(polyline);

        // Add route label at midpoint
        if (path.length >= 2) {
          const midIndex = Math.floor(path.length / 2);
          const midPoint = path[midIndex];
          const routeLabel = new google.maps.Marker({
            position: midPoint,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
              fillOpacity: 0,
              strokeOpacity: 0,
            },
            label: {
              text: load.loadNumber,
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
            },
            zIndex: 1000,
          });
          newLoadMarkers.push(routeLabel);
        }
      }

      if (showTrucks && load.truck && load.truckLocation) {
        const hasActiveFaults = (load.truckDiagnostics?.activeFaults ?? 0) > 0;
        const truckStatus = createTruckStatus(hasActiveFaults, true);
        const markerColor = getTruckMarkerColor(truckStatus, showFaultyOnly);
        const markerSize = getMarkerSizeForZoom(mapZoom);
        const truckLabel = formatBadgeLabel(load.truck.truckNumber, 'TRK');
        // Use Samsara icon if location source is Samsara
        const useSamsaraIcon = load.truckLocation.source === 'samsara' || matchedTruck?.matchSource;

        const marker = addMarker(
          load.truckLocation,
          {
            icon: useSamsaraIcon
              ? buildSamsaraMarkerIcon({
                  label: truckLabel,
                  fill: markerColor,
                  size: markerSize,
                  heading: load.truckLocation.heading,
                  showDirection: true,
                  pulse: false, // Removed pulse - faults shown in popup
                })
              : buildTruckMarkerIcon({
                  label: truckLabel,
                  fill: markerColor,
                  size: markerSize,
                  heading: load.truckLocation.heading,
                  showDirection: true,
                  pulse: false,
                }),
            title: `Truck ${load.truck.truckNumber} (Load ${load.loadNumber})`,
          },
          () => {
            if (infoWindowRef.current) {
              const infoData: InfoWindowData = {
                title: `Truck ${load.truck!.truckNumber}`,
                subtitle: `Load ${load.loadNumber}`,
                location: load.truckLocation,
                driverName: load.driver?.name,
                loadNumber: load.loadNumber,
                status: load.status,
                speed: load.truckLocation?.speed,
                diagnostics: load.truckDiagnostics,
                sensors: load.truckSensors || matchedTruck?.sensors,
                dispatcher: load.dispatcher,
                routeDescription: load.routeDescription,
                minimal: true, // Use minimal view for quick info
              };
              infoWindowRef.current.open(map, marker, infoData);
            }
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
              // Use load's truckSensors/truckMedia first, fallback to matchedTruck
              sensors: load.truckSensors || matchedTruck?.sensors,
              latestMedia: load.truckMedia || matchedTruck?.latestMedia,
              recentTrips: load.truckTrips || matchedTruck?.recentTrips,
            });
          }
        );

        if (marker) {
          newTruckMarkers.push(marker);
          trackedTruckIds.add(load.truck.id);

          // Add point to trail if enabled
          if (trailManagerRef.current?.isEnabled() && load.truckLocation) {
            trailManagerRef.current.addPoint(load.truck.id, {
              lat: load.truckLocation.lat,
              lng: load.truckLocation.lng,
              timestamp: Date.now(),
              heading: load.truckLocation.heading,
            });
          }
        }
      }

      // Show trailers assigned to loads - use Samsara location if available, otherwise use load location
      if (showTrailers && load.trailer) {
        // Check if we have a Samsara location for this trailer
        const trailerFromSamsara = filteredTrailers.find((t) => t.id === load.trailer!.id);
        const trailerLocation = trailerFromSamsara?.location ?? load.truckLocation ?? load.delivery ?? load.pickup;
        
        if (trailerLocation) {
          const trailerLabel = formatBadgeLabel(load.trailer.trailerNumber, 'TRL');
          const markerSize = getMarkerSizeForZoom(mapZoom);
          const trailerColor = MAP_COLORS.trailer; // Purple color for trailers
          
          const trailerMarker = addMarker(
            trailerLocation,
            {
              icon: buildTruckMarkerIcon({
                label: trailerLabel,
                fill: trailerColor,
                size: markerSize,
                heading: trailerLocation?.heading,
                showDirection: true,
                pulse: false,
              }),
              title: `Trailer ${load.trailer.trailerNumber}`,
            },
            () => {
              if (infoWindowRef.current) {
                const infoData: InfoWindowData = {
                  title: `Trailer ${load.trailer!.trailerNumber}`,
                  status: trailerFromSamsara?.status,
                  location: trailerLocation,
                  minimal: true,
                };
                infoWindowRef.current.open(map, trailerMarker, infoData);
              }
            }
          );

          if (trailerMarker) {
            newTruckMarkers.push(trailerMarker);
          }
        }
      }
    });

    if (showTrucks) {
      const trucksWithLocation = filteredTrucks.filter((truck) => truck.location);
      const trucksWithoutLocation = filteredTrucks.filter((truck) => !truck.location);
      
      console.log('[LiveMap] Truck filtering:', {
        totalFiltered: filteredTrucks.length,
        withLocation: trucksWithLocation.length,
        withoutLocation: trucksWithoutLocation.length,
        trackedTruckIds: Array.from(trackedTruckIds),
        trucksWithoutLocationNumbers: trucksWithoutLocation.map(t => t.truckNumber),
      });

      const standaloneTrucks = trucksWithLocation.filter(
        (truck) => !trackedTruckIds.has(truck.id)
      );

      console.log('[LiveMap] Rendering standalone trucks:', {
        count: standaloneTrucks.length,
        truckNumbers: standaloneTrucks.map(t => t.truckNumber),
      });

      standaloneTrucks.forEach((truck) => {
        const hasActiveFaults = (truck.diagnostics?.activeFaults ?? 0) > 0;
        const truckStatus = createTruckStatus(hasActiveFaults, false);
        // Use unified color logic for all trucks (including Samsara-only)
        const markerColor = getTruckMarkerColor(truckStatus, showFaultyOnly);
        const markerSize = getMarkerSizeForZoom(mapZoom);
        const truckLabel = formatBadgeLabel(truck.truckNumber, truck.isSamsaraOnly ? 'SAM' : 'TRK');
        // Use Samsara icon if truck has Samsara match source or is Samsara-only
        const useSamsaraIcon = truck.isSamsaraOnly || truck.location?.source === 'samsara' || truck.matchSource;

        // Find if this truck is assigned to a load for dispatcher/route info
        const assignedLoad = filteredLoads.find((load) => load.truck?.id === truck.id);

        const marker = addMarker(
          truck.location as MapLocation,
          {
            icon: useSamsaraIcon
              ? buildSamsaraMarkerIcon({
                  label: truckLabel,
                  fill: markerColor,
                  size: markerSize,
                  heading: truck.location?.heading,
                  showDirection: true,
                  pulse: false, // Removed pulse - faults shown in popup
                })
              : buildTruckMarkerIcon({
                  label: truckLabel,
                  fill: markerColor,
                  size: markerSize,
                  heading: truck.location?.heading,
                  showDirection: true,
                  pulse: false,
                }),
            title: truck.isSamsaraOnly 
              ? `${truck.truckNumber} (Samsara Only)`
              : `Truck ${truck.truckNumber}`,
          },
          () => {
            if (infoWindowRef.current) {
              // Debug: Log what data we're passing
              console.log('[LiveMap] Opening popup for truck:', {
                truckNumber: truck.truckNumber,
                hasDiagnostics: !!truck.diagnostics,
                hasSensors: !!truck.sensors,
                diagnostics: truck.diagnostics,
                sensors: truck.sensors,
              });

              const infoData: InfoWindowData = {
                title: truck.isSamsaraOnly 
                  ? `${truck.truckNumber} (Samsara Only)`
                  : `Truck ${truck.truckNumber}`,
                subtitle: truck.isSamsaraOnly ? 'Not in system' : truck.status,
                location: truck.location,
                status: truck.isSamsaraOnly ? 'SAMSARA_ONLY' : truck.status,
                speed: truck.location?.speed,
                diagnostics: truck.diagnostics,
                sensors: truck.sensors,
                // Include dispatcher and route from assigned load if available
                dispatcher: assignedLoad?.dispatcher,
                routeDescription: assignedLoad?.routeDescription,
                minimal: true, // Use minimal view for quick info
              };
              infoWindowRef.current.open(map, marker, infoData);
            }
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

          // Add point to trail if enabled
          if (trailManagerRef.current?.isEnabled() && truck.location) {
            trailManagerRef.current.addPoint(truck.id, {
              lat: truck.location.lat,
              lng: truck.location.lng,
              timestamp: Date.now(),
              heading: truck.location.heading,
            });
          }
        }
      });
    }

    // Add standalone trailers from Samsara (not assigned to loads)
    if (showTrailers) {
      const loadTrailerIds = new Set(
        filteredLoads
          .filter((load) => load.trailer?.id)
          .map((load) => load.trailer!.id)
      );

      const standaloneTrailers = filteredTrailers.filter(
        (trailer) => trailer.location && !loadTrailerIds.has(trailer.id)
      );

      console.log('[LiveMap] Rendering trailers:', {
        totalFiltered: filteredTrailers.length,
        withLocations: filteredTrailers.filter(t => t.location).length,
        loadTrailerIds: Array.from(loadTrailerIds),
        standalone: standaloneTrailers.length,
        standaloneDetails: standaloneTrailers.map(t => ({
          id: t.id,
          number: t.trailerNumber,
          location: t.location,
        })),
      });

      standaloneTrailers.forEach((trailer) => {
        // Format trailer label - handle letters, numbers, or mixed
        const trailerLabel = formatBadgeLabel(trailer.trailerNumber, 'TRL');
        const markerSize = getMarkerSizeForZoom(mapZoom);
        
        // Use purple color for trailers
        const trailerColor = MAP_COLORS.trailer; // Purple color for trailers
        
        const marker = addMarker(
          trailer.location as MapLocation,
          {
            icon: buildTruckMarkerIcon({
              label: trailerLabel,
              fill: trailerColor,
              size: markerSize,
              heading: trailer.location?.heading,
              showDirection: true,
              pulse: false,
            }),
            title: `Trailer ${trailer.trailerNumber}`,
          },
          () => {
            if (infoWindowRef.current) {
              const infoData: InfoWindowData = {
                title: `Trailer ${trailer.trailerNumber}`,
                status: trailer.status,
                location: trailer.location,
                minimal: true,
              };
              infoWindowRef.current.open(map, marker, infoData);
            }
          }
        );

        if (marker) {
          newTruckMarkers.push(marker);
        }
      });
    }

    // Only fit bounds on initial load, not on every update (prevents zoom reset)
    if (!bounds.isEmpty() && !hasInitialBoundsRef.current) {
      map.fitBounds(bounds);
      hasInitialBoundsRef.current = true;
    }

    loadMarkersRef.current = newLoadMarkers;
    truckMarkersRef.current = newTruckMarkers;
    routePolylinesRef.current = newPolylines;

    // Update cluster manager if available - only when zoomed out (clustering is more useful)
    if (clusterManagerRef.current && newTruckMarkers.length > 0 && mapZoom < 10) {
      clusterManagerRef.current.updateMarkers(newTruckMarkers);
    } else if (clusterManagerRef.current && mapZoom >= 10) {
      // Clear clusters when zoomed in
      clusterManagerRef.current.clearMarkers();
    }
  }, [map, filteredLoads, filteredTrucks, filteredTrailers, truckMapById, showTrucks, showTrailers, showPickups, showDeliveries, mapZoom]);

  const activeLoadCount = loads.length;
  const trackedTruckCount = filteredTrucks.length;
  const loadsWithLiveTrucks = filteredLoads.filter((load) => load.truckLocation).length;
  const faultyTruckCount = filteredTrucks.filter(
    (truck) => (truck.diagnostics?.activeFaults ?? 0) > 0
  ).length;

  // Show error message if API key issue
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Live Map View
            </CardTitle>
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
                    <div>• Verify SAMSARA_API_KEY is set in .env.local</div>
                    <div>• Restart dev server after updating API key</div>
                    <div>• Check API key has "Read Vehicles" permission</div>
                    <div>• Check server logs for detailed error messages</div>
                  </div>
                  <Button onClick={() => refetch()} className="mt-4" variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Map View - At the Top */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Live Map View
                <Badge variant="secondary" className="flex items-center gap-1">
                  <SatelliteDish className="h-3 w-3" />
                  Real-time
                </Badge>
              </CardTitle>
              <CardDescription>Active loads, routes, and Samsara truck pins</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters - Single Line */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search trucks, loads, drivers, fault codes..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={showFaultyOnly} 
                onCheckedChange={setShowFaultyOnly} 
                id="faulty-only" 
              />
              <Label htmlFor="faulty-only" className="text-sm cursor-pointer whitespace-nowrap">
                Show only faulty trucks
              </Label>
            </div>
            {faultyTruckCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle className="h-3 w-3" />
                {faultyTruckCount} fault{faultyTruckCount > 1 ? 's' : ''}
              </Badge>
            )}
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="whitespace-nowrap"
              >
                Clear search
              </Button>
            )}
            <div className="flex items-center gap-2 border-l pl-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Layers:</span>
              {[
                { key: 'trucks', label: 'Trucks' },
                { key: 'trailers', label: 'Trailers' },
                { key: 'pickups', label: 'Pickups' },
                { key: 'deliveries', label: 'Deliveries' },
                { key: 'trails', label: 'Trails', isTrail: true },
              ].map((layer) => (
                <div key={layer.key} className="flex items-center gap-1">
                  <Switch
                    checked={
                      layer.isTrail 
                        ? showTrails 
                        : showLayers[layer.key as keyof typeof showLayers]
                    }
                    onCheckedChange={(value) =>
                      layer.isTrail
                        ? setShowTrails(value)
                        : setShowLayers((current) => ({ ...current, [layer.key]: value }))
                    }
                    id={`layer-${layer.key}`}
                    className="scale-75"
                  />
                  <Label 
                    htmlFor={`layer-${layer.key}`} 
                    className="text-xs cursor-pointer whitespace-nowrap"
                  >
                    {layer.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-l pl-3">
              <Switch 
                checked={showSamsaraOnly} 
                onCheckedChange={setShowSamsaraOnly} 
                id="samsara-only" 
                className="scale-75"
              />
              <Label htmlFor="samsara-only" className="text-xs cursor-pointer whitespace-nowrap">
                Show Samsara-only
              </Label>
              {trucks.filter(t => t.isSamsaraOnly).length > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {trucks.filter(t => t.isSamsaraOnly).length}
                </Badge>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="relative">
            <div ref={mapRef} className="w-full h-[600px] rounded-lg border" />
            
            {/* Map Controls */}
            {map && (
              <MapControls
                map={map}
                selectedTruck={selectedTruck}
                onFitBounds={() => {
                  const bounds = new google.maps.LatLngBounds();
                  [...loadMarkersRef.current, ...truckMarkersRef.current].forEach((marker) => {
                    const pos = marker.getPosition();
                    if (pos) bounds.extend(pos);
                  });
                  if (bounds && Object.keys(bounds).length > 0) {
                    map.fitBounds(bounds);
                  }
                }}
                onCenterSelected={() => {
                  if (selectedTruck?.location) {
                    map.setCenter({
                      lat: selectedTruck.location.lat,
                      lng: selectedTruck.location.lng,
                    });
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

          {/* Overview Section - Below Map in Same Card, Collapsible */}
          {isMounted && (
          <div className="space-y-2 pt-4 border-t">
            {/* Statistics - Collapsible */}
            <Collapsible open={showStatistics} onOpenChange={setShowStatistics}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
                <div className="flex items-center gap-2">
                  {showStatistics ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Statistics</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeLoadCount} loads, {trackedTruckCount} trucks
                  </Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 pb-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Package className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Active Loads</div>
                      <div className="text-xl font-bold">{activeLoadCount}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Truck className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Tracked Trucks</div>
                      <div className="text-xl font-bold">{trackedTruckCount}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <User className="h-6 w-6 text-purple-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Loads w/ Live Truck</div>
                      <div className="text-xl font-bold">{loadsWithLiveTrucks}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Faulty Trucks</div>
                      <div className="text-xl font-bold">{faultyTruckCount}</div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Legend - Collapsible */}
            <Collapsible open={showLegend} onOpenChange={setShowLegend}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
                <div className="flex items-center gap-2">
                  {showLegend ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Map Legend</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 pb-4">
                  {legendItems.map(({ label, color, icon: Icon }) => {
                    const IconComponent = Icon as React.ComponentType<{ className?: string }>;
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center rounded-md border px-2 py-1"
                          style={{ borderColor: color, color }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </span>
                        {label}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Tracked Trucks List - Collapsible */}
            <Collapsible open={showTrackedTrucks} onOpenChange={setShowTrackedTrucks}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
                <div className="flex items-center gap-2">
                  {showTrackedTrucks ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Tracked Trucks</span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredTrucks.length}
                  </Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-2 pb-4">
                  {filteredTrucks.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                      No trucks match this filter.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-auto divide-y rounded-lg border">
                      {filteredTrucks.map((truck) => (
                        <button
                          key={truck.id}
                          className="w-full text-left px-4 py-3 hover:bg-muted/70 flex items-center justify-between gap-4 transition-colors"
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
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          )}
        </CardContent>
      </Card>


      {selectedTruck && (
        <TruckDetailsPanel
          key={selectedTruck.truckId}
          truck={selectedTruck}
          onClose={() => setSelectedTruck(null)}
          onCenterMap={() => {
            if (map && selectedTruck.location) {
              map.setCenter({
                lat: selectedTruck.location.lat,
                lng: selectedTruck.location.lng,
              });
              map.setZoom(15);
            }
          }}
        />
      )}
    </div>
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

