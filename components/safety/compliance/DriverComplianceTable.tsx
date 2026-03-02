'use client';

import React from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl } from '@/lib/utils';
import { getMcContext } from '@/lib/utils/query-keys';
import {
  createDriverComplianceColumns,
  driverComplianceFilterDefinitions,
} from '@/lib/config/entities/driver-compliance';
import DriverComplianceEditor from './DriverComplianceEditor';
import type { EntityTableConfig } from '@/components/data-table/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface DriverComplianceTableProps {
  onRefresh?: () => void;
  dispatcherMode?: boolean;
}

function InlineEditor({
  row,
  onSave,
  onCancel,
}: {
  row: any;
  onSave: () => void;
  onCancel: () => void;
}) {
  return <DriverComplianceEditor driver={row} onSave={onSave} onCancel={onCancel} />;
}

async function fetchDriverCompliance(params: {
  page?: number;
  pageSize?: number;
  sorting?: SortingState;
  filters?: ColumnFiltersState;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();

  if (params.page !== undefined) queryParams.set('page', (params.page + 1).toString());
  if (params.pageSize) queryParams.set('limit', params.pageSize.toString());

  // Extract search and compliance status from column filters
  const searchFilter = params.filters?.find((f) => f.id === 'search');
  if (searchFilter?.value) queryParams.set('search', String(searchFilter.value));

  const complianceFilter = params.filters?.find((f) => f.id === 'complianceStatus');
  if (complianceFilter?.value) queryParams.set('complianceStatus', String(complianceFilter.value));

  // MC number context
  const mcContext = getMcContext();
  if (mcContext) queryParams.set('mcNumberId', mcContext);

  const response = await fetch(apiUrl(`/api/safety/driver-compliance?${queryParams}`));
  if (!response.ok) throw new Error('Failed to fetch driver compliance data');
  const result = await response.json();

  const drivers = result?.data?.drivers || [];
  const pagination = result?.data?.pagination;

  return {
    data: drivers,
    meta: {
      totalCount: pagination?.total ?? drivers.length,
      totalPages: pagination?.totalPages ?? 1,
      page: params.page ?? 0,
      pageSize: params.pageSize ?? 50,
    },
  };
}

export default function DriverComplianceTable({
  onRefresh,
  dispatcherMode = false,
}: DriverComplianceTableProps) {
  const config: EntityTableConfig<any> = React.useMemo(
    () => ({
      entityType: 'driver-compliance',
      columns: createDriverComplianceColumns(dispatcherMode),
      filterDefinitions: driverComplianceFilterDefinitions,
      defaultPageSize: 50,
      enableRowSelection: false,
      enableExport: false,
      enableImport: false,
    }),
    [dispatcherMode]
  );

  return (
    <DataTableWrapper
      config={config}
      fetchData={fetchDriverCompliance}
      inlineEditComponent={InlineEditor}
      enableRowSelection={false}
      enableSearch={true}
      searchPlaceholder="Search drivers..."
      emptyMessage="No drivers found"
    />
  );
}
