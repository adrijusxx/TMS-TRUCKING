'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import Link from 'next/link';
import { updateEntityField } from '@/lib/utils/updateEntityField';

interface TrailerData {
  id: string;
  trailerNumber: string;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  state: string | null;
  vin: string | null;
  type: string | null;
  status: string | null;
  assignedTruck?: { id: string; truckNumber: string } | null;
  createdAt: Date;
  notes?: string | null;
}

export function createTrailerColumns(
  onUpdate?: () => void
): ExtendedColumnDef<TrailerData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    await updateEntityField('trailer', rowId, columnId, value);
    onUpdate?.();
  };

  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => row.original.id,
      defaultVisible: false,
    },
    {
      id: 'trailerNumber',
      accessorKey: 'trailerNumber',
      header: 'Trailer #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/trailers/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.trailerNumber}
        </Link>
      ),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.year ? `${row.original.year} ` : ''}
            {row.original.make} {row.original.model}
          </div>
        </div>
      ),
      defaultVisible: true,
    },
    {
      id: 'licensePlate',
      accessorKey: 'licensePlate',
      header: 'License Plate',
      cell: ({ row }) =>
        row.original.licensePlate
          ? `${row.original.licensePlate}${row.original.state ? ` (${row.original.state})` : ''}`
          : 'N/A',
      defaultVisible: true,
    },
    {
      id: 'vin',
      accessorKey: 'vin',
      header: 'VIN',
      cell: ({ row }) => <span className="font-mono">{row.original.vin || '-'}</span>,
      defaultVisible: false,
    },
    {
      id: 'make',
      accessorKey: 'make',
      header: 'Make',
      cell: ({ row }) => row.original.make,
      defaultVisible: false,
    },
    {
      id: 'model',
      accessorKey: 'model',
      header: 'Model',
      cell: ({ row }) => row.original.model,
      defaultVisible: false,
    },
    {
      id: 'year',
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => row.original.year || '-',
      defaultVisible: false,
    },
    {
      id: 'state',
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => row.original.state || '-',
      defaultVisible: false,
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => row.original.type?.replace(/_/g, ' ') || '-',
      defaultVisible: false,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => row.original.status ? <span className="capitalize">{row.original.status.toLowerCase().replace(/_/g, ' ')}</span> : '-',
      defaultVisible: false,
    },
    {
      id: 'assignedTruck',
      accessorKey: 'assignedTruck.truckNumber',
      header: 'Truck',
      cell: ({ row }) => row.original.assignedTruck?.truckNumber || '-',
      defaultVisible: true,
    },
    {
      id: 'notes',
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.notes || ''}
          rowId={row.original.id}
          columnId="notes"
          onSave={handleSave}
          type="text"
          placeholder="Enter notes"
        />
      ),
      defaultVisible: false,
    },
    {
      id: 'mcNumber',
      header: 'MC Number',
      cell: ({ row }) => {
        const mcNumber = (row.original as any).mcNumber;
        return mcNumber ? (
          <Link
            href={`/dashboard/mc-numbers/${mcNumber.id}`}
            className="text-primary hover:underline"
          >
            {mcNumber.number}
          </Link>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
      defaultVisible: false,
    },
  ];
}

