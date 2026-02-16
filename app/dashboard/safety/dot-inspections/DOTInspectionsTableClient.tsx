'use client';

import React from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createDOTInspectionColumns, type DOTInspectionData } from './columns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export function DOTInspectionsTableClient() {
  const queryClient = useQueryClient();

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
  }, [queryClient]);

  const columns = React.useMemo(() => createDOTInspectionColumns(handleUpdate), [handleUpdate]);

  const fetchDOTInspections = async (params: {
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

    // Filter for DOT inspection types
    queryParams.set('inspectionType', 'DOT_ANNUAL,DOT_LEVEL_1,DOT_LEVEL_2,DOT_LEVEL_3');

    // Handle sorting
    if (params.sorting && params.sorting.length > 0) {
      const sort = params.sorting[0];
      const sortField = sort.id === 'inspectionDate' ? 'inspectionDate' : 
                       sort.id === 'inspectionNumber' ? 'inspectionNumber' :
                       'inspectionDate';
      queryParams.set('sortBy', sortField);
      queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
    } else {
      queryParams.set('sortBy', 'inspectionDate');
      queryParams.set('sortOrder', 'desc');
    }

    // Handle filters
    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.id === 'inspectionType' && filter.value) {
          queryParams.set('inspectionType', String(filter.value));
        }
        if (filter.id === 'status' && filter.value) {
          queryParams.set('status', String(filter.value));
        }
        if (filter.id === 'oosStatus' && filter.value !== undefined) {
          queryParams.set('oosStatus', String(filter.value));
        }
      });
    }

    // Handle search
    if (params.search) {
      queryParams.set('search', params.search);
    }

    const response = await fetch(apiUrl(`/api/inspections?${queryParams}`));
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
      throw new Error('Failed to fetch DOT inspections');
    }
    const result = await response.json();

    return {
      data: result.data || result.inspections || [],
      meta: result.meta || result.pagination
        ? {
            totalCount: (result.meta || result.pagination)?.total || 0,
            totalPages: (result.meta || result.pagination)?.totalPages || 1,
            page: (result.meta || result.pagination)?.page || params.page || 1,
            pageSize: (result.meta || result.pagination)?.limit || params.pageSize || 20,
          }
        : {
            totalCount: result.data?.length || result.inspections?.length || 0,
            totalPages: 1,
            page: params.page || 1,
            pageSize: params.pageSize || 20,
          },
    };
  };

  const rowActions = (row: DOTInspectionData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/trucks/${row.truck.id}/inspections/${row.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </Link>
    </div>
  );

  return (
    <DataTableWrapper<DOTInspectionData>
      config={{
        entityType: 'dot-inspections',
        columns,
        defaultSort: [{ id: 'inspectionDate', desc: true }],
        defaultPageSize: 20,
        enableRowSelection: true,
        enableColumnVisibility: true,
      }}
      fetchData={fetchDOTInspections}
      rowActions={rowActions}
      emptyMessage="No DOT inspections found"
      searchPlaceholder="Search inspections..."
    />
  );
}





























