'use client';

/**
 * Layer Controls for Unified War Room Map
 * Layer toggles + map type switcher
 */

import { Button } from '@/components/ui/button';
import { Route, History, Shield, CloudSun, Car, Flame, Map, Satellite, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LayerState } from '@/hooks/useWarRoomState';

interface LayerControlsProps {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
  activeMapType?: string;
  onMapTypeChange?: (type: string) => void;
}

const LAYER_CONFIG = [
  { key: 'routes' as const, label: 'Routes', icon: Route },
  { key: 'trails' as const, label: 'Trails', icon: History },
  { key: 'geofences' as const, label: 'Zones', icon: Shield },
  { key: 'traffic' as const, label: 'Traffic', icon: Car },
  { key: 'weather' as const, label: 'Weather', icon: CloudSun },
  { key: 'heatMap' as const, label: 'Heat Map', icon: Flame },
];

const MAP_TYPES = [
  { id: 'roadmap', label: 'Map', icon: Map },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
  { id: 'hybrid', label: 'Hybrid', icon: Satellite },
];

export default function LayerControls({
  layers, onToggle, activeMapType = 'roadmap', onMapTypeChange,
}: LayerControlsProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/20">
      <span className="text-[10px] text-muted-foreground mr-1">Layers:</span>
      {LAYER_CONFIG.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={layers[key] ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-5 text-[10px] px-1.5 gap-1',
            layers[key] && 'bg-primary/90 hover:bg-primary',
            !layers[key] && 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onToggle(key)}
        >
          <Icon className="h-3 w-3" />
          {label}
        </Button>
      ))}

      {/* Map Type Switcher */}
      {onMapTypeChange && (
        <>
          <div className="h-3 w-px bg-border mx-1" />
          <span className="text-[10px] text-muted-foreground mr-1">View:</span>
          {MAP_TYPES.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeMapType === id ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-5 text-[10px] px-1.5 gap-1',
                activeMapType === id && 'bg-primary/90 hover:bg-primary',
                activeMapType !== id && 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onMapTypeChange(id)}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          ))}
        </>
      )}
    </div>
  );
}
