'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Navigation, RefreshCw, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';
import { apiUrl } from '@/lib/utils';

interface LoadMapProps {
  load: {
    id: string;
    loadNumber: string;
    driver?: {
      id: string;
      driverNumber: string;
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
    truck?: {
      id: string;
      truckNumber: string;
    } | null;
    // Single-stop load
    pickupCity?: string | null;
    pickupState?: string | null;
    pickupAddress?: string | null;
    pickupZip?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    deliveryAddress?: string | null;
    deliveryZip?: string | null;
    // Multi-stop load
    stops?: Array<{
      stopType: 'PICKUP' | 'DELIVERY';
      sequence: number;
      city: string;
      state: string;
      address: string;
      zip?: string | null;
      company?: string | null;
    }>;
  };
  compact?: boolean;
}

// Helper function to build a complete address string
function buildAddressString(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): string {
  const parts: string[] = [];
  if (address) parts.push(address);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);
  
  if (parts.length > 0) {
    return parts.join(', ');
  }
  
  // Fallback to city, state if no address
  if (city && state) {
    return `${city}, ${state}`;
  }
  
  return '';
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  address?: string;
  lastUpdated: string;
}

declare global {
  interface Window {
    google: any;
    mapMarkers?: any[];
  }
}

async function fetchDriverLocation(loadId: string): Promise<DriverLocation | null> {
  const response = await fetch(apiUrl(`/api/loads/${loadId}/driver-location`));
  if (!response.ok) return null;
  const data = await response.json();
  return data.data;
}

