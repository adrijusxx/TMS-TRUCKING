'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { loadGoogleMapsApi } from '@/lib/maps/google-loader';

interface Waypoint {
  city: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapsRoutePreviewProps {
  waypoints: Waypoint[];
  onRouteCalculated?: (distance: number, duration: number) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsRoutePreview({
  waypoints,
  onRouteCalculated,
}: GoogleMapsRoutePreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMaps = async () => {
      try {
        await loadGoogleMapsApi(['places', 'geometry']);
        if (isMounted) {
          initializeMap();
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

    const directionsServiceInstance = new google.maps.DirectionsService();
    const directionsRendererInstance = new google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false,
    });

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!directionsService || !directionsRenderer || waypoints.length < 2) return;

    // Geocode waypoints if needed
    const geocodeWaypoints = async () => {
      const geocoder = new window.google.maps.Geocoder();
      const geocodedWaypoints: Array<{ lat: number; lng: number }> = [];

      for (const waypoint of waypoints) {
        if (waypoint.latitude && waypoint.longitude) {
          geocodedWaypoints.push({
            lat: waypoint.latitude,
            lng: waypoint.longitude,
          });
        } else {
          try {
            const address = waypoint.address
              ? `${waypoint.address}, ${waypoint.city}, ${waypoint.state}`
              : `${waypoint.city}, ${waypoint.state}`;
            const result = await new Promise<any>((resolve, reject) => {
              geocoder.geocode({ address }, (results: any, status: any) => {
                if (status === 'OK' && results[0]) {
                  resolve(results[0].geometry.location);
                } else {
                  reject(new Error('Geocoding failed'));
                }
              });
            });
            geocodedWaypoints.push({
              lat: result.lat(),
              lng: result.lng(),
            });
          } catch (err) {
            console.error('Geocoding error:', err);
            // Fallback to city/state
            const fallbackResult = await new Promise<any>((resolve, reject) => {
              geocoder.geocode(
                { address: `${waypoint.city}, ${waypoint.state}` },
                (results: any, status: any) => {
                  if (status === 'OK' && results[0]) {
                    resolve(results[0].geometry.location);
                  } else {
                    reject(new Error('Geocoding failed'));
                  }
                }
              );
            });
            geocodedWaypoints.push({
              lat: fallbackResult.lat(),
              lng: fallbackResult.lng(),
            });
          }
        }
      }

      return geocodedWaypoints;
    };

    const calculateRoute = async () => {
      try {
        setIsLoading(true);
        const geocodedWaypoints = await geocodeWaypoints();

        if (geocodedWaypoints.length < 2) {
          setError('Unable to geocode waypoints');
          setIsLoading(false);
          return;
        }

        const origin = geocodedWaypoints[0];
        const destination = geocodedWaypoints[geocodedWaypoints.length - 1];
        const waypointsList =
          geocodedWaypoints.length > 2
            ? geocodedWaypoints.slice(1, -1).map((wp) => ({
                location: wp,
                stopover: true,
              }))
            : [];

        directionsService.route(
          {
            origin,
            destination,
            waypoints: waypointsList,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (result: any, status: any) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(result);

              // Extract route info
              const route = result.routes[0];
              const leg = route.legs[0];
              let totalDistance = 0;
              let totalDuration = 0;

              route.legs.forEach((leg: any) => {
                totalDistance += leg.distance.value;
                totalDuration += leg.duration.value;
              });

              const distanceText = `${(totalDistance / 1609.34).toFixed(1)} mi`;
              const durationText = `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`;

              setRouteInfo({ distance: distanceText, duration: durationText });
              setError(null);

              if (onRouteCalculated) {
                onRouteCalculated(totalDistance, totalDuration);
              }
            } else {
              setError(`Route calculation failed: ${status}`);
            }
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Route calculation error:', err);
        setError('Failed to calculate route');
        setIsLoading(false);
      }
    };

    calculateRoute();
  }, [directionsService, directionsRenderer, waypoints, onRouteCalculated]);

  if (error && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Route Preview</CardTitle>
          <CardDescription>Google Maps integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Google Maps API key not configured</p>
            <p className="text-sm mt-2">
              Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Route Preview
        </CardTitle>
        <CardDescription>
          {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {routeInfo && (
          <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Distance: </span>
              <span className="text-sm">{routeInfo.distance}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Duration: </span>
              <span className="text-sm">{routeInfo.duration}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-[500px] rounded-lg border border-slate-200"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {waypoints.map((waypoint, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 bg-muted rounded text-sm"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {idx + 1}
              </div>
              <div>
                <p className="font-medium">
                  {waypoint.address || `${waypoint.city}, ${waypoint.state}`}
                </p>
                <p className="text-muted-foreground text-xs">
                  {waypoint.city}, {waypoint.state}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

