'use client';

import React from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createFMCSAActionItemColumns, type FMCSAActionItemData } from './columns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export function FMCSATableClient() {
  const queryClient = useQueryClient();

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['fmcsa-action-items'] });
    queryClient.invalidateQueries({ queryKey: ['fmcsa-compliance'] });
  }, [queryClient]);

  const columns = React.useMemo(() => createFMCSAActionItemColumns(handleUpdate), [handleUpdate]);

  const fetchActionItems = async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    search?: string;
    [key: string]: any;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    // Handle sorting
    if (params.sorting && params.sorting.length > 0) {
      const sort = params.sorting[0];
      const sortField = sort.id === 'dueDate' ? 'dueDate' : 
                       sort.id === 'priority' ? 'priority' :
                       'dueDate';
      queryParams.set('sortBy', sortField);
      queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
    } else {
      queryParams.set('sortBy', 'dueDate');
      queryParams.set('sortOrder', 'asc');
    }

    // Handle filters
    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.id === 'status' && filter.value) {
          queryParams.set('status', String(filter.value));
        }
        if (filter.id === 'priority' && filter.value) {
          queryParams.set('priority', String(filter.value));
        }
      });
    }

    // Handle search
    if (params.search) {
      queryParams.set('search', params.search);
    }

    // Try action-items endpoint first, fallback to compliance endpoint
    let response = await fetch(apiUrl(`/api/safety/compliance/fmcsa/action-items?${queryParams}`));
    
    // If action-items endpoint doesn't exist, use compliance endpoint
    if (!response.ok && response.status === 404) {
      response = await fetch(apiUrl(`/api/safety/compliance/fmcsa?${queryParams}`));
    }

    if (!response.ok) {
      if (response.status === 404) {
        return {
          data: [],
          meta: {
            totalCount: 0,
            totalPages: 0,
            page: params.page || 1,
            pageSize: params.pageSize || 20,
          },
        };
      }
      throw new Error('Failed to fetch FMCSA action items');
    }
    
    const result = await response.json();

    // Handle both response formats: { actionItems: [...] } or { compliance: { actionItems: [...] } }
    const actionItems = result.actionItems || result.compliance?.actionItems || [];

    return {
      data: actionItems,
      meta: result.pagination || result.meta
        ? {
            totalCount: (result.pagination || result.meta)?.total || actionItems.length,
            totalPages: (result.pagination || result.meta)?.totalPages || 1,
            page: (result.pagination || result.meta)?.page || params.page || 1,
            pageSize: (result.pagination || result.meta)?.limit || params.pageSize || 20,
          }
        : {
            totalCount: actionItems.length,
            totalPages: 1,
            page: params.page || 1,
            pageSize: params.pageSize || 20,
          },
    };
  };

  return (
    <DataTableWrapper<FMCSAActionItemData>
      config={{
        entityType: 'fmcsa-action-items',
        columns,
        defaultSort: [{ id: 'dueDate', desc: false }],
        defaultPageSize: 20,
        enableRowSelection: true,
        enableColumnVisibility: true,
      }}
      fetchData={fetchActionItems}
      emptyMessage="No FMCSA action items found"
      searchPlaceholder="Search action items..."
    />
  );
}



























