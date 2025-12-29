'use client';

import React from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createIncidentColumns, type IncidentData } from './columns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export function IncidentsTableClient() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const handleUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  }, [queryClient]);

  const columns = React.useMemo(() => createIncidentColumns(handleUpdate), [handleUpdate]);

  const fetchIncidents = async (params: {
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
      const sortField = sort.id === 'date' ? 'date' : 
                       sort.id === 'incidentNumber' ? 'incidentNumber' :
                       'date';
      queryParams.set('sortBy', sortField);
      queryParams.set('sortOrder', sort.desc ? 'desc' : 'asc');
    } else {
      queryParams.set('sortBy', 'date');
      queryParams.set('sortOrder', 'desc');
    }

    // Handle filters
    if (params.filters) {
      params.filters.forEach((filter) => {
        if (filter.id === 'incidentType' && filter.value) {
          queryParams.set('incidentType', String(filter.value));
        }
        if (filter.id === 'severity' && filter.value) {
          queryParams.set('severity', String(filter.value));
        }
        if (filter.id === 'status' && filter.value) {
          queryParams.set('status', String(filter.value));
        }
      });
    }

    // Handle search
    if (params.search) {
      queryParams.set('search', params.search);
    }

    const response = await fetch(apiUrl(`/api/safety/incidents?${queryParams}`));
    if (!response.ok) throw new Error('Failed to fetch incidents');
    const result = await response.json();

    return {
      data: result.incidents || [],
      meta: result.pagination
        ? {
            totalCount: result.pagination.total,
            totalPages: result.pagination.totalPages,
            page: result.pagination.page,
            pageSize: result.pagination.limit,
          }
        : {
            totalCount: result.incidents?.length || 0,
            totalPages: 1,
            page: params.page || 1,
            pageSize: params.pageSize || 20,
          },
    };
  };

  const rowActions = (row: IncidentData) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/safety/incidents/${row.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </Link>
    </div>
  );

  const onRowClick = (row: IncidentData) => {
    window.location.href = `/dashboard/safety/incidents/${row.id}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        {can('safety.incidents.create') && (
          <Link href="/dashboard/safety/incidents/new">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </Link>
        )}
      </div>

      <DataTableWrapper<IncidentData>
        config={{
          entityType: 'incidents',
          columns,
          defaultSort: [{ id: 'date', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchIncidents}
        rowActions={rowActions}
        onRowClick={onRowClick}
        emptyMessage="No incidents reported"
        searchPlaceholder="Search incidents..."
      />
    </div>
  );
}



























