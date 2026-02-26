'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { isExpired, isExpiringSoon } from '@/lib/utils/compliance-status';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { ExtendedColumnDef } from '@/components/data-table/types';

interface TruckComplianceRow {
  id: string;
  truckNumber: string;
  name: string;
  ownership: string;
  mcNumber: string | null;
  registrationExpiry: string;
  registrationUploaded: boolean;
  insuranceExpiry: string;
  insuranceUploaded: boolean;
  inspectionExpiry: string;
  inspectionUploaded: boolean;
}

function ComplianceCell({ date, uploaded }: { date: string | null; uploaded?: boolean }) {
  if (!date && !uploaded) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const expDate = date ? new Date(date) : null;
  const expired = expDate ? isExpired(expDate) : false;
  const expiring = expDate ? isExpiringSoon(expDate) : false;

  const uploadLabel = uploaded ? 'Uploaded' : 'not Uploaded';
  const uploadColor = uploaded
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-orange-600 dark:text-orange-400';

  let dateColor = 'text-foreground';
  let statusBadge: React.ReactNode = null;

  if (expired) {
    dateColor = 'text-red-600 dark:text-red-400';
    statusBadge = (
      <Badge variant="destructive" className="text-[10px] px-1 py-0 ml-2">
        EXPIRED
      </Badge>
    );
  } else if (expiring) {
    dateColor = 'text-yellow-600 dark:text-yellow-400';
    statusBadge = (
      <Badge variant="outline" className="text-[10px] px-1 py-0 ml-2 border-yellow-500 text-yellow-600">
        UPCOMING
      </Badge>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {expDate && (
        <span className={`text-sm font-medium ${dateColor}`}>
          {formatDate(expDate)}{statusBadge}
        </span>
      )}
      <span className={`text-xs ${uploadColor}`}>{uploadLabel}</span>
    </div>
  );
}

function createTruckColumns(): ExtendedColumnDef<TruckComplianceRow>[] {
  return [
    {
      id: 'truckNumber',
      accessorKey: 'truckNumber',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{row.original.truckNumber}</Badge>
          {row.original.ownership && (
            <span className="text-xs text-muted-foreground">{row.original.ownership}</span>
          )}
        </div>
      ),
    },
    {
      id: 'insuranceExpiry',
      accessorKey: 'insuranceExpiry',
      header: 'Insurance',
      cell: ({ row }) => (
        <ComplianceCell date={row.original.insuranceExpiry} uploaded={row.original.insuranceUploaded} />
      ),
    },
    {
      id: 'registrationExpiry',
      accessorKey: 'registrationExpiry',
      header: 'Registration',
      cell: ({ row }) => (
        <ComplianceCell date={row.original.registrationExpiry} uploaded={row.original.registrationUploaded} />
      ),
    },
    {
      id: 'inspectionExpiry',
      accessorKey: 'inspectionExpiry',
      header: 'Inspection',
      cell: ({ row }) => (
        <ComplianceCell date={row.original.inspectionExpiry} uploaded={row.original.inspectionUploaded} />
      ),
    },
  ];
}

export default function TruckComplianceBoard() {
  const [ownership, setOwnership] = useState<string>('all');
  const columns = useMemo(() => createTruckColumns(), []);

  const queryParams = useMemo(
    () => (ownership !== 'all' ? { ownership } : {}),
    [ownership]
  );

  const fetchTrucks = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState; search?: string }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      if (params.search) qp.set('search', params.search);
      if (ownership !== 'all') qp.set('ownership', ownership);

      const res = await fetch(apiUrl(`/api/safety/truck-compliance?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch truck compliance');
      return res.json();
    },
    [ownership]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={ownership} onValueChange={setOwnership}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Company">Company</SelectItem>
            <SelectItem value="Lease">Lease</SelectItem>
            <SelectItem value="Owner Operator">Owner Operator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTableWrapper<TruckComplianceRow>
        config={{
          entityType: 'truck-compliance',
          columns,
          defaultSort: [{ id: 'truckNumber', desc: false }],
          defaultPageSize: 50,
          enableRowSelection: false,
          enableColumnVisibility: true,
        }}
        fetchData={fetchTrucks}
        queryParams={queryParams}
        emptyMessage="No trucks found"
      />
    </div>
  );
}
