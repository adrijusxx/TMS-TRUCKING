'use client';

import * as React from 'react';
import { DataTable } from './DataTable';
import { ColumnVisibilityManager } from './ColumnVisibilityManager';
import { TableToolbar } from './TableToolbar';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportModal } from '@/components/ui/import-modal';
import { useSearchParams } from 'next/navigation';
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';
import { useColumnPreferences } from './hooks/useColumnPreferences';
import { useTableData } from './hooks/useTableData';

import type {
  ExtendedColumnDef,
  EntityTableConfig,
} from './types';
import type { RowSelectionState, SortingState, ColumnFiltersState } from '@tanstack/react-table';

// Stable reference to avoid infinite React Query refetch loops
const EMPTY_QUERY_PARAMS = {};

interface DataTableWrapperProps<TData extends Record<string, any>> {
  config: EntityTableConfig<TData>;
  fetchData: (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    [key: string]: any;
  }) => Promise<{
    data: TData[];
    meta?: {
      totalCount?: number;
      totalPages?: number;
      page?: number;
      pageSize?: number;
    };
  }>;
  queryParams?: Record<string, any>;
  rowActions?: (row: TData) => React.ReactNode;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  initialSorting?: SortingState;
  initialFilters?: ColumnFiltersState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  inlineEditComponent?: React.ComponentType<{
    row: TData;
    onSave: () => void;
    onCancel: () => void;
  }>;
  getRowClassName?: (row: TData) => string;
  onDeleteSelected?: (selectedIds: string[]) => void;
  onExportSelected?: (selectedIds: string[]) => void;
  enableInlineFilters?: boolean;
  enableColumnReorder?: boolean;
  toolbarActions?: React.ReactNode;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
}

/**
 * DataTableWrapper component.
 * Combines DataTable with data fetching, column visibility, and state management.
 */
