'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export type LoadBoardFilter = 
  | 'ALL'
  | 'HOME' 
  | 'OTR' 
  | 'HOME_ALERTS' 
  | 'ONBOARD' 
  | 'IN_SHOP' 
  | 'DROP';

interface FilterConfig {
  id: LoadBoardFilter;
  label: string;
  color?: string;
}

const FILTERS: FilterConfig[] = [
  { id: 'HOME', label: 'HOME' },
  { id: 'OTR', label: 'OTR' },
  { id: 'HOME_ALERTS', label: 'HOME_ALERTS', color: 'bg-amber-500' },
  { id: 'ONBOARD', label: 'ONBOARD', color: 'bg-emerald-500' },
  { id: 'IN_SHOP', label: 'IN SHOP', color: 'bg-orange-500' },
  { id: 'DROP', label: 'DROP' },
];

interface LoadBoardFiltersProps {
  activeFilter: LoadBoardFilter;
  onFilterChange: (filter: LoadBoardFilter) => void;
  counts?: Record<LoadBoardFilter, number>;
}

export default function LoadBoardFilters({
  activeFilter,
  onFilterChange,
  counts = {} as Record<LoadBoardFilter, number>,
}: LoadBoardFiltersProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {FILTERS.map((filter) => {
        const count = counts[filter.id] || 0;
        const isActive = activeFilter === filter.id;
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              'h-6 text-xs px-2 gap-1',
              isActive && filter.color && filter.color,
              !isActive && 'bg-background'
            )}
          >
            {filter.label}
            {count > 0 && (
              <Badge 
                variant={isActive ? 'secondary' : 'outline'} 
                className="h-4 px-1 text-[10px] min-w-[18px] justify-center"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        title="Add custom filter"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}





