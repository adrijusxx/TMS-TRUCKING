'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { apiUrl, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isExpired, isExpiringSoon } from '@/lib/utils/compliance-status';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import type { ExtendedColumnDef } from '@/components/data-table/types';

type VehicleType = 'all' | 'truck' | 'trailer';

interface VehicleComplianceRow {
  id: string;
  vehicleNumber: string;
  vehicleType: 'Truck' | 'Trailer';
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

function createVehicleColumns(): ExtendedColumnDef<VehicleComplianceRow>[] {
  return [
    {
      id: 'vehicleNumber',
      accessorKey: 'vehicleNumber',
      header: 'Vehicle #',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{row.original.vehicleNumber}</Badge>
        </div>
      ),
    },
    {
      id: 'vehicleType',
      accessorKey: 'vehicleType',
      header: 'Type',
      cell: ({ row }) => {
        const isTruck = row.original.vehicleType === 'Truck';
        return (
          <Badge variant={isTruck ? 'default' : 'secondary'} className="text-xs">
            {row.original.vehicleType}
          </Badge>
        );
      },
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Year / Make / Model',
    },
    {
      id: 'ownership',
      accessorKey: 'ownership',
      header: 'Ownership',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.ownership}</span>
      ),
    },
    {
      id: 'mcNumber',
      accessorKey: 'mcNumber',
      header: 'MC Number',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.mcNumber || '-'}</span>
      ),
    },
    {
      id: 'insuranceExpiry',
      accessorKey: 'insuranceExpiry',
      header: 'Insurance Exp',
      cell: ({ row }) => <ComplianceCell date={row.original.insuranceExpiry} />,
    },
    {
      id: 'registrationExpiry',
      accessorKey: 'registrationExpiry',
      header: 'Registration Exp',
      cell: ({ row }) => <ComplianceCell date={row.original.registrationExpiry} />,
    },
    {
      id: 'inspectionExpiry',
      accessorKey: 'inspectionExpiry',
      header: 'Inspection Exp',
      cell: ({ row }) => <ComplianceCell date={row.original.inspectionExpiry} />,
    },
  ];
}

function mapRow(t: any, type: 'Truck' | 'Trailer'): VehicleComplianceRow {
  const numberKey = type === 'Truck' ? 'truckNumber' : 'trailerNumber';
  return {
    id: `${type.toLowerCase()}-${t.id}`, vehicleNumber: t[numberKey], vehicleType: type,
    name: t.name, ownership: t.ownership, mcNumber: t.mcNumber,
    insuranceExpiry: t.insuranceExpiry, registrationExpiry: t.registrationExpiry,
    inspectionExpiry: t.inspectionExpiry,
  };
}

export default function VehicleComplianceBoard() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('all');
  const [ownership, setOwnership] = useState<string>('all');
  const columns = useMemo(() => createVehicleColumns(), []);

  const queryParams = useMemo(
    () => ({
      ...(ownership !== 'all' && { ownership }),
      vehicleType,
    }),
    [ownership, vehicleType]
  );

  const fetchVehicles = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState; search?: string }) => {
      const buildQp = (extra?: Record<string, string>) => {
        const qp = new URLSearchParams();
        if (params.page) qp.set('page', String(params.page));
        if (params.pageSize) qp.set('limit', String(params.pageSize));
        if (params.search) qp.set('search', params.search);
        if (ownership !== 'all') qp.set('ownership', ownership);
        if (extra) Object.entries(extra).forEach(([k, v]) => qp.set(k, v));
        return qp.toString();
      };

      const fetchTrucks = vehicleType !== 'trailer'
        ? fetch(apiUrl(`/api/safety/truck-compliance?${buildQp()}`)).then((r) => {
            if (!r.ok) throw new Error('Failed to fetch truck compliance');
            return r.json();
          })
        : Promise.resolve({ data: [], meta: { totalCount: 0 } });

      const fetchTrailers = vehicleType !== 'truck'
        ? fetch(apiUrl(`/api/safety/trailer-compliance?${buildQp()}`)).then((r) => {
            if (!r.ok) throw new Error('Failed to fetch trailer compliance');
            return r.json();
          })
        : Promise.resolve({ data: [], meta: { totalCount: 0 } });

      const [truckRes, trailerRes] = await Promise.all([fetchTrucks, fetchTrailers]);

      const trucks = (truckRes.data || []).map((t: any) => mapRow(t, 'Truck'));
      const trailers = (trailerRes.data || []).map((t: any) => mapRow(t, 'Trailer'));
      const merged = [...trucks, ...trailers].sort((a, b) =>
        a.vehicleNumber.localeCompare(b.vehicleNumber, undefined, { numeric: true })
      );

      const totalCount = (truckRes.meta?.totalCount || 0) + (trailerRes.meta?.totalCount || 0);

      return {
        data: merged,
        meta: { totalCount, totalPages: 1, page: params.page || 1, pageSize: params.pageSize || 50 },
      };
    },
    [ownership, vehicleType]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          {(['all', 'truck', 'trailer'] as VehicleType[]).map((type) => (
            <Button
              key={type}
              variant={vehicleType === type ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setVehicleType(type)}
            >
              {type === 'all' ? 'All' : type === 'truck' ? 'Trucks' : 'Trailers'}
            </Button>
          ))}
        </div>

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

      <DataTableWrapper<VehicleComplianceRow>
        config={{
          entityType: 'vehicle-compliance',
          columns,
          defaultSort: [{ id: 'vehicleNumber', desc: false }],
          defaultPageSize: 50,
          enableRowSelection: false,
          enableColumnVisibility: true,
        }}
        fetchData={fetchVehicles}
        queryParams={queryParams}
        emptyMessage="No vehicles found"
      />
    </div>
  );
}
