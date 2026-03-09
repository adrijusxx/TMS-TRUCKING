'use client';

/**
 * Cluster Hover Card - Mini asset list shown on cluster hover
 */

import { useEffect, useRef, useState } from 'react';
import { Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapAsset } from '@/hooks/useWarRoomState';

interface ClusterHoverCardProps {
  assets: MapAsset[];
  position: { x: number; y: number };
  onClose: () => void;
  onAssetClick: (asset: MapAsset) => void;
}

const STATUS_DOT: Record<string, string> = {
  MOVING: 'bg-green-500',
  STOPPED: 'bg-amber-500',
  DELAYED: 'bg-red-500',
  IDLE: 'bg-gray-400',
};

export default function ClusterHoverCard({ assets, position, onClose, onAssetClick }: ClusterHoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(position);

  useEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    let x = position.x + 10;
    let y = position.y - 10;

    if (x + rect.width > window.innerWidth - 16) x = position.x - rect.width - 10;
    if (y + rect.height > window.innerHeight - 16) y = window.innerHeight - rect.height - 16;
    if (y < 16) y = 16;

    setPos({ x, y });
  }, [position]);

  const displayAssets = assets.slice(0, 8);
  const remaining = assets.length - displayAssets.length;

  return (
    <div
      ref={cardRef}
      className="fixed z-40 w-56 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2"
      style={{ left: pos.x, top: pos.y }}
      onMouseLeave={onClose}
    >
      <p className="text-[10px] text-muted-foreground mb-1.5 px-1">
        {assets.length} assets in cluster
      </p>
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {displayAssets.map(asset => (
          <button
            key={asset.id}
            className="flex items-center gap-2 w-full px-1.5 py-1 rounded text-xs hover:bg-muted transition-colors text-left"
            onClick={() => onAssetClick(asset)}
          >
            {asset.type === 'TRUCK' ? (
              <Truck className="h-3 w-3 text-blue-600 shrink-0" />
            ) : (
              <Package className="h-3 w-3 text-purple-600 shrink-0" />
            )}
            <span className="font-medium truncate flex-1">{asset.label}</span>
            <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[asset.status])} />
            {asset.speed !== undefined && asset.speed > 0 && (
              <span className="text-muted-foreground text-[10px]">{Math.round(asset.speed)}mph</span>
            )}
          </button>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          +{remaining} more
        </p>
      )}
    </div>
  );
}
