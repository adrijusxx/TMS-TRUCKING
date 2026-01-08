'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
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
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataTableProps, ExtendedColumnDef } from './types';
import { ColumnFilter } from './ColumnFilter';
import { DataTableBulkActions } from '@/components/ui/data-table-bulk-actions';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { InlineFilterRow } from './InlineFilterRow';
import { DraggableTableHeader } from './DraggableTableHeader';

/**
 * Core DataTable component built on TanStack Table
 * Provides sorting, filtering, pagination, row selection, and column visibility
 */
export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  error = null,
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
}: DataTableProps<TData>) {
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = React.useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [globalFilter, setGlobalFilter] = React.useState('');

  const [internalColumnOrder, setInternalColumnOrder] = React.useState<string[]>([]);

  // Use controlled or internal state
  const rowSelection = controlledRowSelection ?? internalRowSelection;

  // Use refs to avoid dependency issues
  const onRowSelectionChangeRef = React.useRef(onRowSelectionChange);
  React.useEffect(() => {
    onRowSelectionChangeRef.current = onRowSelectionChange;
  }, [onRowSelectionChange]);

  const rowSelectionRef = React.useRef(rowSelection);
  React.useEffect(() => {
    rowSelectionRef.current = rowSelection;
  }, [rowSelection]);

  const handleRowSelectionChangeInternal = React.useCallback((updater: any) => {
    const currentSelection = rowSelectionRef.current;
    const newSelection = typeof updater === 'function' ? updater(currentSelection) : updater;
    console.log('DataTable handleRowSelectionChangeInternal:', { updater, newSelection, selectedCount: Object.keys(newSelection).filter(k => newSelection[k]).length });
    if (onRowSelectionChangeRef.current) {
      onRowSelectionChangeRef.current(newSelection);
    } else {
      setInternalRowSelection(newSelection);
    }
  }, []); // No dependencies - use refs instead

  // Create a stable setter for useEffect
  const setRowSelectionStable = React.useCallback((selection: RowSelectionState) => {
    if (onRowSelectionChangeRef.current) {
      onRowSelectionChangeRef.current(selection);
    } else {
      setInternalRowSelection(selection);
    }
  }, []); // No dependencies - use refs instead
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = onSortingChange
    ? (updater: any) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(newSorting);
    }
    : (updater: any) => {
      const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
      setInternalSorting(newSorting);
    };
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const setColumnFilters = onColumnFiltersChange
    ? (updater: any) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      onColumnFiltersChange(newFilters);
    }
    : (updater: any) => {
      const newFilters = typeof updater === 'function' ? updater(internalColumnFilters) : updater;
      setInternalColumnFilters(newFilters);
    };
  const columnVisibility = controlledColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = onColumnVisibilityChange
    ? (updater: any) => {
      const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
      onColumnVisibilityChange(newVisibility);
    }
    : (updater: any) => {
      const newVisibility = typeof updater === 'function' ? updater(internalColumnVisibility) : updater;
      setInternalColumnVisibility(newVisibility);
    };

  const columnOrder = controlledColumnOrder ?? internalColumnOrder;
  const setColumnOrder = onColumnOrderChange
    ? (updater: string[] | ((old: string[]) => string[])) => {
      const newOrder = typeof updater === 'function' ? updater(columnOrder) : updater;
      onColumnOrderChange(newOrder);
    }
    : (updater: string[] | ((old: string[]) => string[])) => {
      const newOrder = typeof updater === 'function' ? updater(internalColumnOrder) : updater;
      setInternalColumnOrder(newOrder);
    };

  const pagination = controlledPagination
    ? {
      pageIndex: controlledPagination.pageIndex,
      pageSize: controlledPagination.pageSize,
    }
    : internalPagination;
  const setPagination = onPaginationChange
    ? (updater: any) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    }
    : setInternalPagination;

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // DnD Handle Drag End
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
    getRowId: (row) => {
      // Try to get ID from row object, then from original data, fallback to index
      const id = row.id || row.original?.id || String(row.index);
      return id;
    }, // Use actual row ID for selection
    onRowSelectionChange: handleRowSelectionChangeInternal,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection,
    enableGlobalFilter: !!filterKey,
    globalFilterFn: filterKey
      ? (row, columnId, filterValue) => {
        // Search in the row's original data, not through column definitions
        const rowData = row.original as any;
        const searchValue = String(filterValue).toLowerCase();

        // Try to get value from the specified filterKey path
        let value: any;

        // Guard against non-string filterKey
        if (typeof filterKey === 'string' && filterKey.includes('.')) {
          // Handle nested paths like 'user.lastName'
          const keys = filterKey.split('.');
          value = keys.reduce((obj: any, key) => obj?.[key], rowData);
        } else {
          // Direct property access
          value = rowData[filterKey];
        }

        // If value is found, check if it matches
        if (value !== undefined && value !== null) {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchValue);
          }
          if (typeof value === 'number') {
            return String(value).includes(searchValue);
          }
        }
        // If filterKey value not found or doesn't match, return false
        // (Don't fallback to searching all values - be specific to the filterKey)
        return false;
      }
      : undefined,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
      columnOrder,
    },
    manualPagination: !!controlledPagination,
    manualSorting: !!controlledSorting,
    manualFiltering: !!controlledColumnFilters,
    pageCount: controlledPagination?.totalPages,
  });

  // Update row selection when data changes
  React.useEffect(() => {
    if (data.length === 0 && Object.keys(rowSelection).length > 0) {
      setRowSelectionStable({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]); // Clear selection when data is empty - only clear if there's actually a selection

  // Get selected row IDs - MUST be called before any conditional returns
  const selectedRowIds = React.useMemo(() => {
    if (!enableRowSelection) return [];
    return table.getFilteredSelectedRowModel().rows.map((row) => row.id);
  }, [table, enableRowSelection, rowSelection]);

  // Clear selection handler - MUST be called before any conditional returns
  const handleClearSelection = React.useCallback(() => {
    table.resetRowSelection();
  }, [table]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-destructive text-xs mb-1">Error loading data</p>
          <p className="text-[11px] text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading && showLoadingSkeleton) {
    return (
      <div className="space-y-2">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.slice(0, 5).map((_, index) => (
                  <TableHead key={index}>
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableColumns.slice(0, 5).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-3 w-full bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      id={`dnd-context-${entityType || 'table'}`}
    >
      <div className="space-y-2">
        {/* Toolbar: Search, Filters, Columns, Import, Export */}
        {(filterKey || onImport || onExport) && (
          <DataTableToolbar
            table={table}
            filterKey={filterKey}
            onImport={onImport}
            onExport={onExport}
            entityType={entityType}
            onColumnOrderChange={setColumnOrder}
            savePreferences={savePreferences}
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
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {enableColumnReorder ? (
                      <DraggableTableHeader
                        headers={headerGroup.headers}
                      />
                    ) : (
                      headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const isSorted = header.column.getIsSorted();

                        return (
                          <TableHead
                            key={header.id}
                            className={cn(
                              'relative group',
                              header.column.getCanResize() && 'resizable',
                              (header.column.columnDef as ExtendedColumnDef<TData>).className
                            )}
                          >
                            {header.isPlaceholder ? null : (
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
                                  {/* Column tooltip/help icon */}
                                  {(header.column.columnDef as ExtendedColumnDef<TData>).tooltip && (
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                          {(header.column.columnDef as ExtendedColumnDef<TData>).tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                {/* Classic column filter popup - only show if inline filters disabled */}
                                {!enableInlineFilters && (header.column.columnDef as ExtendedColumnDef<TData>).enableColumnFilter && entityType && onColumnFilterChange && (
                                  <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                                    <ColumnFilter
                                      columnId={header.column.id}
                                      filterKey={(header.column.columnDef as ExtendedColumnDef<TData>).filterKey || header.column.id}
                                      entityType={entityType}
                                      value={
                                        columnFilters
                                          .filter((f) => f.id === ((header.column.columnDef as ExtendedColumnDef<TData>).filterKey || header.column.id))
                                          .map((f) => {
                                            try {
                                              const strVal = String(f.value);
                                              const parsed = JSON.parse(strVal);
                                              return Array.isArray(parsed) ? parsed : [strVal];
                                            } catch {
                                              return [String(f.value)];
                                            }
                                          })
                                          .flat() || []
                                      }
                                      onChange={(values) => {
                                        const filterKey = (header.column.columnDef as ExtendedColumnDef<TData>).filterKey || header.column.id;
                                        const newFilters = columnFilters.filter((f) => f.id !== filterKey);
                                        if (values.length > 0) {
                                          newFilters.push({ id: filterKey, value: JSON.stringify(values) });
                                        }
                                        setColumnFilters(newFilters);
                                        onColumnFilterChange(header.column.id, values);
                                      }}
                                      onClear={() => {
                                        const filterKey = (header.column.columnDef as ExtendedColumnDef<TData>).filterKey || header.column.id;
                                        const newFilters = columnFilters.filter((f) => f.id !== filterKey);
                                        setColumnFilters(newFilters);
                                        onColumnFilterChange(header.column.id, []);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </TableHead>
                        );
                      })
                    )}
                    {(rowActions || InlineEditComponent) && <TableHead className="w-[70px] text-right">Actions</TableHead>}
                  </TableRow>
                ))}
                {/* Inline Filter Row */}
                {enableInlineFilters && (
                  <InlineFilterRow table={table} entityType={entityType} hasRowActions={!!(rowActions || InlineEditComponent)} />
                )}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const isExpanded = expandedRows.has(row.id);
                    const hasInlineEdit = InlineEditComponent !== undefined;
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow
                          data-state={row.getIsSelected() && 'selected'}
                          className={cn(
                            row.getIsSelected() && 'bg-muted/50',
                            onRowClick && 'cursor-pointer hover:bg-muted/50',
                            // Visual distinction for soft-deleted records
                            row.original?.deletedAt && 'opacity-60 bg-muted/30',
                            // Custom row className from prop
                            getRowClassName?.(row.original)
                          )}
                          onClick={(e) => {
                            // Don't trigger row click if clicking on checkbox, button, or link
                            const target = e.target as HTMLElement;
                            if (
                              target.closest('button') ||
                              target.closest('a') ||
                              target.closest('input[type="checkbox"]') ||
                              target.closest('[role="button"]')
                            ) {
                              return;
                            }
                            onRowClick?.(row.original);
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className={(cell.column.columnDef as ExtendedColumnDef<TData>).className}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                          {(rowActions || hasInlineEdit) && (
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
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
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
                                  onSave={() => {
                                    toggleRow(row.id);
                                    onInlineEditSave?.();
                                  }}
                                  onCancel={() => toggleRow(row.id)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length + (rowActions ? 1 : 0)}
                      className="h-16 text-center"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-muted-foreground text-[11px]">Loading...</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-[11px]">{emptyMessage}</div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {!controlledPagination || controlledPagination.totalCount !== undefined ? (
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-1">
              <p className="text-[11px] text-muted-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  controlledPagination?.totalCount ?? data.length
                )}{' '}
                of {controlledPagination?.totalCount ?? data.length}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-[11px]">Page</span>
                <Input
                  type="number"
                  min={1}
                  max={table.getPageCount()}
                  value={table.getState().pagination.pageIndex + 1}
                  onChange={(e) => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    table.setPageIndex(page);
                  }}
                  className="w-12 h-6 text-[11px] px-1"
                />
                <span className="text-[11px]">of {table.getPageCount()}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-3 w-3" />
              </Button>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-6 w-[55px] text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-[11px]">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </div>
    </DndContext>
  );
}

