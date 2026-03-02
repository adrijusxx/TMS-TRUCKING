'use client';

import * as React from 'react';
import { type Table as TanStackTable } from '@tanstack/react-table';
import { TableCell, TableFooter, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ExtendedColumnDef } from './types';

type TableData = Record<string, any>;

interface DataTableFooterProps<TData extends TableData> {
  table: TanStackTable<TData>;
  hasActions: boolean;
  isCompact?: boolean;
  serverAggregates?: Record<string, number>;
  enableColumnPinning?: boolean;
}

function computeAggregate(
  type: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'custom',
  values: number[],
  customFn?: (values: number[]) => number,
): number {
  if (values.length === 0) return 0;
  switch (type) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count': return values.length;
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
    case 'custom': return customFn ? customFn(values) : 0;
  }
}

function defaultFormatter(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * Footer aggregation row for DataTable.
 * Computes sum/avg/count/min/max over visible filtered rows.
 */
export function DataTableFooter<TData extends TableData>({
  table,
  hasActions,
  isCompact,
  serverAggregates,
}: DataTableFooterProps<TData>) {
  const visibleColumns = table.getVisibleFlatColumns();
  const rows = table.getFilteredRowModel().rows;

  // Check if any column has aggregation defined
  const hasAggregation = visibleColumns.some(
    (col) => (col.columnDef as ExtendedColumnDef<TData>).aggregation
  );

  if (!hasAggregation) return null;

  return (
    <TableFooter>
      <TableRow className={cn('bg-muted/50 font-medium border-t-2', isCompact && 'h-7')}>
        {visibleColumns.map((column) => {
          const colDef = column.columnDef as ExtendedColumnDef<TData>;
          const agg = colDef.aggregation;

          if (!agg) {
            return (
              <TableCell key={column.id} className={cn(isCompact && 'py-0 px-2 text-[10px]')}>
                {/* First column shows "Totals" label */}
                {column.id === visibleColumns[0]?.id ? (
                  <span className="text-xs font-semibold text-muted-foreground">Totals</span>
                ) : null}
              </TableCell>
            );
          }

          // Use server aggregates if available
          const columnKey = colDef.id || colDef.accessorKey || column.id;
          if (serverAggregates && columnKey in serverAggregates) {
            const formatter = agg.formatter || defaultFormatter;
            return (
              <TableCell key={column.id} className={cn('text-xs font-semibold', isCompact && 'py-0 px-2 text-[10px]')}>
                {agg.label && <span className="text-muted-foreground mr-1">{agg.label}</span>}
                {formatter(serverAggregates[columnKey])}
              </TableCell>
            );
          }

          // Compute from client-side data
          const values: number[] = [];
          for (const row of rows) {
            const accessorKey = colDef.accessorKey;
            let val: any;
            if (accessorKey && typeof accessorKey === 'string') {
              if (accessorKey.includes('.')) {
                val = accessorKey.split('.').reduce((obj: any, k) => obj?.[k], row.original);
              } else {
                val = (row.original as any)[accessorKey];
              }
            }
            const num = typeof val === 'number' ? val : parseFloat(val);
            if (!isNaN(num)) values.push(num);
          }

          const result = computeAggregate(agg.type, values, agg.fn);
          const formatter = agg.formatter || defaultFormatter;

          return (
            <TableCell key={column.id} className={cn('text-xs font-semibold', isCompact && 'py-0 px-2 text-[10px]')}>
              {agg.label && <span className="text-muted-foreground mr-1">{agg.label}</span>}
              {formatter(result)}
            </TableCell>
          );
        })}
        {hasActions && <TableCell />}
      </TableRow>
    </TableFooter>
  );
}
