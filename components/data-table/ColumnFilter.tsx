'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ColumnFilterValue {
  value: string | null;
  label: string;
  count: number;
}

interface ColumnFilterProps {
  columnId: string;
  filterKey: string;
  entityType: string;
  value?: string[];
  onChange: (values: string[]) => void;
  onClear: () => void;
}

async function fetchColumnValues(
  entityType: string,
  column: string
): Promise<ColumnFilterValue[]> {
  const response = await fetch(apiUrl(`/api/${entityType}/column-values?column=${column}`));
  if (!response.ok) {
    throw new Error('Failed to fetch column values');
  }
  const result = await response.json();
  return result.data || [];
}

export function ColumnFilter({
  columnId,
  filterKey,
  entityType,
  value = [],
  onChange,
  onClear,
}: ColumnFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: values = [], isLoading } = useQuery({
    queryKey: [`column-values-${entityType}-${filterKey}`],
    queryFn: () => fetchColumnValues(entityType, filterKey),
    enabled: open, // Only fetch when popover is open
  });

  const filteredValues = React.useMemo(() => {
    if (!searchQuery) return values;
    return values.filter((v) =>
      v.label?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [values, searchQuery]);

  const handleToggle = (itemValue: string) => {
    const newValues = value.includes(itemValue)
      ? value.filter((v) => v !== itemValue)
      : [...value, itemValue];
    onChange(newValues);
  };

  const handleClear = () => {
    onClear();
    setSearchQuery('');
  };

  const hasActiveFilter = value.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 relative',
            hasActiveFilter && 'bg-primary/10 text-primary'
          )}
        >
          <Filter className="h-3 w-3" />
          {hasActiveFilter && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
            >
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 space-y-2">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 px-2 text-sm border rounded-md"
            />
          </div>

          {/* Clear filter button */}
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full justify-start text-xs h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filter
            </Button>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Values list */}
          {!isLoading && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredValues.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No values found
                </div>
              ) : (
                filteredValues.map((item) => {
                  const isSelected = value.includes(item.value || '');
                  return (
                    <div
                      key={item.value || 'null'}
                      className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleToggle(item.value || '')}
                    >
                      <Checkbox checked={isSelected} />
                      <span className="flex-1 text-sm">{item.label || 'N/A'}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

