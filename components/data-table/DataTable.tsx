'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnPinningState,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DataTableProps, ExtendedColumnDef } from './types';
import { DataTableBulkActions } from '@/components/ui/data-table-bulk-actions';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { InlineFilterRow } from './InlineFilterRow';
import { DraggableTableHeader } from './DraggableTableHeader';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { DataTablePagination } from './DataTablePagination';
import { DataTableBody } from './DataTableBody';
import { DataTableFooter } from './DataTableFooter';
import { TableHeaderCell } from './TableHeaderCell';
import { useDataTableState } from './hooks/useDataTableState';
import { useTableKeyboard } from './hooks/useTableKeyboard';

/**
 * Core DataTable component built on TanStack Table.
 * Provides sorting, filtering, pagination, row selection, column visibility,
 * column pinning, column resizing, footer aggregation, and keyboard navigation.
 */
export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error = null,
  onRetry,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  pagination: controlledPagination,
  onPaginationChange,
  enableRowSelection = true,
  rowActions,
  onRowClick,
  emptyMessage = 'No data available',
  showLoadingSkeleton = true,
  inlineEditComponent: InlineEditComponent,
  onInlineEditSave,
  getRowClassName,
  entityType,
  onColumnFilterChange,
  onDeleteSelected,
  onExportSelected,
  filterKey,
  onImport,
  onExport,
  enableInlineFilters = false,
  columnOrder: controlledColumnOrder,
  onColumnOrderChange,
  enableColumnReorder = false,
  savePreferences = true,
  isCompact = false,
  searchPlaceholder,
  enableColumnPinning = false,
  enableColumnResizing = false,
  enableFooterAggregation = false,
  serverAggregates,
  enableVirtualization = false,
}: DataTableProps<TData>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = React.useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) newSet.delete(rowId);
      else newSet.add(rowId);
      return newSet;
    });
  }, []);

  // Delegated state management
  const {
    rowSelection, handleRowSelectionChange, setRowSelectionStable,
    sorting, setSorting,
    columnFilters, setColumnFilters,
    columnVisibility, setColumnVisibility,
    columnOrder, setColumnOrder,
    pagination, setPagination,
    globalFilter, setGlobalFilter,
  } = useDataTableState({
    rowSelection: controlledRowSelection, onRowSelectionChange,
    sorting: controlledSorting, onSortingChange,
    columnFilters: controlledColumnFilters, onColumnFiltersChange,
    columnVisibility: controlledColumnVisibility, onColumnVisibilityChange,
    pagination: controlledPagination, onPaginationChange,
    columnOrder: controlledColumnOrder, onColumnOrderChange,
  });

  // Column pinning state (derived from column definitions)
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(() => {
    if (!enableColumnPinning) return { left: [], right: [] };
    const left: string[] = [];
    const right: string[] = [];
    (columns as ExtendedColumnDef<TData>[]).forEach((col) => {
      if (col.pinned === 'left') left.push(col.id);
      if (col.pinned === 'right') right.push(col.id);
    });
    return { left, right };
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumnOrder((currentOrder: string[]) => {
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
    }
  }, [setColumnOrder]);

  // Add selection column if enabled
  const tableColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    if (!enableRowSelection) return columns as ColumnDef<TData>[];
    const selectionColumn: ColumnDef<TData> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="h-3.5 w-3.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="h-3.5 w-3.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 32,
    };
    return [selectionColumn, ...(columns as ColumnDef<TData>[])];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id || row.original?.id || String(row.index),
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: enableColumnResizing ? 'onChange' : undefined,
    enableGlobalFilter: !!filterKey,
    globalFilterFn: filterKey
      ? (row, _columnId, filterValue) => {
          const rowData = row.original as any;
          const searchValue = String(filterValue).toLowerCase();
          const filterKeys = filterKey.split(',').map(k => k.trim());
          return filterKeys.some(key => {
            let value: any;
            if (typeof key === 'string' && key.includes('.')) {
              value = key.split('.').reduce((obj: any, k) => obj?.[k], rowData);
            } else {
              value = rowData[key];
            }
            if (value !== undefined && value !== null) {
              if (typeof value === 'string') return value.toLowerCase().includes(searchValue);
              if (typeof value === 'number') return String(value).includes(searchValue);
            }
            return false;
          });
        }
      : undefined,
    state: {
      rowSelection, sorting, columnFilters, columnVisibility, pagination, globalFilter, columnOrder,
      ...(enableColumnPinning && { columnPinning }),
    },
    ...(enableColumnPinning && { onColumnPinningChange: setColumnPinning }),
    manualPagination: !!controlledPagination,
    manualSorting: !!controlledSorting,
    manualFiltering: !!controlledColumnFilters,
    pageCount: controlledPagination?.totalPages,
  });

  // Keyboard navigation
  const { containerRef, handleKeyDown, focusedCell } = useTableKeyboard({
    table, onRowClick, enableRowSelection,
  });

  // Clear selection when data is empty
  React.useEffect(() => {
    if (data.length === 0 && Object.keys(rowSelection).length > 0) {
      setRowSelectionStable({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  const selectedRowIds = React.useMemo(() => {
    if (!enableRowSelection) return [];
    return table.getFilteredSelectedRowModel().rows.map((row) => row.id);
  }, [table, enableRowSelection, rowSelection]);

  const handleClearSelection = React.useCallback(() => {
    table.resetRowSelection();
  }, [table]);

  const hasActions = !!(rowActions || InlineEditComponent);

  // Compute pin styles for sticky columns
  const getPinStyle = React.useCallback((columnId: string, isHeader = false): React.CSSProperties => {
    if (!enableColumnPinning) return {};
    const column = table.getColumn(columnId);
    if (!column) return {};
    const pinned = column.getIsPinned();
    if (!pinned) return {};

    const offset = pinned === 'left'
      ? column.getStart('left')
      : column.getAfter('right');

    return {
      position: 'sticky',
      [pinned]: offset,
      zIndex: isHeader ? 11 : 10,
      backgroundColor: 'inherit',
    };
  }, [enableColumnPinning, table]);

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-xl bg-destructive/10 p-3 mb-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Error loading data</p>
        <p className="text-xs text-muted-foreground mb-3 max-w-sm text-center">{error.message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isLoading && showLoadingSkeleton) {
    return <DataTableSkeleton columns={Math.min(tableColumns.length, 6)} rows={8} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      id={`dnd-context-${entityType || 'table'}`}
    >
      <div
        className="space-y-2"
        ref={containerRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label={entityType ? `${entityType} data table` : 'Data table'}
      >
        {(filterKey || onImport || onExport) && (
          <DataTableToolbar
            table={table}
            filterKey={filterKey}
            onImport={onImport}
            onExport={onExport}
            entityType={entityType}
            onColumnOrderChange={setColumnOrder}
            savePreferences={savePreferences}
            searchPlaceholder={searchPlaceholder}
          />
        )}

        <DataTableBulkActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          selectedIds={selectedRowIds}
          onDelete={onDeleteSelected}
          onExport={onExportSelected}
          onClearSelection={handleClearSelection}
        />

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table style={enableColumnResizing ? { width: table.getCenterTotalSize() } : undefined}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className={cn(isCompact && 'h-7')}>
                    {enableColumnReorder ? (
                      <DraggableTableHeader
                        headers={headerGroup.headers}
                        enableInlineFilters={enableInlineFilters}
                        entityType={entityType}
                        columnFilters={columnFilters}
                        onColumnFilterChange={onColumnFilterChange}
                        setColumnFilters={setColumnFilters}
                        isCompact={isCompact}
                      />
                    ) : (
                      headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            'relative group',
                            isCompact ? 'py-0 px-2 h-7 text-[10px]' : 'h-10',
                            (header.column.columnDef as ExtendedColumnDef<TData>).className
                          )}
                          style={{
                            ...getPinStyle(header.column.id, true),
                            ...(enableColumnResizing ? { width: header.getSize() } : {}),
                          }}
                          aria-sort={
                            header.column.getIsSorted() === 'asc' ? 'ascending' :
                            header.column.getIsSorted() === 'desc' ? 'descending' :
                            header.column.getCanSort() ? 'none' : undefined
                          }
                        >
                          <TableHeaderCell
                            header={header}
                            isCompact={isCompact}
                            enableInlineFilters={enableInlineFilters}
                            entityType={entityType}
                            columnFilters={columnFilters}
                            onColumnFilterChange={onColumnFilterChange}
                            setColumnFilters={setColumnFilters}
                          />
                          {/* Column resize handle */}
                          {enableColumnResizing && header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                                'hover:bg-primary/50 active:bg-primary',
                                header.column.getIsResizing() && 'bg-primary'
                              )}
                            />
                          )}
                        </TableHead>
                      ))
                    )}
                    {hasActions && <TableHead className="w-[70px] text-right">Actions</TableHead>}
                  </TableRow>
                ))}
                {enableInlineFilters && (
                  <InlineFilterRow table={table} entityType={entityType} hasRowActions={hasActions} />
                )}
              </TableHeader>
              <DataTableBody
                table={table}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                inlineEditComponent={InlineEditComponent}
                onInlineEditSave={onInlineEditSave}
                rowActions={rowActions}
                onRowClick={onRowClick}
                getRowClassName={getRowClassName}
                isCompact={isCompact}
                isLoading={isLoading}
                emptyMessage={emptyMessage}
                totalColumns={tableColumns.length}
                focusedCell={focusedCell}
                enableColumnPinning={enableColumnPinning}
                getPinStyle={getPinStyle}
                enableColumnResizing={enableColumnResizing}
                enableVirtualization={enableVirtualization}
              />
              {enableFooterAggregation && (
                <DataTableFooter
                  table={table}
                  hasActions={hasActions}
                  isCompact={isCompact}
                  serverAggregates={serverAggregates}
                  enableColumnPinning={enableColumnPinning}
                />
              )}
            </Table>
          </div>
        </div>

        {(!controlledPagination || controlledPagination.totalCount !== undefined) && (
          <DataTablePagination
            table={table}
            totalCount={controlledPagination?.totalCount}
            dataLength={data.length}
          />
        )}
      </div>
    </DndContext>
  );
}
