'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Map as MapIcon,
  Satellite,
  Mountain,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MapControlsProps {
  map: any;
  onFitBounds?: () => void;
  onCenterSelected?: () => void;
  selectedTruck?: { location?: { lat: number; lng: number } } | null;
}

export function MapControls({
  map,
  onFitBounds,
  onCenterSelected,
  selectedTruck,
}: MapControlsProps) {
  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (map) {
      const currentZoom = (map as any).getZoom?.() || 10;
      const maxZoom = (map as any).get?.('maxZoom') || 18;
      if (currentZoom < maxZoom) {
        (map as any).setZoom?.(currentZoom + 1);
      }
    }
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (map) {
      const currentZoom = (map as any).getZoom?.() || 10;
      const minZoom = (map as any).get?.('minZoom') || 3;
      if (currentZoom > minZoom) {
        (map as any).setZoom?.(currentZoom - 1);
      }
    }
  };

  const handleFitBounds = () => {
    if (onFitBounds) {
      onFitBounds();
    } else if (map) {
      // Default behavior: fit to all visible markers
      const bounds = new (window as any).google.maps.LatLngBounds();
      // This would need to be called with actual bounds
      if (bounds && Object.keys(bounds).length > 0) {
        (map as any).fitBounds?.(bounds);
      }
    }
  };

  const handleCenterSelected = () => {
    if (onCenterSelected) {
      onCenterSelected();
    } else if (map && selectedTruck?.location) {
      (map as any).setCenter?.({
        lat: selectedTruck.location.lat,
        lng: selectedTruck.location.lng,
      });
      (map as any).setZoom?.(15);
    }
  };

  const handleMapTypeChange = (mapTypeId: string) => {
    if (map) {
      (map as any).setMapTypeId?.(mapTypeId);
    }
  };

  const [currentZoom, setCurrentZoom] = useState(10);

  useEffect(() => {
    if (!map) return;

    const updateZoom = () => {
      const zoom = (map as any).getZoom?.();
      if (zoom !== null && zoom !== undefined) {
        setCurrentZoom(zoom);
      }
    };

    // Set initial zoom
    updateZoom();

    // Listen for zoom changes
    const listener = (map as any).addListener?.('zoom_changed', updateZoom);

    return () => {
      if (listener && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.removeListener(listener);
      }
    };
  }, [map]);

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="flex flex-col bg-white rounded-lg shadow-lg border overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-none"
          onClick={handleZoomIn}
          disabled={!map}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="px-3 py-1 text-xs text-center text-muted-foreground border-t border-b">
          {currentZoom}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-none"
          onClick={handleZoomOut}
          disabled={!map}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg border p-1">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          onClick={handleFitBounds}
          disabled={!map}
        >
          <Navigation className="h-4 w-4" />
          <span className="text-xs">Fit Bounds</span>
        </Button>

        {selectedTruck && (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            onClick={handleCenterSelected}
            disabled={!map || !selectedTruck.location}
          >
            <Maximize2 className="h-4 w-4" />
            <span className="text-xs">Center Selected</span>
          </Button>
        )}

        {/* Map Type Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="justify-start gap-2">
              <MapIcon className="h-4 w-4" />
              <span className="text-xs">Map Type</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleMapTypeChange('roadmap')}>
              <MapIcon className="h-4 w-4 mr-2" />
              Roadmap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMapTypeChange('satellite')}>
              <Satellite className="h-4 w-4 mr-2" />
              Satellite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMapTypeChange('terrain')}>
              <Mountain className="h-4 w-4 mr-2" />
              Terrain
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMapTypeChange('hybrid')}>
              <Satellite className="h-4 w-4 mr-2" />
              Hybrid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

