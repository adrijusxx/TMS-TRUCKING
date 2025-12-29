'use client';

/**
 * Layer Controls for Unified War Room Map
 * Compact toggle bar for map feature layers
 */

import { Button } from '@/components/ui/button';
import { Route, History, Shield, CloudSun, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LayerState } from './UnifiedWarRoom';

interface LayerControlsProps {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
}

const LAYER_CONFIG = [
  { key: 'routes' as const, label: 'Routes', icon: Route, description: 'Show load routes' },
  { key: 'trails' as const, label: 'Trails', icon: History, description: 'Show movement history' },
  { key: 'geofences' as const, label: 'Zones', icon: Shield, description: 'Show geofence zones' },
  { key: 'traffic' as const, label: 'Traffic', icon: Car, description: 'Show traffic layer' },
  { key: 'weather' as const, label: 'Weather', icon: CloudSun, description: 'Show weather overlay' },
];

export default function LayerControls({ layers, onToggle }: LayerControlsProps) {
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
          title={LAYER_CONFIG.find(l => l.key === key)?.description}
        >
          <Icon className="h-3 w-3" />
          {label}
        </Button>
      ))}
    </div>
  );
}





