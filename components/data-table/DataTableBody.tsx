'use client';

import * as React from 'react';
import { flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import type { ExtendedColumnDef } from './types';

type TableData = Record<string, any>;

interface DataTableBodyProps<TData extends TableData> {
  table: TanStackTable<TData>;
  expandedRows: Set<string>;
  toggleRow: (rowId: string) => void;
  inlineEditComponent?: React.ComponentType<{
    row: TData;
    onSave: () => void;
    onCancel: () => void;
  }>;
  onInlineEditSave?: () => void;
  rowActions?: (row: TData) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
  isCompact?: boolean;
  isLoading?: boolean;
  emptyMessage: string;
  totalColumns: number;
  focusedCell?: { rowIndex: number; colIndex: number } | null;
  enableColumnPinning?: boolean;
  getPinStyle?: (columnId: string) => React.CSSProperties;
  enableColumnResizing?: boolean;
  enableVirtualization?: boolean;
}

/**
 * Renders a single table row with cells, actions, and expansion.
 */
function DataTableRow<TData extends TableData>({
  row,
  rowIndex,
  isExpanded,
  hasInlineEdit,
  InlineEditComponent,
  onInlineEditSave,
  rowActions,
  onRowClick,
  getRowClassName,
  isCompact,
  toggleRow,
  focusedCell,
  enableColumnPinning,
  getPinStyle,
  enableColumnResizing,
}: {
  row: ReturnType<TanStackTable<TData>['getRowModel']>['rows'][number];
  rowIndex: number;
  isExpanded: boolean;
  hasInlineEdit: boolean;
  InlineEditComponent?: DataTableBodyProps<TData>['inlineEditComponent'];
  onInlineEditSave?: () => void;
  rowActions?: (row: TData) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
  isCompact?: boolean;
  toggleRow: (rowId: string) => void;
  focusedCell?: { rowIndex: number; colIndex: number } | null;
  enableColumnPinning?: boolean;
  getPinStyle?: (columnId: string) => React.CSSProperties;
  enableColumnResizing?: boolean;
}) {
  const hasActions = !!(rowActions || hasInlineEdit);

  return (
    <React.Fragment>
      <TableRow
        data-state={row.getIsSelected() && 'selected'}
        data-compact={isCompact}
        className={cn(
          isCompact ? 'h-7 border-b' : 'h-10 border-b',
          row.getIsSelected() && 'bg-muted/50',
          onRowClick && 'cursor-pointer hover:bg-muted/50',
          row.original?.deletedAt && 'opacity-60 bg-muted/30',
          getRowClassName?.(row.original)
        )}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('a') ||
            target.closest('input[type="checkbox"]') ||
            target.closest('[role="button"]')
          ) return;
          onRowClick?.(row.original);
        }}
      >
        {row.getVisibleCells().map((cell, colIndex) => {
          const isFocused = focusedCell?.rowIndex === rowIndex && focusedCell?.colIndex === colIndex;
          return (
            <TableCell
              key={cell.id}
              data-row-index={rowIndex}
              data-col-index={colIndex}
              className={cn(
                (cell.column.columnDef as ExtendedColumnDef<TData>).className,
                isCompact && 'py-0 px-2 text-[10px]',
                isFocused && 'ring-2 ring-primary/50 ring-inset'
              )}
              style={{
                ...(enableColumnPinning && getPinStyle ? getPinStyle(cell.column.id) : {}),
                ...(enableColumnResizing ? { width: cell.column.getSize() } : {}),
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
        })}
        {hasActions && (
          <TableCell className="text-right w-[70px]">
            <div className="flex items-center justify-end gap-1">
              {rowActions && rowActions(row.original)}
              {hasInlineEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(row.id);
                  }}
                  type="button"
                  aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
      {hasInlineEdit && isExpanded && InlineEditComponent && (
        <TableRow>
          <TableCell
            colSpan={row.getVisibleCells().length + (rowActions ? 1 : 1)}
            className="p-0 bg-muted/30"
          >
            <div className="animate-in slide-in-from-top-1 duration-200">
              <InlineEditComponent
                row={row.original}
                onSave={() => { toggleRow(row.id); onInlineEditSave?.(); }}
                onCancel={() => toggleRow(row.id)}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

/**
 * Table body rendering for DataTable.
 * Supports optional row virtualization for large datasets.
 */
export function DataTableBody<TData extends TableData>({
  table,
  expandedRows,
  toggleRow,
  inlineEditComponent: InlineEditComponent,
  onInlineEditSave,
  rowActions,
  onRowClick,
  getRowClassName,
  isCompact,
  isLoading,
  emptyMessage,
  totalColumns,
  focusedCell,
  enableColumnPinning,
  getPinStyle,
  enableColumnResizing,
  enableVirtualization = false,
}: DataTableBodyProps<TData>) {
  const hasInlineEdit = InlineEditComponent !== undefined;
  const hasActions = !!(rowActions || hasInlineEdit);
  const rows = table.getRowModel().rows;
  const parentRef = React.useRef<HTMLTableSectionElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current?.closest('.overflow-x-auto') as HTMLElement | null,
    estimateSize: () => (isCompact ? 28 : 40),
    overscan: 10,
    enabled: enableVirtualization && rows.length > 0,
  });

  if (!rows.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={totalColumns + (hasActions ? 1 : 0)} className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-1 py-8">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground text-[11px]">Loading...</span>
              </div>
            ) : (
              <EmptyState
                title={emptyMessage}
                description="Try adjusting your filters or search criteria."
                className="py-12"
              />
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  // Non-virtualized (default) rendering
  if (!enableVirtualization) {
    return (
      <TableBody ref={parentRef}>
        {rows.map((row, rowIndex) => (
          <DataTableRow
            key={row.id}
            row={row}
            rowIndex={rowIndex}
            isExpanded={expandedRows.has(row.id)}
            hasInlineEdit={hasInlineEdit}
            InlineEditComponent={InlineEditComponent}
            onInlineEditSave={onInlineEditSave}
            rowActions={rowActions}
            onRowClick={onRowClick}
            getRowClassName={getRowClassName}
            isCompact={isCompact}
            toggleRow={toggleRow}
            focusedCell={focusedCell}
            enableColumnPinning={enableColumnPinning}
            getPinStyle={getPinStyle}
            enableColumnResizing={enableColumnResizing}
          />
        ))}
      </TableBody>
    );
  }

  // Virtualized rendering
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <TableBody ref={parentRef} style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <DataTableRow
            key={row.id}
            row={row}
            rowIndex={virtualRow.index}
            isExpanded={expandedRows.has(row.id)}
            hasInlineEdit={hasInlineEdit}
            InlineEditComponent={InlineEditComponent}
            onInlineEditSave={onInlineEditSave}
            rowActions={rowActions}
            onRowClick={onRowClick}
            getRowClassName={getRowClassName}
            isCompact={isCompact}
            toggleRow={toggleRow}
            focusedCell={focusedCell}
            enableColumnPinning={enableColumnPinning}
            getPinStyle={getPinStyle}
            enableColumnResizing={enableColumnResizing}
          />
        );
      })}
    </TableBody>
  );
}
