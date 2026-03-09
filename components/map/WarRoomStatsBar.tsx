'use client';

/**
 * War Room Stats Bar - Clickable status filters
 */

import { Truck, Package, Fuel } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WarRoomStats, StatusFilter } from '@/hooks/useWarRoomState';

interface WarRoomStatsBarProps {
  stats: WarRoomStats;
  activeFilter: StatusFilter;
  onFilterClick: (filter: StatusFilter) => void;
}

export default function WarRoomStatsBar({ stats, activeFilter, onFilterClick }: WarRoomStatsBarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-b text-xs bg-background">
      <span className="flex items-center gap-1">
        <Truck className="h-3 w-3 text-blue-600" />
        <span className="font-medium">{stats.trucks}</span> trucks
      </span>
      <span className="flex items-center gap-1">
        <Package className="h-3 w-3 text-purple-600" />
        <span className="font-medium">{stats.loads}</span> loads
      </span>
      <div className="h-3 w-px bg-border" />

      <StatButton
        color="bg-green-500"
        label="moving"
        count={stats.moving}
        active={activeFilter === 'MOVING'}
        onClick={() => onFilterClick('MOVING')}
      />
      <StatButton
        color="bg-amber-500"
        label="stopped"
        count={stats.stopped}
        active={activeFilter === 'STOPPED'}
        onClick={() => onFilterClick('STOPPED')}
      />
      {stats.delayed > 0 && (
        <StatButton
          color="bg-red-500"
          label="delayed"
          count={stats.delayed}
          active={activeFilter === 'DELAYED'}
          onClick={() => onFilterClick('DELAYED')}
          textColor="text-red-600"
        />
      )}
      {stats.lowFuel > 0 && (
        <>
          <div className="h-3 w-px bg-border" />
          <button
            onClick={() => onFilterClick('LOW_FUEL')}
            className={cn(
              'flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
              activeFilter === 'LOW_FUEL'
                ? 'bg-amber-100 ring-1 ring-amber-400'
                : 'hover:bg-muted'
            )}
          >
            <Fuel className="h-3 w-3 text-amber-600" />
            <span className="font-medium text-amber-600">{stats.lowFuel}</span>
            <span className="text-amber-600">low fuel</span>
          </button>
        </>
      )}
    </div>
  );
}

function StatButton({ color, label, count, active, onClick, textColor }: {
  color: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  textColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
        active ? 'bg-muted ring-1 ring-primary' : 'hover:bg-muted',
        textColor
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', color)} />
      <span className="font-medium">{count}</span> {label}
    </button>
  );
}
