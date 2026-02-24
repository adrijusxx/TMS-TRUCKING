'use client';

import React, { useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createInspectionsColumns, type InspectionData } from './InspectionsColumns';
import { apiUrl } from '@/lib/utils';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function InspectionsTab() {
  const columns = useMemo(() => createInspectionsColumns(), []);

  const fetchInspections = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));

      const res = await fetch(apiUrl(`/api/safety/inspections?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch inspections');
      const json = await res.json();

      const items = json.data || [];
      const normalized: InspectionData[] = items.map((i: any) => ({
        id: i.id,
        driverName: i.driver || null,
        inspectionReport: i.inspectionNumber || null,
        mcNumber: null,
        inspectionLevel: i.type || 'LEVEL_1',
        inspectionDate: i.date,
        violationType: null,
        recordable: false,
        status: i.result || null,
        truckNumber: i.vehicle || null,
        trailerNumber: null,
        totalCharge: 0,
        totalFee: 0,
        note: null,
        violationsFound: i.result === 'Violations',
        outOfService: i.result === 'Out of Service',
      }));

      return { data: normalized, meta: json.meta };
    },
    []
  );

  return (
    <DataTableWrapper<InspectionData>
      config={{
        entityType: 'safety-inspections',
        columns,
        defaultSort: [{ id: 'inspectionDate', desc: true }],
        defaultPageSize: 20,
        enableRowSelection: true,
        enableColumnVisibility: true,
      }}
      fetchData={fetchInspections}
      emptyMessage="No inspections found"
    />
  );
}
