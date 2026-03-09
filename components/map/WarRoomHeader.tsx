'use client';

/**
 * War Room Header - Search, asset count, and action buttons
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Maximize2, Search, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarRoomHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  isLoading: boolean;
  splitView: boolean;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onFitAll: () => void;
  onToggleSplit: () => void;
}

export default function WarRoomHeader({
  totalCount, filteredCount, searchQuery, isLoading, splitView,
  onSearchChange, onRefresh, onFitAll, onToggleSplit,
}: WarRoomHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-fit">
          {filteredCount} / {totalCount}
        </Badge>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search trucks, loads..."
            className="h-7 text-xs pl-7 bg-background"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data"
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={onFitAll}
          title="Reset view — fit all assets"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button
          variant={splitView ? 'default' : 'ghost'}
          size="sm"
          className="h-6 text-xs px-2"
          onClick={onToggleSplit}
          title="Toggle split view"
        >
          <PanelRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
