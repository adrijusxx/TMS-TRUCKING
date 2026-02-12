'use client';

import * as React from 'react';
import { Search, X, Filter, Download, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { ColumnFiltersState, FilterDefinition } from './types';
import SavedFilters from '@/components/filters/SavedFilters';
import { usePermissions } from '@/hooks/usePermissions';
import { CheckSquare } from 'lucide-react';
import { ImportWizard } from '@/components/shared/import-wizard';
import { FilterSearchableSelect } from './FilterSearchableSelect';

interface TableToolbarProps {
  /**
   * Search query value
   */
  searchValue: string;
  /**
   * Search query change handler
   */
  onSearchChange: (value: string) => void;
  /**
   * Current column filters
   */
  columnFilters: ColumnFiltersState;
  /**
   * Column filters change handler
   */
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  /**
   * Filter definitions from table config
   */
  filterDefinitions?: FilterDefinition[];
  /**
   * Entity type for saved filters
   */
  entityType: string;
  /**
   * Search placeholder text
   */
  searchPlaceholder?: string;
  /**
   * Debounce delay for search (default: 300ms)
   */
  searchDebounce?: number;
  /**
   * On select all handler (optional)
   */
  onSelectAll?: () => void;
  /**
   * Whether select all is loading
   */
  isSelectingAll?: boolean;
  /**
   * Total count of records matching filters
   */
  totalCount?: number;
  /**
   * Enable export functionality
   */
  enableExport?: boolean;
  /**
   * Export handler - exports current filtered data
   */
  onExport?: () => void;
  /**
   * Enable import functionality
   */
  enableImport?: boolean;
  /**
   * Import handler - opens import modal
   */
  onImport?: () => void;
  /**
   * Required fields for import (used with ImportWizard)
   */
  importRequiredFields?: string[];
  /**
   * Custom actions to be rendered in the toolbar
   */
  toolbarActions?: React.ReactNode;
}

/**
 * TableToolbar component
 * Provides search input and advanced filters UI for data tables
 */
export function TableToolbar({
  searchValue,
  onSearchChange,
  columnFilters,
  onColumnFiltersChange,
  filterDefinitions = [],
  entityType,
  searchPlaceholder,
  searchDebounce = 300,
  onSelectAll,
  isSelectingAll = false,
  totalCount,
  enableExport = false,
  onExport,
  enableImport = false,
  onImport,
  importRequiredFields = [],
  toolbarActions,
}: TableToolbarProps) {
  const { can, isAdmin } = usePermissions();
  // Capture onImport at the top level to avoid type narrowing issues
  const importHandler = onImport;
  const [importWizardOpen, setImportWizardOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(searchValue);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounce search input
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange(searchInput);
    }, searchDebounce);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput, onSearchChange, searchDebounce]);

  // Sync external search value changes
  React.useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  // Filter values from columnFilters
  const filterValues = React.useMemo(() => {
    const values: Record<string, any> = {};
    columnFilters.forEach((filter: { id: string; value: any }) => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        // Parse JSON if it's a complex value (for multiselect, daterange, etc.)
        try {
          const parsed = JSON.parse(String(filter.value));
          values[filter.id] = parsed;
        } catch {
          values[filter.id] = filter.value;
        }
      }
    });
    return values;
  }, [columnFilters]);

  // Count active filters (excluding search)
  const activeFilterCount = React.useMemo(() => {
    return columnFilters.filter(
      (f: { id: string; value: any }) => f.id !== 'search' && f.value !== undefined && f.value !== null && f.value !== ''
    ).length;
  }, [columnFilters]);

  // Handle filter change
  const handleFilterChange = (key: string, value: any, filterType?: string) => {
    const newFilters = columnFilters.filter((f) => f.id !== key && !f.id.startsWith(`${key}_`));

    // Handle special filter types
    if (filterType === 'daterange') {
      // Date ranges need to be split into startDate and endDate
      if (value?.start && value?.end) {
        newFilters.push({ id: `${key}_start`, value: value.start });
        newFilters.push({ id: `${key}_end`, value: value.end });
      }
    } else if (filterType === 'numberrange') {
      // Number ranges need to be split into min/max
      if (value?.min !== undefined && value?.min !== '') {
        newFilters.push({ id: `${key}_min`, value: String(value.min) });
      }
      if (value?.max !== undefined && value?.max !== '') {
        newFilters.push({ id: `${key}_max`, value: String(value.max) });
      }
    } else if (filterType === 'multiselect') {
      // Multi-select needs to be stored as JSON array
      if (Array.isArray(value) && value.length > 0) {
        newFilters.push({ id: key, value: JSON.stringify(value) });
      }
    } else {
      // Add filter if value is not empty
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        newFilters.push({ id: key, value: String(value) });
      }
    }

    onColumnFiltersChange(newFilters);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    onColumnFiltersChange([]);
    setSearchInput('');
    onSearchChange('');
    setIsFilterOpen(false);
  };

  // Filter definitions with permission check
  const visibleFilters = React.useMemo(() => {
    return filterDefinitions.filter((filter) => {
      if (filter.permission && !can(filter.permission as any)) {
        return false;
      }
      return true;
    });
  }, [filterDefinitions, can]);

  const hasSearch = true; // Always show search
  const hasFilters = visibleFilters.length > 0;

  if (!hasSearch && !hasFilters) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      {/* Search Input */}
      {hasSearch && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || `Search ${entityType}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => {
                setSearchInput('');
                onSearchChange('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Select All Button */}
      {onSelectAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={isSelectingAll}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          {isSelectingAll ? 'Selecting...' : totalCount ? `Select All (${totalCount})` : 'Select All'}
        </Button>
      )}

      {/* Export Button */}
      {enableExport && onExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      )}

      {/* Import Button */}
      {enableImport && (
        <>
          {isAdmin ? (
            <>
              {onImport ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onImport}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              ) : importRequiredFields.length > 0 ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportWizardOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <ImportWizard
                    open={importWizardOpen}
                    onOpenChange={setImportWizardOpen}
                    entityType={entityType}
                    requiredFields={importRequiredFields}
                    onComplete={() => {
                      // Optionally trigger a refetch or refresh
                      if (importHandler) {
                        importHandler();
                      }
                    }}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}

      {/* Filters */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Advanced Filters Popover */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] overflow-y-auto" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Advanced Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {visibleFilters.map((filter) => {
                    let currentValue: any = filterValues[filter.key] || filter.defaultValue || '';

                    // Handle date range values
                    if (filter.type === 'daterange') {
                      currentValue = {
                        start: filterValues[`${filter.key}_start`] || '',
                        end: filterValues[`${filter.key}_end`] || '',
                      };
                    }

                    // Handle number range values
                    if (filter.type === 'numberrange') {
                      currentValue = {
                        min: filterValues[`${filter.key}_min`] || '',
                        max: filterValues[`${filter.key}_max`] || '',
                      };
                    }

                    return (
                      <div key={filter.key} className="space-y-2">
                        <Label htmlFor={filter.key} className="text-xs font-medium">
                          {filter.label}
                        </Label>
                        {filter.type === 'text' && (
                          <Input
                            id={filter.key}
                            value={currentValue || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value, filter.type)}
                            placeholder={`Filter by ${filter.label.toLowerCase()}`}
                            className="h-8"
                          />
                        )}
                        {filter.type === 'searchable-select' && filter.entityType && filter.filterKey && (
                          <FilterSearchableSelect
                            value={currentValue || ''}
                            onValueChange={(value) => handleFilterChange(filter.key, value || '', filter.type)}
                            entityType={filter.entityType}
                            filterKey={filter.filterKey}
                            placeholder={`Select ${filter.label.toLowerCase()}`}
                            className="h-8"
                          />
                        )}
                        {filter.type === 'select' && filter.options && (
                          <Select
                            value={currentValue || 'all'}
                            onValueChange={(value) => {
                              handleFilterChange(filter.key, value === 'all' ? '' : value, filter.type);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All {filter.label}</SelectItem>
                              {filter.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {filter.type === 'multiselect' && filter.options && (
                          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                            {filter.options.map((option) => {
                              const selected = Array.isArray(currentValue) ? currentValue.includes(option.value) : false;
                              return (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${filter.key}-${option.value}`}
                                    checked={selected}
                                    onCheckedChange={(checked) => {
                                      const current = Array.isArray(currentValue) ? currentValue : [];
                                      const updated = checked
                                        ? [...current, option.value]
                                        : current.filter((v: string) => v !== option.value);
                                      handleFilterChange(filter.key, updated, filter.type);
                                    }}
                                  />
                                  <Label
                                    htmlFor={`${filter.key}-${option.value}`}
                                    className="text-xs font-normal cursor-pointer flex-1"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {filter.type === 'number' && (
                          <Input
                            id={filter.key}
                            type="number"
                            value={currentValue || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value ? parseFloat(e.target.value) : '', filter.type)}
                            placeholder={`Filter by ${filter.label.toLowerCase()}`}
                            className="h-8"
                          />
                        )}
                        {filter.type === 'numberrange' && (
                          <div className="flex gap-2">
                            <Input
                              id={`${filter.key}_min`}
                              type="number"
                              value={currentValue?.min || ''}
                              onChange={(e) => handleFilterChange(filter.key, { ...currentValue, min: e.target.value ? parseFloat(e.target.value) : '' }, filter.type)}
                              placeholder="Min"
                              className="h-8 flex-1"
                            />
                            <Input
                              id={`${filter.key}_max`}
                              type="number"
                              value={currentValue?.max || ''}
                              onChange={(e) => handleFilterChange(filter.key, { ...currentValue, max: e.target.value ? parseFloat(e.target.value) : '' }, filter.type)}
                              placeholder="Max"
                              className="h-8 flex-1"
                            />
                          </div>
                        )}
                        {filter.type === 'date' && (
                          <Input
                            id={filter.key}
                            type="date"
                            value={currentValue || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value, filter.type)}
                            className="h-8"
                          />
                        )}
                        {filter.type === 'daterange' && (
                          <div className="flex gap-2">
                            <Input
                              id={`${filter.key}_start`}
                              type="date"
                              value={currentValue?.start || ''}
                              onChange={(e) => handleFilterChange(filter.key, { ...currentValue, start: e.target.value }, filter.type)}
                              placeholder="Start Date"
                              className="h-8 flex-1"
                            />
                            <Input
                              id={`${filter.key}_end`}
                              type="date"
                              value={currentValue?.end || ''}
                              onChange={(e) => handleFilterChange(filter.key, { ...currentValue, end: e.target.value }, filter.type)}
                              placeholder="End Date"
                              className="h-8 flex-1"
                            />
                          </div>
                        )}
                        {filter.type === 'boolean' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={filter.key}
                              checked={currentValue === 'true' || currentValue === true || currentValue === 'True'}
                              onCheckedChange={(checked) => {
                                handleFilterChange(filter.key, checked ? 'true' : '', filter.type);
                              }}
                            />
                            <Label
                              htmlFor={filter.key}
                              className="text-xs font-normal cursor-pointer"
                            >
                              {filter.helpText || 'Enable filter'}
                            </Label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Saved Filters */}
          <SavedFilters
            entityType={entityType}
            currentFilters={{
              search: searchInput,
              ...filterValues,
            }}
            onApplyFilter={(filters) => {
              const { search, ...rest } = filters;

              // Update search
              if (search !== undefined) {
                setSearchInput(search || '');
                onSearchChange(search || '');
              }

              // Update column filters
              const newFilters: ColumnFiltersState = [];
              Object.entries(rest).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                  if (Array.isArray(value)) {
                    newFilters.push({ id: key, value: JSON.stringify(value) });
                  } else if (typeof value === 'object') {
                    // Handle date/number ranges
                    Object.entries(value).forEach(([subKey, subValue]) => {
                      if (subValue) {
                        newFilters.push({ id: `${key}_${subKey}`, value: String(subValue) });
                      }
                    });
                  } else {
                    newFilters.push({ id: key, value: String(value) });
                  }
                }
              });
              onColumnFiltersChange(newFilters);

              setIsFilterOpen(false);
            }}
          />
        </div>
      )}

      {/* Custom Toolbar Actions */}
      {toolbarActions && (
        <div className="flex items-center gap-2">
          {toolbarActions}
        </div>
      )}
    </div>
  );
}
