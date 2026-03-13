'use client';

/**
 * War Room state management hook
 * Manages map assets, filtering, stats, layers, and selection state
 */

import { useState, useMemo, useCallback } from 'react';
import type { LoadMapEntry, TruckMapEntry } from '@/lib/maps/live-map-service';

// ============================================
// TYPES
// ============================================

export interface MapAsset {
  id: string;
  type: 'TRUCK' | 'LOAD';
  lat: number;
  lng: number;
  status: 'MOVING' | 'STOPPED' | 'IDLE' | 'DELAYED';
  label: string;
  speed?: number;
  heading?: number;
  isLowFuel?: boolean;
  // Source data
  truckData?: TruckMapEntry;
  loadData?: LoadMapEntry;
}

export interface LayerState {
  routes: boolean;
  trails: boolean;
  geofences: boolean;
  traffic: boolean;
  weather: boolean;
  heatMap: boolean;
}

export type StatusFilter = MapAsset['status'] | 'LOW_FUEL' | null;

export interface WarRoomStats {
  trucks: number;
  loads: number;
  moving: number;
  stopped: number;
  delayed: number;
  lowFuel: number;
}

// ============================================
// HOOK
// ============================================

export function useWarRoomState(loads: LoadMapEntry[], trucks: TruckMapEntry[]) {
  const [selectedAsset, setSelectedAsset] = useState<MapAsset | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>(null);
  const [splitView, setSplitView] = useState(false);
  const [layers, setLayers] = useState<LayerState>({
    routes: true,
    trails: false,
    geofences: false,
    traffic: false,
    weather: false,
    heatMap: false,
  });

  // Transform data into map assets
  const mapAssets = useMemo(() => {
    const assets: MapAsset[] = [];

    // Add trucks with location
    trucks.forEach(truck => {
      if (truck.location?.lat && truck.location?.lng) {
        const speed = truck.sensors?.speed?.value ?? truck.location.speed ?? 0;
        const status: MapAsset['status'] = speed > 0 ? 'MOVING' : 'STOPPED';
        const activeLoad = loads.find(load => load.truck?.id === truck.id);
        const fuelPct = truck.sensors?.fuelPercent;
        const isLowFuel = fuelPct !== undefined && fuelPct !== null && fuelPct < 25;

        assets.push({
          id: truck.id,
          type: 'TRUCK',
          lat: truck.location.lat,
          lng: truck.location.lng,
          status,
          label: truck.truckNumber,
          speed,
          heading: truck.location.heading,
          isLowFuel,
          truckData: truck,
          loadData: activeLoad,
        });
      }
    });

    // Add loads with location (from truck position)
    loads.forEach(load => {
      if (load.truckLocation?.lat && load.truckLocation?.lng) {
        const speed = load.truckSensors?.speed?.value ?? load.truckLocation.speed ?? 0;
        let status: MapAsset['status'] = speed > 0 ? 'MOVING' : 'STOPPED';

        if (load.status === 'EN_ROUTE_DELIVERY' && speed === 0) {
          status = 'DELAYED';
        }

        assets.push({
          id: load.id,
          type: 'LOAD',
          lat: load.truckLocation.lat,
          lng: load.truckLocation.lng,
          status,
          label: load.loadNumber,
          speed,
          heading: load.truckLocation.heading,
          loadData: load,
        });
      }
    });

    return assets;
  }, [loads, trucks]);

  // Filter assets based on search + status filter
  const filteredMapAssets = useMemo(() => {
    let assets = mapAssets;

    // Apply status filter
    if (activeStatusFilter === 'LOW_FUEL') {
      assets = assets.filter(a => a.isLowFuel);
    } else if (activeStatusFilter) {
      assets = assets.filter(a => a.status === activeStatusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      assets = assets.filter(a =>
        a.label.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)
      );
    }

    return assets;
  }, [mapAssets, activeStatusFilter, searchQuery]);

  // Single search result for zoom-to
  const searchSingleResult = useMemo(() => {
    if (!searchQuery.trim() || filteredMapAssets.length !== 1) return null;
    return filteredMapAssets[0];
  }, [searchQuery, filteredMapAssets]);

  // Stats
  const stats: WarRoomStats = useMemo(() => {
    const trucksWithLocation = trucks.filter(t => t.location?.lat);
    const lowFuelTrucks = trucksWithLocation.filter(t =>
      t.sensors?.fuelPercent !== undefined && t.sensors.fuelPercent < 25
    );

    return {
      trucks: trucksWithLocation.length,
      loads: loads.filter(l => l.truckLocation?.lat).length,
      moving: mapAssets.filter(a => a.status === 'MOVING').length,
      stopped: mapAssets.filter(a => a.status === 'STOPPED' || a.status === 'IDLE').length,
      delayed: mapAssets.filter(a => a.status === 'DELAYED').length,
      lowFuel: lowFuelTrucks.length,
    };
  }, [trucks, loads, mapAssets]);

  // Handlers
  const handleLayerToggle = useCallback((layer: keyof LayerState) => {
    setLayers(prev => {
      // Heat map and normal markers are mutually exclusive
      if (layer === 'heatMap') {
        return { ...prev, heatMap: !prev.heatMap };
      }
      return { ...prev, [layer]: !prev[layer] };
    });
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedAsset(null);
    setCardPosition(null);
  }, []);

  const handleStatusFilterClick = useCallback((filter: StatusFilter) => {
    setActiveStatusFilter(prev => prev === filter ? null : filter);
  }, []);

  return {
    mapAssets,
    filteredMapAssets,
    searchSingleResult,
    stats,
    layers,
    selectedAsset,
    setSelectedAsset,
    cardPosition,
    setCardPosition,
    searchQuery,
    setSearchQuery,
    activeStatusFilter,
    splitView,
    setSplitView,
    handleLayerToggle,
    handleCloseCard,
    handleStatusFilterClick,
  };
}
