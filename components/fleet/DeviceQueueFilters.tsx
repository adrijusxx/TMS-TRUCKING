'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface DeviceQueueFilters {
  search?: string;
  status?: string;
  deviceType?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  reviewedById?: string;
  createdFrom?: string;
  createdTo?: string;
}

interface DeviceQueueFiltersProps {
  filters: DeviceQueueFilters;
  onChange: (filters: DeviceQueueFilters) => void;
  filterOptions?: {
    makes: string[];
    models: string[];
    years: number[];
  };
}

export function DeviceQueueFiltersComponent({
  filters,
  onChange,
  filterOptions,
}: DeviceQueueFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<DeviceQueueFilters>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    const updated = { ...localFilters, search: value || undefined };
    setLocalFilters(updated);
    onChange(updated);
  };

  const handleFilterChange = (key: keyof DeviceQueueFilters, value: any) => {
    const updated = { ...localFilters, [key]: value || undefined };
    setLocalFilters(updated);
    onChange(updated);
  };

  const clearFilters = () => {
    const cleared: DeviceQueueFilters = {
      status: filters.status, // Keep status
    };
    setLocalFilters(cleared);
    onChange(cleared);
    setIsAdvancedOpen(false);
  };

  const activeFilterCount = Object.keys(localFilters).filter(
    (key) => key !== 'status' && localFilters[key as keyof DeviceQueueFilters]
  ).length;

  return (
    <div className="space-y-3">
      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, VIN, license plate..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Device Type */}
        <Select
          value={localFilters.deviceType || 'all'}
          onValueChange={(val) =>
            handleFilterChange('deviceType', val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="TRUCK">🚛 Trucks</SelectItem>
            <SelectItem value="TRAILER">🚚 Trailers</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 relative">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 px-1.5 py-0 h-5 min-w-[20px] text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Advanced Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Make */}
              {filterOptions?.makes && filterOptions.makes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Make</Label>
                  <Select
                    value={localFilters.make || 'all'}
                    onValueChange={(val) =>
                      handleFilterChange('make', val === 'all' ? undefined : val)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any make</SelectItem>
                      {filterOptions.makes.map((make) => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Model */}
              {filterOptions?.models && filterOptions.models.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Model</Label>
                  <Select
                    value={localFilters.model || 'all'}
                    onValueChange={(val) =>
                      handleFilterChange('model', val === 'all' ? undefined : val)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any model</SelectItem>
                      {filterOptions.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Year Range */}
              {filterOptions?.years && filterOptions.years.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Year Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={localFilters.yearMin?.toString() || 'any'}
                      onValueChange={(val) =>
                        handleFilterChange(
                          'yearMin',
                          val === 'any' ? undefined : parseInt(val)
                        )
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {filterOptions.years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={localFilters.yearMax?.toString() || 'any'}
                      onValueChange={(val) =>
                        handleFilterChange(
                          'yearMax',
                          val === 'any' ? undefined : parseInt(val)
                        )
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {filterOptions.years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-xs">Created Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={localFilters.createdFrom || ''}
                    onChange={(e) =>
                      handleFilterChange('createdFrom', e.target.value || undefined)
                    }
                    className="h-9"
                  />
                  <Input
                    type="date"
                    value={localFilters.createdTo || ''}
                    onChange={(e) =>
                      handleFilterChange('createdTo', e.target.value || undefined)
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Search Button */}
        {localFilters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearchChange('')}
            className="h-9 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {localFilters.deviceType && (
            <Badge variant="secondary" className="gap-1">
              Type: {localFilters.deviceType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('deviceType', undefined)}
              />
            </Badge>
          )}
          {localFilters.make && (
            <Badge variant="secondary" className="gap-1">
              Make: {localFilters.make}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('make', undefined)}
              />
            </Badge>
          )}
          {localFilters.model && (
            <Badge variant="secondary" className="gap-1">
              Model: {localFilters.model}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('model', undefined)}
              />
            </Badge>
          )}
          {localFilters.yearMin && (
            <Badge variant="secondary" className="gap-1">
              Year ≥ {localFilters.yearMin}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('yearMin', undefined)}
              />
            </Badge>
          )}
          {localFilters.yearMax && (
            <Badge variant="secondary" className="gap-1">
              Year ≤ {localFilters.yearMax}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('yearMax', undefined)}
              />
            </Badge>
          )}
          {localFilters.createdFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {new Date(localFilters.createdFrom).toLocaleDateString()}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('createdFrom', undefined)}
              />
            </Badge>
          )}
          {localFilters.createdTo && (
            <Badge variant="secondary" className="gap-1">
              To: {new Date(localFilters.createdTo).toLocaleDateString()}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('createdTo', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}



