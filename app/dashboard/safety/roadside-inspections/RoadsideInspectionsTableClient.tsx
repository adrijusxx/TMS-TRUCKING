'use client';

import React from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createRoadsideInspectionColumns, type RoadsideInspectionData } from './columns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export function RoadsideInspectionsTableClient() {
  const queryClient = useQueryClient();

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['roadside-inspections'] });
  }, [queryClient]);

  const columns = React.useMemo(() => createRoadsideInspectionColumns(handleUpdate), [handleUpdate]);

  const fetchRoadsideInspections = async (params: {
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
      const sortField = sort.id === 'inspectionDate' ? 'inspectionDate' : 'inspectionDate';
      queryParams.set('sortBy', sortField);
      queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
    } else {
      queryParams.set('sortBy', 'inspectionDate');
      queryParams.set('sortOrder', 'desc');
    }

    // Handle filters
    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.id === 'inspectionLevel' && filter.value) {
          queryParams.set('inspectionLevel', String(filter.value));
        }
        if (filter.id === 'outOfService' && filter.value !== undefined) {
          queryParams.set('outOfService', String(filter.value));
        }
        if (filter.id === 'violationsFound' && filter.value !== undefined) {
          queryParams.set('violationsFound', String(filter.value));
        }
      });
    }

    // Handle search
    if (params.search) {
      queryParams.set('search', params.search);
    }

    // Note: This endpoint may need to be created for general list
    // For now, using a placeholder that can be updated when endpoint exists
    const response = await fetch(apiUrl(`/api/safety/roadside-inspections?${queryParams}`));
    if (!response.ok) {
      // If endpoint doesn't exist, return empty data
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
      throw new Error('Failed to fetch roadside inspections');
    }
    const result = await response.json();

    return {
      data: result.inspections || result.data || [],
      meta: result.pagination || result.meta
        ? {
            totalCount: (result.pagination || result.meta)?.total || 0,
            totalPages: (result.pagination || result.meta)?.totalPages || 1,
            page: (result.pagination || result.meta)?.page || params.page || 1,
            pageSize: (result.pagination || result.meta)?.limit || params.pageSize || 20,
          }
        : {
            totalCount: result.inspections?.length || result.data?.length || 0,
            totalPages: 1,
            page: params.page || 1,
            pageSize: params.pageSize || 20,
          },
    };
  };

  const rowActions = (row: RoadsideInspectionData) => (
    <div className="flex items-center gap-2">
      {row.truck && (
        <Link href={`/dashboard/trucks/${row.truck.id}/roadside-inspections`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <DataTableWrapper<RoadsideInspectionData>
      config={{
        entityType: 'roadside-inspections',
        columns,
        defaultSort: [{ id: 'inspectionDate', desc: true }],
        defaultPageSize: 20,
        enableRowSelection: true,
        enableColumnVisibility: true,
      }}
      fetchData={fetchRoadsideInspections}
      rowActions={rowActions}
      emptyMessage="No roadside inspections found"
      searchPlaceholder="Search inspections..."
    />
  );
}




























