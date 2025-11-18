'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Route } from 'lucide-react';

interface RoutePreviewProps {
  waypoints: Array<{
    city: string;
    state: string;
    type: 'pickup' | 'delivery';
    loadId?: string;
  }>;
  totalDistance?: number;
  estimatedTime?: number;
}

export default function RoutePreview({
  waypoints,
  totalDistance,
  estimatedTime,
}: RoutePreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Placeholder for Google Maps integration
    // In production, initialize Google Maps here
    // Example:
    // const map = new google.maps.Map(mapRef.current, {
    //   zoom: 6,
    //   center: { lat: 39.8283, lng: -98.5795 },
    // });
    //
    // const directionsService = new google.maps.DirectionsService();
    // const directionsRenderer = new google.maps.DirectionsRenderer();
    // directionsRenderer.setMap(map);
    //
    // const route = waypoints.map(wp => ({
    //   location: `${wp.city}, ${wp.state}`,
    // }));
    //
    // directionsService.route({
    //   origin: route[0].location,
    //   destination: route[route.length - 1].location,
    //   waypoints: route.slice(1, -1).map(w => ({ location: w.location, stopover: true })),
    //   travelMode: google.maps.TravelMode.DRIVING,
    // }, (result, status) => {
    //   if (status === 'OK') {
    //     directionsRenderer.setDirections(result);
    //   }
    // });
  }, [waypoints]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Route Preview
        </CardTitle>
        <CardDescription>
          Visual representation of the optimized route
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-96 bg-muted rounded-lg flex items-center justify-center border"
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Map Preview</p>
            <p className="text-xs mt-1">
              Google Maps integration required for full functionality
            </p>
          </div>
        </div>

        {/* Route Summary */}
        {(totalDistance || estimatedTime) && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {totalDistance && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-lg font-bold">{totalDistance} miles</p>
              </div>
            )}
            {estimatedTime && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-lg font-bold">{estimatedTime} hours</p>
              </div>
            )}
          </div>
        )}

        {/* Waypoints List */}
        {waypoints.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Route Waypoints</p>
            <div className="space-y-1">
              {waypoints.map((waypoint, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                >
                  <span className="font-medium text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {waypoint.type === 'pickup' ? 'Pickup' : 'Delivery'}
                  </Badge>
                  <span>
                    {waypoint.city}, {waypoint.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

