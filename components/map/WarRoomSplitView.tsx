'use client';

/**
 * War Room Split View - Asset list panel for side-by-side map view
 */

import { useState } from 'react';
import { Truck, Package, Fuel, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapAsset } from '@/hooks/useWarRoomState';

interface WarRoomSplitViewProps {
  assets: MapAsset[];
  selectedAssetId: string | null;
  onAssetClick: (asset: MapAsset) => void;
}

const STATUS_DOT: Record<string, string> = {
  MOVING: 'bg-green-500',
  STOPPED: 'bg-amber-500',
  DELAYED: 'bg-red-500',
  IDLE: 'bg-gray-400',
};

const STATUS_LABEL: Record<string, string> = {
  MOVING: 'Moving',
  STOPPED: 'Stopped',
  DELAYED: 'Delayed',
  IDLE: 'Idle',
};

export default function WarRoomSplitView({ assets, selectedAssetId, onAssetClick }: WarRoomSplitViewProps) {
  const [sortBy, setSortBy] = useState<'label' | 'status' | 'speed'>('label');

  const sorted = [...assets].sort((a, b) => {
    if (sortBy === 'speed') return (b.speed ?? 0) - (a.speed ?? 0);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return a.label.localeCompare(b.label);
  });

  return (
    <div className="w-72 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-xs font-medium">{assets.length} Assets</span>
        <div className="flex gap-1">
          {(['label', 'status', 'speed'] as const).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded',
                sortBy === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {key === 'label' ? 'Name' : key === 'status' ? 'Status' : 'Speed'}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map(asset => (
          <button
            key={asset.id}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-left border-b border-border/50 transition-colors',
              selectedAssetId === asset.id ? 'bg-primary/10' : 'hover:bg-muted/50'
            )}
            onClick={() => onAssetClick(asset)}
          >
            {asset.type === 'TRUCK' ? (
              <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            ) : (
              <Package className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate">{asset.label}</span>
                <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[asset.status])} />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{STATUS_LABEL[asset.status]}</span>
                {asset.speed !== undefined && asset.speed > 0 && (
                  <span>{Math.round(asset.speed)} mph</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {asset.isLowFuel && (
                <Fuel className="h-3 w-3 text-amber-500" />
              )}
              {asset.heading !== undefined && asset.heading > 0 && (
                <Navigation
                  className="h-3 w-3 text-muted-foreground"
                  style={{ transform: `rotate(${asset.heading}deg)` }}
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
