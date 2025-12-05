'use client';

/**
 * Geofence Layer Component
 * Renders geofence zones (circles/polygons) on the map
 * Integration point for future geofence API
 */

import { useEffect, useRef } from 'react';

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  // For circles
  center?: { lat: number; lng: number };
  radius?: number; // in meters
  // For polygons
  path?: Array<{ lat: number; lng: number }>;
  // Styling
  color?: string;
  fillOpacity?: number;
  strokeWeight?: number;
}

interface GeofenceLayerProps {
  map: google.maps.Map | null;
  geofences: Geofence[];
  enabled: boolean;
  onGeofenceClick?: (geofence: Geofence) => void;
}

// Sample geofences for demo (would come from API in production)
export const SAMPLE_GEOFENCES: Geofence[] = [
  {
    id: 'terminal-1',
    name: 'Main Terminal',
    type: 'circle',
    center: { lat: 39.7392, lng: -104.9903 }, // Denver
    radius: 5000, // 5km
    color: '#22c55e',
  },
  {
    id: 'customer-zone-1',
    name: 'Customer Distribution Center',
    type: 'circle',
    center: { lat: 41.8781, lng: -87.6298 }, // Chicago
    radius: 3000,
    color: '#3b82f6',
  },
];

export default function GeofenceLayer({ 
  map, 
  geofences, 
  enabled, 
  onGeofenceClick 
}: GeofenceLayerProps) {
  const shapesRef = useRef<Array<google.maps.Circle | google.maps.Polygon>>([]);

  useEffect(() => {
    // Clear existing shapes
    shapesRef.current.forEach(shape => shape.setMap(null));
    shapesRef.current = [];

    if (!map || !enabled) return;

    // Create new shapes
    geofences.forEach(geofence => {
      if (geofence.type === 'circle' && geofence.center && geofence.radius) {
        const circle = new google.maps.Circle({
          map,
          center: geofence.center,
          radius: geofence.radius,
          strokeColor: geofence.color || '#6b7280',
          strokeOpacity: 0.8,
          strokeWeight: geofence.strokeWeight || 2,
          fillColor: geofence.color || '#6b7280',
          fillOpacity: geofence.fillOpacity || 0.15,
          zIndex: 10,
        });

        // Add click listener
        if (onGeofenceClick) {
          circle.addListener('click', () => onGeofenceClick(geofence));
        }

        // Add label
        const infoWindow = new google.maps.InfoWindow({
          content: `<div class="text-xs font-medium p-1">${geofence.name}</div>`,
          position: geofence.center,
        });
        
        circle.addListener('mouseover', () => infoWindow.open(map));
        circle.addListener('mouseout', () => infoWindow.close());

        shapesRef.current.push(circle);
      } else if (geofence.type === 'polygon' && geofence.path) {
        const polygon = new google.maps.Polygon({
          map,
          paths: geofence.path,
          strokeColor: geofence.color || '#6b7280',
          strokeOpacity: 0.8,
          strokeWeight: geofence.strokeWeight || 2,
          fillColor: geofence.color || '#6b7280',
          fillOpacity: geofence.fillOpacity || 0.15,
          zIndex: 10,
        });

        if (onGeofenceClick) {
          polygon.addListener('click', () => onGeofenceClick(geofence));
        }

        shapesRef.current.push(polygon);
      }
    });

    return () => {
      shapesRef.current.forEach(shape => shape.setMap(null));
      shapesRef.current = [];
    };
  }, [map, geofences, enabled, onGeofenceClick]);

  return null; // This is a render-less component
}

/**
 * Check if a point is inside a geofence
 */
export function isPointInGeofence(
  point: { lat: number; lng: number },
  geofence: Geofence
): boolean {
  if (geofence.type === 'circle' && geofence.center && geofence.radius) {
    const distance = haversineDistance(
      point.lat, point.lng,
      geofence.center.lat, geofence.center.lng
    );
    return distance <= geofence.radius / 1000; // Convert meters to km
  }
  
  // For polygons, would need ray casting algorithm
  // Simplified for now
  return false;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}





