'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/export';
import type {
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import type { ExtendedColumnDef } from '../types';

type TableData = Record<string, any>;

interface UseTableDataProps<TData extends TableData> {
  entityType: string;
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
  pagination: { pageIndex: number; pageSize: number };
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  isAdmin: boolean;
  includeDeleted: boolean;
  enableRowSelection: boolean;
  filteredColumns: ExtendedColumnDef<TData>[];
  columnVisibility: VisibilityState;
}

/**
 * Manages data fetching, search extraction, select-all, and export logic for DataTableWrapper.
 */
export function useTableData<TData extends TableData>({
  entityType,
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
}: UseTableDataProps<TData>) {
  const [isSelectingAll, setIsSelectingAll] = React.useState(false);

  // Extract search from column filters
  const searchFilter = React.useMemo(() => {
    const searchFilterItem = columnFilters.find((f) => f.id === 'search');
    return searchFilterItem?.value ? String(searchFilterItem.value) : '';
  }, [columnFilters]);

  const nonSearchFilters = React.useMemo(() => {
    return columnFilters.filter((f) => f.id !== 'search');
  }, [columnFilters]);

  // Data fetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      entityType,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      includeDeleted,
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

  // Handle search change
  const handleSearchChange = React.useCallback((value: string) => {
    return (prev: ColumnFiltersState) => {
      const withoutSearch = prev.filter((f) => f.id !== 'search');
      if (value) return [...withoutSearch, { id: 'search', value }];
      return withoutSearch;
    };
  }, []);

  // Handle select all
  const handleSelectAll = React.useCallback(async (
    setRowSelection: (selection: RowSelectionState) => void,
    onRowSelectionChange?: (selection: RowSelectionState) => void,
  ) => {
    if (!enableRowSelection) return;
    setIsSelectingAll(true);

    try {
      const allIds: string[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore && page <= 100) {
        const result = await fetchData({
          page,
          pageSize,
          sorting,
          filters: nonSearchFilters,
          search: searchFilter || undefined,
          ...queryParams,
        });

        const pageIds = (result.data || []).map((row: TData) => (row as any).id).filter(Boolean);
        if (pageIds.length === 0) break;
        allIds.push(...pageIds);

        if (result.meta) {
          if (result.meta.totalPages !== undefined && (page >= result.meta.totalPages || pageIds.length < pageSize)) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          if (pageIds.length < pageSize) hasMore = false;
          else page++;
        }
      }

      const newSelection: RowSelectionState = {};
      allIds.forEach((id) => { newSelection[id] = true; });

      setRowSelection(newSelection);
      onRowSelectionChange?.(newSelection);

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
  }, [enableRowSelection, fetchData, sorting, nonSearchFilters, searchFilter, queryParams]);

  // Export handler
  const handleExport = React.useCallback(() => {
    const currentData = data?.data || [];
    if (currentData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const visibleCols = filteredColumns.filter(
      (col) => columnVisibility[col.id || (typeof col.accessorKey === 'string' ? col.accessorKey : '')] !== false
    );

    const headers: string[] = [];
    const accessorKeys: string[] = [];

    visibleCols.forEach((col) => {
      const header = typeof col.header === 'string'
        ? col.header
        : (col.header as any)?.toString?.() || col.id || String(col.accessorKey || '');
      const accessorKey = typeof col.accessorKey === 'string' ? col.accessorKey : col.id || '';
      headers.push(header);
      accessorKeys.push(accessorKey);
    });

    const exportData = currentData.map((row) => {
      const exportRow: Record<string, any> = {};
      headers.forEach((header, index) => {
        const ak = accessorKeys[index];
        let value: any = '';
        if (ak) {
          if (ak.includes('.')) {
            const keys = ak.split('.');
            value = keys.reduce((obj: any, key) => obj?.[key], row) ?? '';
          } else {
            value = (row as any)[ak] ?? '';
          }
        }
        exportRow[header] = value;
      });
      return exportRow;
    });

    const filename = `${entityType}-export-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, headers, filename);
    toast.success(`Exported ${exportData.length} row(s) to ${filename}`);
  }, [data, filteredColumns, columnVisibility, entityType]);

  return {
    data,
    isLoading,
    error,
    refetch,
    searchFilter,
    isSelectingAll,
    handleSearchChange,
    handleSelectAll,
    handleExport,
  };
}
