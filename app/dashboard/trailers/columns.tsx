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

