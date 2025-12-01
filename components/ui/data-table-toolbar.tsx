'use client';

import * as React from 'react';
import { Search, Columns, Download, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Table as TanStackTable } from '@tanstack/react-table';

interface DataTableToolbarProps<TData> {
  /**
   * TanStack Table instance
   */
  table: TanStackTable<TData>;
  /**
   * Filter key for global search (optional)
   */
  filterKey?: string;
  /**
   * Import handler
   */
  onImport?: () => void;
  /**
   * Export handler
   */
  onExport?: () => void;
}

/**
 * DataTableToolbar component
 * Provides search, column visibility, import, and export controls
 */
export function DataTableToolbar<TData>({
  table,
  filterKey,
  onImport,
  onExport,
}: DataTableToolbarProps<TData>) {
  const globalFilter = table.getState().globalFilter as string;
  const [searchValue, setSearchValue] = React.useState(globalFilter || '');

  // Sync search value with table's global filter
  React.useEffect(() => {
    const currentFilter = table.getState().globalFilter as string;
    if (currentFilter !== searchValue) {
      setSearchValue(currentFilter || '');
    }
  }, [table.getState().globalFilter]);

  // Update global filter when search value changes
  React.useEffect(() => {
    if (filterKey) {
      const timeoutId = setTimeout(() => {
        table.setGlobalFilter(searchValue);
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchValue, filterKey, table]);

  const handleClearSearch = () => {
    setSearchValue('');
    if (filterKey) {
      table.setGlobalFilter('');
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Search Input */}
      {filterKey && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Filter by ${filterKey}...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

