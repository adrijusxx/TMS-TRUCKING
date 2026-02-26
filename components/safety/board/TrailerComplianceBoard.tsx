'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { isExpired, isExpiringSoon } from '@/lib/utils/compliance-status';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { ExtendedColumnDef } from '@/components/data-table/types';

interface TrailerComplianceRow {
  id: string;
  trailerNumber: string;
  name: string;
  ownership: string;
  mcNumber: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
  inspectionExpiry: string | null;
}

function ComplianceCell({ date }: { date: string | null }) {
  if (!date) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const expDate = new Date(date);
  const expired = isExpired(expDate);
  const expiring = isExpiringSoon(expDate);

  let color = 'text-foreground';
  let statusBadge: React.ReactNode = null;

  if (expired) {
    color = 'text-red-600 dark:text-red-400';
    statusBadge = (
      <Badge variant="destructive" className="text-[10px] px-1 py-0 ml-2">
        EXPIRED
      </Badge>
    );
  } else if (expiring) {
    color = 'text-yellow-600 dark:text-yellow-400';
    statusBadge = (
      <Badge variant="outline" className="text-[10px] px-1 py-0 ml-2 border-yellow-500 text-yellow-600">
        UPCOMING
      </Badge>
    );
  }

  return (
    <span className={`text-sm font-medium ${color}`}>
      {formatDate(expDate)}{statusBadge}
    </span>
  );
}

function createTrailerColumns(): ExtendedColumnDef<TrailerComplianceRow>[] {
  return [
    {
      id: 'trailerNumber',
      accessorKey: 'trailerNumber',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{row.original.trailerNumber}</Badge>
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
      cell: ({ row }) => <ComplianceCell date={row.original.insuranceExpiry} />,
    },
    {
      id: 'registrationExpiry',
      accessorKey: 'registrationExpiry',
      header: 'Registration',
      cell: ({ row }) => <ComplianceCell date={row.original.registrationExpiry} />,
    },
    {
      id: 'inspectionExpiry',
      accessorKey: 'inspectionExpiry',
      header: 'Inspection',
      cell: ({ row }) => <ComplianceCell date={row.original.inspectionExpiry} />,
    },
  ];
}

export default function TrailerComplianceBoard() {
  const [ownership, setOwnership] = useState<string>('all');
  const columns = useMemo(() => createTrailerColumns(), []);

  const queryParams = useMemo(
    () => (ownership !== 'all' ? { ownership } : {}),
    [ownership]
  );

  const fetchTrailers = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState; search?: string }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      if (params.search) qp.set('search', params.search);
      if (ownership !== 'all') qp.set('ownership', ownership);

      const res = await fetch(apiUrl(`/api/safety/trailer-compliance?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch trailer compliance');
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

      <DataTableWrapper<TrailerComplianceRow>
        config={{
          entityType: 'trailer-compliance',
          columns,
          defaultSort: [{ id: 'trailerNumber', desc: false }],
          defaultPageSize: 50,
          enableRowSelection: false,
          enableColumnVisibility: true,
        }}
        fetchData={fetchTrailers}
        queryParams={queryParams}
        emptyMessage="No trailers found"
      />
    </div>
  );
}
