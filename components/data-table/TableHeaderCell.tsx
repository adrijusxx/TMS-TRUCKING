'use client';

import * as React from 'react';
import { flexRender, type Header, type ColumnFiltersState } from '@tanstack/react-table';
import { TableHead } from '@/components/ui/table';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ColumnFilter } from './ColumnFilter';
import type { ExtendedColumnDef } from './types';

type TableData = Record<string, any>;

interface TableHeaderCellProps<TData extends TableData> {
  header: Header<TData, unknown>;
  isCompact?: boolean;
  enableInlineFilters?: boolean;
  entityType?: string;
  columnFilters?: ColumnFiltersState;
  onColumnFilterChange?: (columnId: string, values: string[]) => void;
  setColumnFilters?: (filters: ColumnFiltersState) => void;
}

/**
 * Parses the current filter value for a column from the ColumnFiltersState.
 */
function getFilterValue(columnFilters: ColumnFiltersState, filterKey: string): string[] {
  return columnFilters
    .filter((f) => f.id === filterKey)
    .map((f) => {
      try {
        const strVal = String(f.value);
        const parsed = JSON.parse(strVal);
        return Array.isArray(parsed) ? parsed : [strVal];
      } catch {
        return [String(f.value)];
      }
    })
    .flat();
}

/**
 * Shared header cell rendering used by both static and draggable table headers.
 * Renders sorting indicators, tooltips, and column filter popups.
 */
export function TableHeaderCell<TData extends TableData>({
  header,
  isCompact,
  enableInlineFilters,
  entityType,
  columnFilters,
  onColumnFilterChange,
  setColumnFilters,
}: TableHeaderCellProps<TData>) {
  const canSort = header.column.getCanSort();
  const isSorted = header.column.getIsSorted();
  const colDef = header.column.columnDef as ExtendedColumnDef<TData>;

  if (header.isPlaceholder) return null;

  return (
    <div className="flex items-center justify-between w-full">
      <div
        className={cn(
          'flex items-center gap-1 flex-1',
          canSort && 'cursor-pointer select-none hover:text-foreground'
        )}
        onClick={header.column.getToggleSortingHandler()}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {canSort && (
          <span className="text-muted-foreground">
            {isSorted === 'asc' ? '↑' : isSorted === 'desc' ? '↓' : '⇅'}
          </span>
        )}
        {colDef.tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {colDef.tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {/* Classic column filter popup - only show if inline filters disabled */}
      {!enableInlineFilters && colDef.enableColumnFilter && entityType && onColumnFilterChange && columnFilters && setColumnFilters && (
        <div className="ml-2" onClick={(e) => e.stopPropagation()}>
          <ColumnFilter
            columnId={header.column.id}
            filterKey={colDef.filterKey || header.column.id}
            entityType={entityType}
            value={getFilterValue(columnFilters, colDef.filterKey || header.column.id)}
            onChange={(values) => {
              const fKey = colDef.filterKey || header.column.id;
              const newFilters = columnFilters.filter((f) => f.id !== fKey);
              if (values.length > 0) {
                newFilters.push({ id: fKey, value: JSON.stringify(values) });
              }
              setColumnFilters(newFilters);
              onColumnFilterChange(header.column.id, values);
            }}
            onClear={() => {
              const fKey = colDef.filterKey || header.column.id;
              const newFilters = columnFilters.filter((f) => f.id !== fKey);
              setColumnFilters(newFilters);
              onColumnFilterChange(header.column.id, []);
            }}
          />
        </div>
      )}
    </div>
  );
}

export type { TableHeaderCellProps };
