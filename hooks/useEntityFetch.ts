import { useCallback } from 'react';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';

/**
 * Creates a standardized fetchData function for entity list components
 * Handles pagination, sorting, filtering, and search
 */
export function useEntityFetch<TData extends { id: string }>(entityType: string) {
  return useCallback(async (params: {
    page?: number;
    pageSize?: number;
    sorting?: SortingState;
    filters?: ColumnFiltersState;
    search?: string;
    [key: string]: any;
  }): Promise<{
    data: TData[];
    meta?: {
      totalCount: number;
      totalPages: number;
      page: number;
      pageSize: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    // Convert filters and search to query params
    const filterParams = convertFiltersToQueryParams(params.filters || [], params.search);
    
    // Merge filter params
    filterParams.forEach((value, key) => {
      // Handle multiple values for same key (e.g., status[]=x&status[]=y)
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    const response = await fetch(apiUrl(`/api/${entityType}?${queryParams}`));
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Failed to fetch data' } }));
      throw new Error(error.error?.message || `Failed to fetch ${entityType}`);
    }
    
    const result = await response.json();

    // Handle different response formats
    const data = result.data || result[entityType] || [];
    const meta = result.meta || result.pagination || {
      total: data.length,
      page: params.page || 1,
      limit: params.pageSize || 20,
      totalPages: 1,
    };

    return {
      data,
      meta: {
        totalCount: meta.total || meta.totalCount || data.length,
        totalPages: meta.totalPages || Math.ceil((meta.total || data.length) / (meta.limit || meta.pageSize || 20)),
        page: meta.page || params.page || 1,
        pageSize: meta.limit || meta.pageSize || params.pageSize || 20,
      },
    };
  }, [entityType]);
}




