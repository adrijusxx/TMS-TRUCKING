'use client';

import { useState, useCallback, useMemo } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
  /** Query params object ready to spread into fetch params */
  params: Record<string, string>;
}

/**
 * Shared pagination state hook for data tables and lists.
 *
 * @example
 * const { page, pageSize, setPage, params } = usePagination({ pageSize: 25 });
 * const { data } = useEntityList('loads', { ...params, status: 'ACTIVE' });
 */
export function usePagination(initial?: Partial<PaginationState>): UsePaginationReturn {
  const [page, setPage] = useState(initial?.page ?? 1);
  const [pageSize, setPageSizeState] = useState(initial?.pageSize ?? 25);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page on page size change
  }, []);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const reset = useCallback(() => setPage(1), []);

  const params = useMemo(
    () => ({ page: String(page), pageSize: String(pageSize) }),
    [page, pageSize]
  );

  return { page, pageSize, offset, setPage, setPageSize, nextPage, prevPage, reset, params };
}
