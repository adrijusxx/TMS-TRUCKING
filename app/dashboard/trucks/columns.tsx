'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { updateEntityField } from '@/lib/utils/updateEntityField';
import { TruckStatus } from '@prisma/client';

interface TruckData {
  id: string;
  truckNumber: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  vin: string;
  equipmentType?: string;
  status: TruckStatus;
  createdAt: Date;
  notes?: string | null;
}

const statusColors: Record<TruckStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  IN_USE: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
  MAINTENANCE_DUE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  NEEDS_REPAIR: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: TruckStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function createTruckColumns(
  onUpdate?: () => void
): ExtendedColumnDef<TruckData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    await updateEntityField('truck', rowId, columnId, value);
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
      id: 'truckNumber',
      accessorKey: 'truckNumber',
      header: 'Truck #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/trucks/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.truckNumber}
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
            {row.original.year} {row.original.make} {row.original.model}
          </div>
        </div>
      ),
      defaultVisible: true,
    },
    {
      id: 'licensePlate',
      accessorKey: 'licensePlate',
      header: 'License Plate',
      cell: ({ row }) => `${row.original.licensePlate} (${row.original.state})`,
      defaultVisible: true,
    },
    {
      id: 'vin',
      accessorKey: 'vin',
      header: 'VIN',
      cell: ({ row }) => <span className="font-mono">{row.original.vin}</span>,
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
      cell: ({ row }) => row.original.year,
      defaultVisible: false,
    },
    {
      id: 'state',
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => row.original.state,
      defaultVisible: false,
    },
    {
      id: 'equipmentType',
      accessorKey: 'equipmentType',
      header: 'Equip Type',
      cell: ({ row }) => row.original.equipmentType?.replace(/_/g, ' ') || '-',
      defaultVisible: false,
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
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status]}>
          {formatStatus(row.original.status)}
        </Badge>
      ),
      defaultVisible: true,
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

