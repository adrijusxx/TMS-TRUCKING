'use client';

/**
 * Unified War Room Map Component
 * Orchestrator shell — all logic extracted into hooks and sub-components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin } from 'lucide-react';
import { useLiveMap } from '@/hooks/useLiveMap';
import { useWarRoomMap } from '@/hooks/useWarRoomMap';
import { useWarRoomState } from '@/hooks/useWarRoomState';
import type { MapAsset } from '@/hooks/useWarRoomState';
import { useWarRoomEffects } from '@/hooks/useWarRoomEffects';
import { useSamsaraGeofences } from '@/hooks/useSamsaraGeofences';
import { WeatherLayerManager } from '@/lib/maps/weather-layer-manager';
import AssetDetailCard from './AssetDetailCard';
import LayerControls from './LayerControls';
import GeofenceLayer, { SAMPLE_GEOFENCES } from './GeofenceLayer';
import WarRoomHeader from './WarRoomHeader';
import WarRoomStatsBar from './WarRoomStatsBar';
import ClusterHoverCard from './ClusterHoverCard';
import WarRoomSplitView from './WarRoomSplitView';
import { SamsaraTokenPrompt } from '@/components/settings/integrations/SamsaraTokenPrompt';

// Re-export types for backward compatibility
export type { MapAsset, LayerState } from '@/hooks/useWarRoomState';

export default function UnifiedWarRoom() {
  const { loads, trucks, trailers, isLoading, isSamsaraConfigured, error, refetch } = useLiveMap();
  const mapHook = useWarRoomMap();
  const state = useWarRoomState(loads, trucks);
  const [mapType, setMapType] = useState('roadmap');
  const [hoveredCluster, setHoveredCluster] = useState<{
    assets: MapAsset[];
    position: { x: number; y: number };
  } | null>(null);
  const weatherManagerRef = useRef<WeatherLayerManager | null>(null);

  // Wire effects
  useWarRoomEffects({
    map: mapHook.map,
    clusterer: mapHook.clusterer,
    mapReady: mapHook.mapReady,
    mapZoom: mapHook.mapZoom,
    markersRef: mapHook.markersRef,
    routePolylinesRef: mapHook.routePolylinesRef,
    trailManagerRef: mapHook.trailManagerRef,
    trafficLayerRef: mapHook.trafficLayerRef,
    filteredMapAssets: state.filteredMapAssets,
    mapAssets: state.mapAssets,
    searchSingleResult: state.searchSingleResult,
    layers: state.layers,
    loads,
    activeStatusFilter: state.activeStatusFilter,
    setSelectedAsset: state.setSelectedAsset,
    setCardPosition: state.setCardPosition,
    setHoveredCluster,
  });

  // Samsara geofences (fetch when zones layer is on)
  const { data: samsaraGeofences = [] } = useSamsaraGeofences(state.layers.geofences);
  const geofences = samsaraGeofences.length > 0 ? samsaraGeofences : SAMPLE_GEOFENCES;

  // Map type change
  const handleMapTypeChange = useCallback((type: string) => {
    setMapType(type);
    mapHook.map?.setMapTypeId(type);
  }, [mapHook.map]);

  // Weather layer
  useEffect(() => {
    if (!mapHook.map || !mapHook.mapReady) return;

    if (!weatherManagerRef.current) {
      weatherManagerRef.current = new WeatherLayerManager();
    }

    if (state.layers.weather) {
      weatherManagerRef.current.enable(mapHook.map);
    } else {
      weatherManagerRef.current.disable();
    }
  }, [mapHook.map, mapHook.mapReady, state.layers.weather]);

  // Handle asset click from split view or cluster — pan only
  const handleAssetClick = useCallback((asset: MapAsset) => {
    state.setSelectedAsset(asset);
    mapHook.map?.panTo({ lat: asset.lat, lng: asset.lng });
  }, [mapHook.map, state]);

  return (
    <>
      <SamsaraTokenPrompt isOpen={!isSamsaraConfigured} />
      <div className="h-full flex flex-col bg-background rounded border overflow-hidden">
        <WarRoomHeader
          totalCount={state.mapAssets.length}
          filteredCount={state.filteredMapAssets.length}
          searchQuery={state.searchQuery}
          isLoading={isLoading}
          splitView={state.splitView}
          onSearchChange={state.setSearchQuery}
          onRefresh={() => refetch()}
          onFitAll={mapHook.handleFitAll}
          onToggleSplit={() => state.setSplitView(prev => !prev)}
        />

        <WarRoomStatsBar
          stats={state.stats}
          activeFilter={state.activeStatusFilter}
          onFilterClick={state.handleStatusFilterClick}
        />

        <LayerControls
          layers={state.layers}
          onToggle={state.handleLayerToggle}
          activeMapType={mapType}
          onMapTypeChange={handleMapTypeChange}
        />

        {/* Map + Split View */}
        <div className="flex-1 flex relative">
          {/* Map Container */}
          <div className="flex-1 relative">
            <div ref={mapHook.mapRef} className="absolute inset-0" />

            {/* Loading state */}
            {isLoading && state.mapAssets.length === 0 && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <Skeleton className="h-6 w-24 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading fleet data...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-xs text-destructive">Failed to load map data</p>
                  <Button variant="outline" size="sm" className="mt-2 h-6 text-xs" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* No data state */}
            {!isLoading && !error && state.mapAssets.length === 0 && mapHook.mapReady && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
                <div className="text-center p-4">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No assets with GPS data</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Samsara integration provides real-time location data
                  </p>
                </div>
              </div>
            )}

            {/* Geofence Layer */}
            <GeofenceLayer
              map={mapHook.map}
              geofences={geofences}
              enabled={state.layers.geofences}
            />

            {/* Asset Detail Card */}
            {state.selectedAsset && state.cardPosition && (
              <AssetDetailCard
                asset={state.selectedAsset}
                position={state.cardPosition}
                onClose={state.handleCloseCard}
              />
            )}

            {/* Cluster Hover Card */}
            {hoveredCluster && (
              <ClusterHoverCard
                assets={hoveredCluster.assets}
                position={hoveredCluster.position}
                onClose={() => setHoveredCluster(null)}
                onAssetClick={handleAssetClick}
              />
            )}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg p-2 text-[10px] border shadow-sm z-20">
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Moving
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Stopped
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Delayed
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Idle
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Low Fuel
                </span>
              </div>
            </div>
          </div>

          {/* Split View Panel */}
          {state.splitView && (
            <WarRoomSplitView
              assets={state.filteredMapAssets}
              selectedAssetId={state.selectedAsset?.id ?? null}
              onAssetClick={handleAssetClick}
            />
          )}
        </div>
      </div>
    </>
  );
}
