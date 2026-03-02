'use client';

import * as React from 'react';
import type {
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';

interface UseDataTableStateProps {
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount?: number;
    totalPages?: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
}

/**
 * Manages controlled/uncontrolled state bridging for DataTable.
 * Each state dimension (sorting, filtering, etc.) can be either:
 * - Controlled: parent provides value + onChange
 * - Uncontrolled: managed internally with local useState
 */
export function useDataTableState(props: UseDataTableStateProps) {
  const {
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
    columnOrder: controlledColumnOrder,
    onColumnOrderChange,
  } = props;

  // Internal state for uncontrolled mode
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [internalColumnOrder, setInternalColumnOrder] = React.useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Refs to avoid dependency issues in callbacks
  const onRowSelectionChangeRef = React.useRef(onRowSelectionChange);
  React.useEffect(() => { onRowSelectionChangeRef.current = onRowSelectionChange; }, [onRowSelectionChange]);

  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const rowSelectionRef = React.useRef(rowSelection);
  React.useEffect(() => { rowSelectionRef.current = rowSelection; }, [rowSelection]);

  const handleRowSelectionChange = React.useCallback((updater: any) => {
    const current = rowSelectionRef.current;
    const newSelection = typeof updater === 'function' ? updater(current) : updater;
    if (onRowSelectionChangeRef.current) {
      onRowSelectionChangeRef.current(newSelection);
    } else {
      setInternalRowSelection(newSelection);
    }
  }, []);

  const setRowSelectionStable = React.useCallback((selection: RowSelectionState) => {
    if (onRowSelectionChangeRef.current) {
      onRowSelectionChangeRef.current(selection);
    } else {
      setInternalRowSelection(selection);
    }
  }, []);

  // Sorting
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

  // Column Filters
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

  // Column Visibility
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

  // Column Order
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

  // Pagination
  const pagination = controlledPagination
    ? { pageIndex: controlledPagination.pageIndex, pageSize: controlledPagination.pageSize }
    : internalPagination;
  const setPagination = onPaginationChange
    ? (updater: any) => {
        const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
        onPaginationChange(newPagination);
      }
    : setInternalPagination;

  return {
    rowSelection,
    handleRowSelectionChange,
    setRowSelectionStable,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    pagination,
    setPagination,
    globalFilter,
    setGlobalFilter,
  };
}
