'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableBulkActions } from '@/components/ui/data-table-bulk-actions';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  initialSorting?: SortingState;
  initialPagination?: PaginationState;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  emptyMessage?: string;
  getRowId?: (row: TData) => string;
  filterKey?: string;
  /**
   * Import handler
   */
  onImport?: () => void;
  /**
   * Export handler - exports all filtered data
   */
  onExport?: () => void;
  /**
   * Delete handler for bulk actions
   */
  onDelete?: (selectedIds: string[]) => void;
  /**
   * Export handler for selected rows only
   */
  onExportSelected?: (selectedIds: string[]) => void;
}

/**
 * Standardized DataTable component built on TanStack Table
 * Provides sorting, pagination, row selection, column visibility, and filtering
 */
export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  initialSorting = [],
  initialPagination,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  emptyMessage = 'No data available',
  getRowId,
  filterKey,
  onImport,
  onExport,
  onDelete,
  onExportSelected,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [pagination, setPagination] = React.useState<PaginationState>(
    initialPagination ?? {
      pageIndex: 0,
      pageSize,
    }
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getRowId,
    enableRowSelection: true,
    enableColumnFilters: !!filterKey,
    globalFilterFn: filterKey
      ? (row, columnId, filterValue) => {
          const value = row.getValue(filterKey);
          if (typeof value === 'string') {
            return value.toLowerCase().includes(String(filterValue).toLowerCase());
          }
          if (typeof value === 'number') {
            return String(value).includes(String(filterValue));
          }
          return false;
        }
      : undefined,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
      globalFilter,
    },
  });

  // Get selected row IDs for bulk actions
  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  const handleClearSelection = () => {
    setRowSelection({});
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. The Toolbar (Search, Filter, Columns, Import, Export) */}
      <DataTableToolbar
        table={table}
        filterKey={filterKey}
        onImport={onImport}
        onExport={onExport}
      />

      {/* 2. The Table Grid */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted/50'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="text-muted-foreground">
                            {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. Pagination & Bulk Actions */}
      <div className="relative">
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
        {/* Floating Bulk Actions Bar - Only shows when rows selected */}
        <DataTableBulkActions
          selectedCount={selectedRowIds.length}
          selectedIds={selectedRowIds}
          onDelete={onDelete}
          onExport={onExportSelected}
          onClearSelection={handleClearSelection}
        />
      </div>
    </div>
  );
}

