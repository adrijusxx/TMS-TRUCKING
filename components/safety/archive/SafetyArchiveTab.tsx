'use client';

import React, { useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createSafetyTaskColumns, type SafetyTaskData } from '../tasks/SafetyTasksColumns';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function SafetyArchiveTab() {
  const columns = useMemo(() => createSafetyTaskColumns(), []);

  const fetchArchived = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      qp.set('status', 'COMPLETED');
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      if (params.sorting?.[0]) {
        qp.set('sortField', params.sorting[0].id);
        qp.set('sortOrder', params.sorting[0].desc ? 'desc' : 'asc');
      }

      const res = await fetch(apiUrl(`/api/safety/tasks?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch archived tasks');
      const json = await res.json();
      return { data: json.data as SafetyTaskData[], meta: json.meta };
    },
    []
  );

  return (
    <DataTableWrapper<SafetyTaskData>
      config={{
        entityType: 'safety-archive',
        columns,
        defaultSort: [{ id: 'date', desc: true }],
        defaultPageSize: 20,
        enableRowSelection: true,
        enableColumnVisibility: true,
      }}
      fetchData={fetchArchived}
      emptyMessage="No archived safety tasks found"
    />
  );
}