export function DataTableWrapper<TData extends Record<string, any>>({
  config,
  fetchData,
  queryParams = EMPTY_QUERY_PARAMS,
  rowActions,
  onRowClick,
  emptyMessage,
  enableColumnVisibility = true,
  enableRowSelection = true,
  initialSorting,
  initialFilters,
  onRowSelectionChange,
  enableSearch = true,
  searchPlaceholder,
  inlineEditComponent,
  getRowClassName,
  onDeleteSelected,
  onExportSelected,
  enableInlineFilters,
  enableColumnReorder = false,
  toolbarActions,
  onFiltersChange,
}: DataTableWrapperProps<TData>) {
  const { can, isLoading: permissionsLoading } = usePermissions();
  const isAdmin = useIsAdmin();
  const searchParams = useSearchParams();
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting || config.defaultSort || []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters || []);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: config.defaultPageSize || 20,
  });
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);

  // Filter columns based on permissions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visibleColumns = React.useMemo(() => {
    return config.columns.filter((column) => {
      if (column.permission && !can(column.permission as any)) return false;
      return true;
    });
  }, [config.columns, permissionsLoading]);

  // Column preferences (visibility + order)
  const {
    columnVisibility,
    columnOrder,
    defaultVisibility,
    handleColumnVisibilityChange,
    handleColumnOrderChange,
  } = useColumnPreferences({
    entityType: config.entityType,
    columns: visibleColumns,
    defaultVisibleColumns: config.defaultVisibleColumns,
    enableColumnVisibility,
    enableColumnReorder,
  });

  // Apply column visibility to columns
  const filteredColumns = React.useMemo(() => {
    return visibleColumns.filter((column) => {
      const columnId = column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '');
      return columnVisibility[columnId] !== false;
    });
  }, [visibleColumns, columnVisibility]);

  // Data fetching, search, select-all, export
  const {
    data,
    isLoading,
    error,
    refetch,
    searchFilter,
    isSelectingAll,
    handleSearchChange,
    handleSelectAll,
    handleExport,
  } = useTableData({
    entityType: config.entityType,
    fetchData,
    queryParams,
    pagination,
    sorting,
    columnFilters,
    isAdmin,
    includeDeleted,
    enableRowSelection,
    filteredColumns,
    columnVisibility,
  });

  // Use ref to avoid dependency issues
  const onRowSelectionChangeRef = React.useRef(onRowSelectionChange);
  React.useEffect(() => { onRowSelectionChangeRef.current = onRowSelectionChange; }, [onRowSelectionChange]);

  const handleRowSelectionChange = React.useCallback((selection: RowSelectionState) => {
    setRowSelection(selection);
    onRowSelectionChangeRef.current?.(selection);
  }, []);

  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters]);

  // Notify parent of filter changes
  React.useEffect(() => {
    onFiltersChange?.(columnFilters);
  }, [columnFilters, onFiltersChange]);

  // Search change handler wraps setColumnFilters
  const onSearchChange = React.useCallback((value: string) => {
    setColumnFilters((prev) => {
      const withoutSearch = prev.filter((f) => f.id !== 'search');
      if (value) return [...withoutSearch, { id: 'search', value }];
      return withoutSearch;
    });
  }, []);

  // Import handlers
  const handleImport = React.useCallback(() => setIsImportModalOpen(true), []);
  const handleImportComplete = React.useCallback(
    (_mappedData: Array<Record<string, any>>, _columnMapping: Record<string, string>) => {
      toast.info('Import functionality will be connected to backend logic later');
      refetch();
    },
    [refetch]
  );

  const databaseFields = React.useMemo(() => {
    return visibleColumns.map((col) => ({
      key: col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : ''),
      label: typeof col.header === 'string'
        ? col.header
        : (col.header as any)?.toString?.() || col.id || String(col.accessorKey || ''),
      required: (col as ExtendedColumnDef<TData>).required || false,
    }));
  }, [visibleColumns]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      {enableSearch && (
        <TableToolbar
          searchValue={searchFilter}
          onSearchChange={onSearchChange}
          columnFilters={columnFilters.filter((f) => f.id !== 'search')}
          onColumnFiltersChange={setColumnFilters}
          filterDefinitions={config.filterDefinitions}
          entityType={config.entityType}
          searchPlaceholder={searchPlaceholder}
          onSelectAll={enableRowSelection ? () => handleSelectAll(setRowSelection, onRowSelectionChangeRef.current) : undefined}
          isSelectingAll={isSelectingAll}
          totalCount={data?.meta?.totalCount}
          enableExport={config.enableExport !== false}
          onExport={config.enableExport !== false ? handleExport : undefined}
          enableImport={config.enableImport === true}
          onImport={config.enableImport === true ? handleImport : undefined}
          toolbarActions={
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0", isCompact && "text-primary")}
                onClick={() => setIsCompact(!isCompact)}
                title={isCompact ? "Disable Compact View" : "Enable Compact View"}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", isCompact && "rotate-180")} />
              </Button>
              {toolbarActions}
            </>
          }
        />
      )}

      {/* Column Visibility Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <ColumnVisibilityManager
              columns={visibleColumns}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              entityType={config.entityType}
              savePreferences={true}
              defaultVisibility={defaultVisibility}
            />
          )}
          {isAdmin && <ShowDeletedToggle className="ml-2" />}
        </div>
        {selectedRowIds.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRowIds.length} row{selectedRowIds.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={filteredColumns}
        data={data?.data || []}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        pagination={
          data?.meta
            ? {
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
              totalCount: data.meta.totalCount,
              totalPages: data.meta.totalPages,
            }
            : undefined
        }
        onPaginationChange={setPagination}
        enableRowSelection={enableRowSelection}
        rowActions={rowActions}
        onRowClick={onRowClick}
        emptyMessage={emptyMessage || 'No data available'}
        inlineEditComponent={inlineEditComponent}
        onInlineEditSave={() => refetch()}
        getRowClassName={getRowClassName}
        entityType={config.entityType}
        onColumnFilterChange={() => refetch()}
        onDeleteSelected={onDeleteSelected}
        onExportSelected={onExportSelected}
        enableInlineFilters={enableInlineFilters}
        columnOrder={columnOrder}
        onColumnOrderChange={handleColumnOrderChange}
        enableColumnReorder={enableColumnReorder}
        savePreferences={false}
        isCompact={isCompact}
      />

      {/* Import Modal */}
      {config.enableImport && (
        <ImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          databaseFields={databaseFields}
          onImport={handleImportComplete}
          entityType={config.entityType}
        />
      )}
    </div>
  );
}