export default function LoadMap({ load, compact = false }: LoadMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [driverMarker, setDriverMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Fetch driver location if driver is assigned
  const { data: driverLocation, refetch: refetchLocation } = useQuery<DriverLocation | null>({
    queryKey: ['driver-location', load.id],
    queryFn: () => fetchDriverLocation(load.id),
    enabled: !!load.driver && !!load.truck,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  // Load Google Maps
  useEffect(() => {
    let isMounted = true;

    const loadMaps = async () => {
      try {
        await loadGoogleMapsApi(['places', 'geometry', 'drawing']);
        if (isMounted) {
          // Small delay to ensure container is fully rendered
          setTimeout(() => {
            if (isMounted) {
              initializeMap();
            }
          }, 100);
        }
      } catch (err: any) {
        console.error('Google Maps load error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load Google Maps');
          setIsLoading(false);
        }
      }
    };

    loadMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Resize map when container becomes visible or dimensions change
  useEffect(() => {
    if (!map || !mapRef.current) return;

    const resizeMap = () => {
      if (map && window.google) {
        // Trigger resize after a small delay to ensure layout is complete
        setTimeout(() => {
          if (map && window.google) {
            window.google.maps.event.trigger(map, 'resize');
          }
        }, 100);
      }
    };

    // Resize on mount and when map is set
    resizeMap();

    // Use ResizeObserver to detect container size changes
    // Wrap in requestAnimationFrame to prevent ResizeObserver loop errors
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resizeMap();
      });
    });

    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    // Also listen for window resize
    window.addEventListener('resize', resizeMap);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeMap);
    };
  }, [map]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const google = window.google;
    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 6,
      center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Check if Directions Service is available
    let directionsServiceInstance = null;
    let directionsRendererInstance = null;
    
    try {
      if (google.maps.DirectionsService) {
        directionsServiceInstance = new google.maps.DirectionsService();
        directionsRendererInstance = new google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        });
      }
    } catch (error) {
      console.warn('Directions Service not available, using fallback:', error);
    }

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
    
    // Trigger resize after initialization to ensure proper sizing
    setTimeout(() => {
      if (mapInstance && window.google) {
        window.google.maps.event.trigger(mapInstance, 'resize');
      }
    }, 200);
    
    setIsLoading(false);
  };

  // Calculate and display route
  useEffect(() => {
    if (!map || !window.google) return;
    
    // If Directions Service is not available, use fallback with markers
    if (!directionsService || !directionsRenderer) {
      displayRouteWithMarkers();
      return;
    }

    const waypoints: Array<{ city: string; state: string; address?: string; zip?: string | null }> = [];

    if (load.stops && load.stops.length > 0) {
      // Multi-stop load
      const sortedStops = [...load.stops].sort((a, b) => a.sequence - b.sequence);
      waypoints.push(
        ...sortedStops.map((stop) => ({
          city: stop.city,
          state: stop.state,
          address: stop.address,
          zip: stop.zip || null,
        }))
      );
    } else if (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState) {
      // Single-stop load
      waypoints.push(
        { 
          city: load.pickupCity, 
          state: load.pickupState, 
          address: load.pickupAddress || undefined,
          zip: load.pickupZip || null
        },
        { 
          city: load.deliveryCity, 
          state: load.deliveryState, 
          address: load.deliveryAddress || undefined,
          zip: load.deliveryZip || null
        }
      );
    } else {
      return; // No route to display
    }

    if (waypoints.length < 2) return;

    const google = window.google;
    // Build complete address strings with all components
    const origin = buildAddressString(
      waypoints[0].address,
      waypoints[0].city,
      waypoints[0].state,
      waypoints[0].zip
    );
    const destination = buildAddressString(
      waypoints[waypoints.length - 1].address,
      waypoints[waypoints.length - 1].city,
      waypoints[waypoints.length - 1].state,
      waypoints[waypoints.length - 1].zip
    );

    const waypointParams =
      waypoints.length > 2
        ? waypoints.slice(1, -1).map((wp) => ({
            location: buildAddressString(wp.address, wp.city, wp.state, wp.zip),
            stopover: true,
          }))
        : [];

    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypointParams,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result: any, status: any) => {
        if (status === 'OK' && result && window.google) {
          const google = window.google;
          directionsRenderer.setDirections(result);

          // Calculate total distance and duration
          const totalDistance = result.routes[0].legs.reduce(
            (sum: number, leg: any) => sum + leg.distance.value,
            0
          );
          const totalDuration = result.routes[0].legs.reduce(
            (sum: number, leg: any) => sum + leg.duration.value,
            0
          );

          setRouteInfo({
            distance: `${(totalDistance / 1609.34).toFixed(1)} mi`,
            duration: `${Math.round(totalDuration / 60)} min`,
          });

          // Fit map to show entire route (but don't override if driver location is shown)
          if (!driverLocation) {
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs.forEach((leg: any) => {
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
            });
            map.fitBounds(bounds);
          } else {
            // Include driver location in bounds
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
            result.routes[0].legs.forEach((leg: any) => {
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
            });
            map.fitBounds(bounds);
          }
        } else if (status === 'REQUEST_DENIED' || status === 'ZERO_RESULTS' || status === 'NOT_FOUND') {
          console.warn('Directions request failed:', status);
          setError('Directions API not enabled. Showing markers only.');
          // Fallback to markers only if Directions API fails
          setTimeout(() => displayRouteWithMarkers(), 100);
        } else {
          console.error('Directions request failed:', status);
          setError('Failed to calculate route');
          // Still try to show markers as fallback
          setTimeout(() => displayRouteWithMarkers(), 100);
        }
      }
    );
  }, [directionsService, directionsRenderer, load, map, driverLocation]);

  // Plot live Samsara truck marker
  useEffect(() => {
    if (!map || !window.google) return;

    if (!driverLocation) {
      if (driverMarker) {
        driverMarker.setMap(null);
        setDriverMarker(null);
      }
      return;
    }

    if (driverMarker) {
      driverMarker.setMap(null);
    }

    const google = window.google;
    const marker = new google.maps.Marker({
      map,
      position: {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
      },
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 1,
        rotation: driverLocation.heading || 0,
      },
      title: load.truck
        ? `Truck ${load.truck.truckNumber} location`
        : 'Driver location',
      label: load.truck
        ? {
            text: load.truck.truckNumber,
            color: '#ffffff',
            fontSize: '10px',
          }
        : undefined,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          ${
            load.truck
              ? `<strong>Truck ${load.truck.truckNumber}</strong><br/>`
              : '<strong>Driver location</strong><br/>'
          }
          ${driverLocation.address ? `${driverLocation.address}<br/>` : ''}
          Updated: ${new Date(driverLocation.lastUpdated).toLocaleString()}
        </div>
      `,
    });

    marker.addListener('click', () => infoWindow.open(map, marker));
    setDriverMarker(marker);
  }, [map, driverLocation, load.truck]);

  // Fallback function to display route with markers only
  const displayRouteWithMarkers = () => {
    if (!map || !window.google) return;
    
    const google = window.google;
    const waypoints: Array<{ city: string; state: string; address?: string; zip?: string | null }> = [];

    if (load.stops && load.stops.length > 0) {
      const sortedStops = [...load.stops].sort((a, b) => a.sequence - b.sequence);
      waypoints.push(
        ...sortedStops.map((stop) => ({
          city: stop.city,
          state: stop.state,
          address: stop.address,
          zip: stop.zip || null,
        }))
      );
    } else if (load.pickupCity && load.pickupState && load.deliveryCity && load.deliveryState) {
      waypoints.push(
        { 
          city: load.pickupCity, 
          state: load.pickupState, 
          address: load.pickupAddress || undefined,
          zip: load.pickupZip || null
        },
        { 
          city: load.deliveryCity, 
          state: load.deliveryState, 
          address: load.deliveryAddress || undefined,
          zip: load.deliveryZip || null
        }
      );
    } else {
      return;
    }

    if (waypoints.length < 2) return;

    // Clear existing markers
    if (window.mapMarkers) {
      window.mapMarkers.forEach((marker: any) => marker.setMap(null));
    }
    window.mapMarkers = [];

    // Geocode waypoints and display markers
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    const positions: Array<{ lat: number; lng: number }> = [];

    waypoints.forEach((waypoint, index) => {
      // Build complete address string with all components
      const address = buildAddressString(
        waypoint.address,
        waypoint.city,
        waypoint.state,
        waypoint.zip
      );
      geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const position = { lat: location.lat(), lng: location.lng() };
          positions.push(position);
          
          const marker = new google.maps.Marker({
            position,
            map,
            label: {
              text: index === 0 ? 'P' : index === waypoints.length - 1 ? 'D' : `${index + 1}`,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            },
            title: address,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: index === 0 ? '#10b981' : index === waypoints.length - 1 ? '#ef4444' : '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          if (window.mapMarkers) {
            window.mapMarkers.push(marker);
          }
          bounds.extend(position);

          // Draw polyline when all markers are placed
          if (positions.length === waypoints.length) {
            // Create polyline connecting all points
            const path = positions.map(p => new google.maps.LatLng(p.lat, p.lng));
            const polyline = new google.maps.Polyline({
              path,
              map,
              strokeColor: '#3b82f6',
              strokeWeight: 4,
              strokeOpacity: 0.6,
            });

            map.fitBounds(bounds);
            
            // Calculate approximate distance (straight line)
            let totalDistance = 0;
            for (let i = 0; i < path.length - 1; i++) {
              totalDistance += google.maps.geometry.spherical.computeDistanceBetween(
                path[i],
                path[i + 1]
              );
            }
            
            setRouteInfo({
              distance: `${(totalDistance / 1609.34).toFixed(1)} mi`,
              duration: 'N/A',
            });
          }
        }
      });
    });
  };

  // Update driver location marker
  useEffect(() => {
    if (!map || !driverLocation || !window.google) return;

    const google = window.google;

    // Remove existing marker
    if (driverMarker) {
      driverMarker.setMap(null);
    }

    // Create new marker for driver location
    const marker = new google.maps.Marker({
      position: { lat: driverLocation.latitude, lng: driverLocation.longitude },
      map: map,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        rotation: driverLocation.heading || 0,
      },
      title: `Driver: ${load.driver?.user.firstName} ${load.driver?.user.lastName}`,
      zIndex: 1000,
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <strong>Truck ${load.truck?.truckNumber}</strong><br/>
          Driver: ${load.driver?.user.firstName} ${load.driver?.user.lastName}<br/>
          ${driverLocation.address || 'Location updated'}<br/>
          ${driverLocation.speed ? `Speed: ${driverLocation.speed.toFixed(0)} mph` : ''}<br/>
          <small>Updated: ${new Date(driverLocation.lastUpdated).toLocaleTimeString()}</small>
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    setDriverMarker(marker);

    // Update map bounds to include driver location and route
    if (map && window.google) {
      const google = window.google;
      const bounds = new google.maps.LatLngBounds();
      
      // Add driver location
      bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
      
      // Try to include route bounds if available
      // The route will be handled by the directions renderer, but we can extend bounds
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom() > 15) {
          map.setZoom(15);
        }
      });
    }
  }, [map, driverLocation, load.driver, load.truck]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please ensure Google Maps API key is configured
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border" 
        style={{ 
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }} 
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg max-w-md z-10">
          <p className="text-sm text-yellow-800 font-medium mb-1">Map Configuration Notice</p>
          <p className="text-xs text-yellow-700">
            To enable full route visualization, please enable the <strong>Directions API</strong> in your Google Cloud Console.
            The map will still display markers for pickup and delivery locations.
          </p>
        </div>
      )}
      {load.driver && load.truck && driverLocation && (
        <div className="absolute top-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Driver Location</span>
          </div>
          <div className="text-xs space-y-1">
            <p>
              <strong>Truck:</strong> {load.truck.truckNumber}
            </p>
            <p>
              <strong>Driver:</strong> {load.driver.user.firstName} {load.driver.user.lastName}
            </p>
            {driverLocation.address && (
              <p className="text-muted-foreground">{driverLocation.address}</p>
            )}
            {driverLocation.speed !== undefined && (
              <p>
                <strong>Speed:</strong> {driverLocation.speed.toFixed(0)} mph
              </p>
            )}
            <p className="text-muted-foreground">
              Updated: {new Date(driverLocation.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
      {load.driver && load.truck && !driverLocation && (
        <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-yellow-800">
            Driver location not available from Samsara
          </p>
        </div>
      )}
    </div>
  );
}

