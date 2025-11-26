'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from './DataTable';
import { ColumnVisibilityManager } from './ColumnVisibilityManager';
import { TableToolbar } from './TableToolbar';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ColumnPreferenceManager } from '@/lib/managers/ColumnPreferenceManager';
import { ShowDeletedToggle } from '@/components/common/ShowDeletedToggle';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import type {
  DataTableProps,
  ExtendedColumnDef,
  EntityTableConfig,
  UserColumnPreferences,
} from './types';
import type { RowSelectionState, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import { apiUrl } from '@/lib/utils';

interface DataTableWrapperProps<TData extends Record<string, any>> {
  /**
   * Entity table configuration
   */
  config: EntityTableConfig<TData>;
  /**
   * Data fetching function
   */
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
  /**
   * Additional query parameters for data fetching
   */
  queryParams?: Record<string, any>;
  /**
   * Custom row actions
   */
  rowActions?: (row: TData) => React.ReactNode;
  /**
   * On row click handler
   */
  onRowClick?: (row: TData) => void;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Enable column visibility (default: true)
   */
  enableColumnVisibility?: boolean;
  /**
   * Enable row selection (default: true)
   */
  enableRowSelection?: boolean;
  /**
   * Initial sorting state
   */
  initialSorting?: SortingState;
  /**
   * Initial filters
   */
  initialFilters?: ColumnFiltersState;
  /**
   * On row selection change callback
   */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /**
   * Enable search toolbar (default: true)
   */
  enableSearch?: boolean;
  /**
   * Search placeholder text
   */
  searchPlaceholder?: string;
  /**
   * Inline edit component for expandable row editing
   */
  inlineEditComponent?: React.ComponentType<{
    row: TData;
    onSave: () => void;
    onCancel: () => void;
  }>;
  /**
   * Function to get custom className for a row
   */
  getRowClassName?: (row: TData) => string;
}

/**
 * DataTableWrapper component
 * Combines DataTable with data fetching, column visibility, and state management
 */
export function DataTableWrapper<TData extends Record<string, any>>({
  config,
  fetchData,
  queryParams = {},
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
}: DataTableWrapperProps<TData>) {
  const { can } = usePermissions();
  const isAdmin = useIsAdmin();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get includeDeleted from URL params (admins only)
  const includeDeleted = searchParams.get('includeDeleted') === 'true';
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting || config.defaultSort || []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters || []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: config.defaultPageSize || 20,
  });
  const [userPreferences, setUserPreferences] = React.useState<UserColumnPreferences | null>(null);
  const [isSelectingAll, setIsSelectingAll] = React.useState(false);

  // Filter columns based on permissions
  const visibleColumns = React.useMemo(() => {
    return config.columns.filter((column) => {
      // Check column permission
      if (column.permission && !can(column.permission as any)) {
        return false;
      }
      return true;
    });
  }, [config.columns, can]);

  // Build default visibility state from column definitions
  const defaultVisibility = React.useMemo(() => {
    const visibility: VisibilityState = {};
    const defaultVisibleColumns = config.defaultVisibleColumns || [];

    visibleColumns.forEach((column) => {
      const columnId = column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '');
      // If column is in defaultVisibleColumns, it's visible
      // Otherwise, check defaultVisible property
      if (defaultVisibleColumns.length > 0) {
        visibility[columnId] = defaultVisibleColumns.includes(columnId);
      } else {
        visibility[columnId] = column.defaultVisible ?? true;
      }
    });

    return visibility;
  }, [visibleColumns, config.defaultVisibleColumns]);

  // Load user column preferences
  // Use a ref to track the last entity type we loaded preferences for
  const lastEntityTypeRef = React.useRef<string | null>(null);
  const defaultVisibilityStringRef = React.useRef<string>('');

  // Serialize defaultVisibility to string for comparison
  const defaultVisibilityString = React.useMemo(
    () => JSON.stringify(defaultVisibility),
    [defaultVisibility]
  );

  React.useEffect(() => {
    // Skip if defaultVisibility hasn't actually changed (by value, not reference)
    if (defaultVisibilityString === defaultVisibilityStringRef.current && lastEntityTypeRef.current === config.entityType) {
      return;
    }

    defaultVisibilityStringRef.current = defaultVisibilityString;

    if (!enableColumnVisibility) {
      // Only set if it's different from current state
      setColumnVisibility((prev) => {
        const defaultKeys = Object.keys(defaultVisibility);
        const prevKeys = Object.keys(prev);
        
        // Check if they're different
        if (defaultKeys.length !== prevKeys.length) {
          return defaultVisibility;
        }
        
        for (const key of defaultKeys) {
          if (prev[key] !== defaultVisibility[key]) {
            return defaultVisibility;
          }
        }
        
        return prev; // No change needed
      });
      return;
    }

    // Only load preferences when entityType changes or on first mount
    if (lastEntityTypeRef.current === config.entityType && lastEntityTypeRef.current !== null) {
      return;
    }

    lastEntityTypeRef.current = config.entityType;

    const loadPreferences = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/user-preferences/column-visibility?entityType=${config.entityType}`)
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const preferences = result.data as UserColumnPreferences;
            setUserPreferences(preferences);

            // Merge user preferences with defaults
            const defaultPrefs: UserColumnPreferences = {};
            Object.keys(defaultVisibility).forEach((key) => {
              defaultPrefs[key] = {
                visible: defaultVisibility[key] ?? true,
              };
            });
            const merged = ColumnPreferenceManager.mergePreferences(
              defaultPrefs,
              preferences
            );
            const visibility = ColumnPreferenceManager.preferencesToVisibilityState(merged);
            setColumnVisibility(visibility);
          } else {
            setColumnVisibility(defaultVisibility);
          }
        } else {
          setColumnVisibility(defaultVisibility);
        }
      } catch (error) {
        console.error('Error loading column preferences:', error);
        setColumnVisibility(defaultVisibility);
      }
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.entityType, enableColumnVisibility, defaultVisibilityString]); // Use stringified version for comparison

  // Apply column visibility to columns
  const filteredColumns = React.useMemo(() => {
    return visibleColumns.filter((column) => {
      const columnId = column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '');
      return columnVisibility[columnId] !== false;
    });
  }, [visibleColumns, columnVisibility]);

  // Extract search from column filters
  const searchFilter = React.useMemo(() => {
    const searchFilterItem = columnFilters.find((f) => f.id === 'search');
    return searchFilterItem?.value ? String(searchFilterItem.value) : '';
  }, [columnFilters]);

  // Non-search filters (for column-specific filtering)
  const nonSearchFilters = React.useMemo(() => {
    return columnFilters.filter((f) => f.id !== 'search');
  }, [columnFilters]);

  // Data fetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      config.entityType,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      includeDeleted, // Include in cache key
      queryParams,
    ],
    queryFn: async () => {
      return fetchData({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sorting,
        filters: nonSearchFilters,
        search: searchFilter || undefined,
        ...queryParams,
        ...(isAdmin && includeDeleted && { includeDeleted: 'true' }),
      });
    },
  });

  // Use ref to avoid dependency issues and prevent infinite loops
  const onRowSelectionChangeRef = React.useRef(onRowSelectionChange);
  React.useEffect(() => {
    onRowSelectionChangeRef.current = onRowSelectionChange;
  }, [onRowSelectionChange]);
  
  const handleRowSelectionChange = React.useCallback((selection: RowSelectionState) => {
    console.log('DataTableWrapper handleRowSelectionChange:', { selection, keys: Object.keys(selection), selectedCount: Object.keys(selection).filter(k => selection[k]).length });
    setRowSelection(selection);
    onRowSelectionChangeRef.current?.(selection);
  }, []); // No dependencies - use refs instead

  const handleColumnVisibilityChange = (visibility: VisibilityState) => {
    setColumnVisibility(visibility);
  };

  const selectedRowIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  // Expose search state (derived from columnFilters)
  const searchValue = searchFilter;

  // Handle search change - add/update search filter
  const handleSearchChange = React.useCallback((value: string) => {
    setColumnFilters((prev) => {
      const withoutSearch = prev.filter((f) => f.id !== 'search');
      if (value) {
        return [...withoutSearch, { id: 'search', value }];
      }
      return withoutSearch;
    });
  }, []);

  // Handle select all - fetch all IDs matching current filters
  const handleSelectAll = React.useCallback(async () => {
    if (!enableRowSelection) return;
    
    setIsSelectingAll(true);
    try {
      // Fetch all IDs by paginating through all pages
      const allIds: string[] = [];
      let page = 1;
      const pageSize = 100; // Use larger page size for efficiency
      let hasMore = true;

      while (hasMore) {
        const result = await fetchData({
          page,
          pageSize,
          sorting,
          filters: nonSearchFilters,
          search: searchFilter || undefined,
          ...queryParams,
        });

        const pageIds = (result.data || []).map((row: TData) => row.id).filter(Boolean);
        allIds.push(...pageIds);

        // Check if there are more pages
        if (result.meta) {
          if (result.meta.totalPages !== undefined && (page >= result.meta.totalPages || pageIds.length < pageSize)) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          // No pagination info, stop if we got fewer results than page size
          if (pageIds.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      // Select all fetched IDs
      const newSelection: RowSelectionState = {};
      allIds.forEach((id) => {
        newSelection[id] = true;
      });
      
      setRowSelection(newSelection);
      handleRowSelectionChange(newSelection);
      
      if (allIds.length > 0) {
        toast.success(`Selected all ${allIds.length} record(s) matching current filters`);
      } else {
        toast.warning('No records found matching current filters');
      }
    } catch (error: any) {
      console.error('Error selecting all:', error);
      toast.error(error.message || 'Failed to select all records');
    } finally {
      setIsSelectingAll(false);
    }
  }, [enableRowSelection, fetchData, sorting, nonSearchFilters, searchFilter, queryParams, handleRowSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      {enableSearch && (
        <TableToolbar
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          columnFilters={nonSearchFilters}
          onColumnFiltersChange={setColumnFilters}
          filterDefinitions={config.filterDefinitions}
          entityType={config.entityType}
          searchPlaceholder={searchPlaceholder}
          onSelectAll={enableRowSelection ? handleSelectAll : undefined}
          isSelectingAll={isSelectingAll}
          totalCount={data?.meta?.totalCount}
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
          {isAdmin && (
            <ShowDeletedToggle className="ml-2" />
          )}
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
        onInlineEditSave={() => {
          refetch();
        }}
        getRowClassName={getRowClassName}
        entityType={config.entityType}
        onColumnFilterChange={() => {
          // Trigger refetch when column filter changes
          refetch();
        }}
      />
    </div>
  );
}

