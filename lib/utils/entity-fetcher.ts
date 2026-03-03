import { apiUrl } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface FetchParams {
  page?: number;
  pageSize?: number;
  sorting?: SortingState;
  filters?: ColumnFiltersState;
  search?: string;
  [key: string]: any;
}

interface FetchResult<T> {
  data: T[];
  meta?: {
    totalCount?: number;
    totalPages?: number;
    page?: number;
    pageSize?: number;
  };
}

interface EntityFetcherOptions {
  /** API endpoint path (e.g., '/api/drivers') */
  endpoint: string;
  /** Map of column IDs to API sort field names */
  sortFieldMap?: Record<string, string>;
  /** Default sort field if none specified */
  defaultSortBy?: string;
  /** Default sort order */
  defaultSortOrder?: 'asc' | 'desc';
  /**
   * Nested key within `result.data` that contains the array (e.g., 'vendors').
   * When set, data is read from `result.data[dataKey]` with meta from `result.data.pagination`.
   * Falls back to `result.data` when the key is not found.
   */
  dataKey?: string;
}

/**
 * Creates a standardized data fetcher function for use with DataTableWrapper.
 * Handles pagination, sorting, filtering, and search query parameter construction.
 */
export function createEntityFetcher<T>(
  options: EntityFetcherOptions
): (params: FetchParams) => Promise<FetchResult<T>> {
  const {
    endpoint,
    sortFieldMap = {},
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
    dataKey,
  } = options;

  return async (params: FetchParams): Promise<FetchResult<T>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

    // Sorting
    if (params.sorting && params.sorting.length > 0) {
      const sortFields: string[] = [];
      const sortOrders: string[] = [];

      params.sorting.forEach((sort) => {
        const sortField = sortFieldMap[sort.id] || sort.id;
        sortFields.push(sortField);
        sortOrders.push(sort.desc ? 'desc' : 'asc');
      });

      queryParams.set('sortBy', sortFields.join(','));
      queryParams.set('sortOrder', sortOrders.join(','));
    } else {
      queryParams.set('sortBy', defaultSortBy);
      queryParams.set('sortOrder', defaultSortOrder);
    }

    // Filters and search
    const filterParams = convertFiltersToQueryParams(
      params.filters || [],
      params.search
    );
    filterParams.forEach((value, key) => {
      if (queryParams.has(key)) {
        queryParams.append(key, value);
      } else {
        queryParams.set(key, value);
      }
    });

    // Pass through any extra query params
    const knownKeys = new Set([
      'page', 'pageSize', 'sorting', 'filters', 'search',
      'includeDeleted',
    ]);
    Object.entries(params).forEach(([key, value]) => {
      if (!knownKeys.has(key) && value !== undefined && value !== null) {
        queryParams.set(key, String(value));
      }
    });

    const response = await fetch(apiUrl(`${endpoint}?${queryParams}`));
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${endpoint}`);
    }
    const result = await response.json();

    // Resolve data array — supports nested responses (e.g. { data: { vendors: [...], pagination } })
    let data: T[];
    let meta: FetchResult<T>['meta'];

    if (dataKey && result.data?.[dataKey]) {
      data = result.data[dataKey];
      const pg = result.data.pagination;
      meta = pg
        ? { totalCount: pg.total, totalPages: pg.totalPages, page: pg.page, pageSize: pg.limit }
        : { totalCount: data.length, totalPages: 1, page: params.page || 1, pageSize: params.pageSize || 20 };
    } else {
      data = result.data || [];
      meta = result.meta
        ? { totalCount: result.meta.total, totalPages: result.meta.totalPages, page: result.meta.page, pageSize: result.meta.limit }
        : { totalCount: data.length, totalPages: 1, page: params.page || 1, pageSize: params.pageSize || 20 };
    }

    return { data, meta };
  };
}
