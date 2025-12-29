'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';

export interface DOTInspectionData {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  inspectionDate: string | Date;
  performedBy?: string | null;
  location?: string | null;
  status: string;
  defects: number;
  defectDetails?: string | null;
  oosStatus: boolean;
  oosItems?: string | null;
  notes?: string | null;
  inspectorNotes?: string | null;
  truck: {
    id: string;
    truckNumber: string;
  };
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

const statusColors: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CONDITIONAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  COMPLIANT: 'bg-green-100 text-green-800 border-green-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatInspectionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function updateDOTInspectionField(
  inspectionId: string,
  field: string,
  value: string | number | null
): Promise<void> {
  const response = await fetch(apiUrl(`/api/inspections/${inspectionId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ [field]: value }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Failed to update ${field}`);
  }
}

export function createDOTInspectionColumns(
  onUpdate?: () => void
): ExtendedColumnDef<DOTInspectionData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    try {
      await updateDOTInspectionField(rowId, columnId, value);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating DOT inspection:', error);
      throw error;
    }
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
      id: 'inspectionNumber',
      accessorKey: 'inspectionNumber',
      header: 'Inspection #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/trucks/${row.original.truck.id}/inspections/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.inspectionNumber}
        </Link>
      ),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'inspectionType',
      accessorKey: 'inspectionType',
      header: 'Type',
      cell: ({ row }) => formatInspectionType(row.original.inspectionType),
      defaultVisible: true,
    },
    {
      id: 'inspectionDate',
      accessorKey: 'inspectionDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.inspectionDate),
      defaultVisible: true,
    },
    {
      id: 'truck',
      header: 'Vehicle',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/trucks/${row.original.truck.id}`}
          className="text-primary hover:underline"
        >
          {row.original.truck.truckNumber}
        </Link>
      ),
      defaultVisible: true,
    },
    {
      id: 'driver',
      header: 'Driver',
      cell: ({ row }) => {
        const driver = row.original.driver;
        if (!driver) return <span className="text-muted-foreground">—</span>;
        return `${driver.user.firstName} ${driver.user.lastName}`;
      },
      defaultVisible: false,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
        return (
          <Badge variant="outline" className={statusColor}>
            {formatStatus(status)}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'defects',
      accessorKey: 'defects',
      header: 'Defects',
      cell: ({ row }) => {
        const defects = row.original.defects;
        return (
          <Badge
            variant="outline"
            className={
              defects > 0
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-green-100 text-green-800 border-green-200'
            }
          >
            {defects}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'oosStatus',
      accessorKey: 'oosStatus',
      header: 'OOS',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.oosStatus
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-green-100 text-green-800 border-green-200'
          }
        >
          {row.original.oosStatus ? 'Yes' : 'No'}
        </Badge>
      ),
      defaultVisible: true,
    },
    {
      id: 'location',
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.location || <span className="text-muted-foreground">—</span>,
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
      id: 'inspectorNotes',
      accessorKey: 'inspectorNotes',
      header: 'Comments',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.inspectorNotes || ''}
          rowId={row.original.id}
          columnId="inspectorNotes"
          onSave={handleSave}
          type="text"
          placeholder="Enter comments"
        />
      ),
      defaultVisible: false,
    },
  ];
}

