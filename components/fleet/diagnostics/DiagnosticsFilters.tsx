'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DIAGNOSTIC_CATEGORIES, SEVERITY_LEVELS } from '@/lib/data/dtc-codes';

export interface DiagnosticsFiltersState {
  status: 'active' | 'resolved' | 'all';
  severity: string;
  category: string;
  truckId: string;
  search: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface DiagnosticsFiltersProps {
  filters: DiagnosticsFiltersState;
  onFiltersChange: (filters: DiagnosticsFiltersState) => void;
  trucks?: Array<{ id: string; truckNumber: string }>;
}

export function DiagnosticsFilters({
  filters,
  onFiltersChange,
  trucks = [],
}: DiagnosticsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof DiagnosticsFiltersState>(
    key: K,
    value: DiagnosticsFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'active',
      severity: '',
      category: '',
      truckId: '',
      search: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters =
    filters.severity ||
    filters.category ||
    filters.truckId ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status !== 'active';

  return (
    <div className="space-y-3">
      {/* Main filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search codes, descriptions..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter('status', value as 'active' | 'resolved' | 'all')}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        {/* Severity */}
        <Select
          value={filters.severity}
          onValueChange={(value) => updateFilter('severity', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {Object.entries(SEVERITY_LEVELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key.toUpperCase()}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={filters.category}
          onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(DIAGNOSTIC_CATEGORIES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn('h-9', showAdvanced && 'bg-accent')}
        >
          <Filter className="h-4 w-4 mr-1" />
          Advanced
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
          {/* Truck selector */}
          <Select
            value={filters.truckId}
            onValueChange={(value) => updateFilter('truckId', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Trucks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trucks</SelectItem>
              {trucks.map((truck) => (
                <SelectItem key={truck.id} value={truck.id}>
                  {truck.truckNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date From */}
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              className="h-9 w-[140px]"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
              placeholder="From date"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              className="h-9 w-[140px]"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
              placeholder="To date"
            />
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {filters.status !== 'active' && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.status}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('status', 'active')}
              />
            </Badge>
          )}
          {filters.severity && (
            <Badge variant="secondary" className="text-xs">
              Severity: {filters.severity}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('severity', '')}
              />
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="text-xs">
              Category: {filters.category}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('category', '')}
              />
            </Badge>
          )}
          {filters.truckId && (
            <Badge variant="secondary" className="text-xs">
              Truck: {trucks.find((t) => t.id === filters.truckId)?.truckNumber || 'Selected'}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('truckId', '')}
              />
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: "{filters.search}"
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('search', '')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

