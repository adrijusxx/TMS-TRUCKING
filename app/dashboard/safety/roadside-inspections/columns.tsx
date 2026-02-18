'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';

export interface RoadsideInspectionData {
  id: string;
  inspectionDate: string | Date;
  inspectionLocation: string;
  inspectionState: string;
  inspectionLevel: string;
  violationsFound: boolean;
  outOfService: boolean;
  oosReason?: string | null;
  dataQSubmitted: boolean;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  truck: {
    id: string;
    truckNumber: string;
  } | null;
  violations?: Array<{
    id: string;
    violationCode: string;
    description: string;
  }>;
}

const statusColors: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200',
  CONDITIONAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  COMPLIANT: 'bg-green-100 text-green-800 border-green-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(outOfService: boolean, violationsFound: boolean): string {
  if (outOfService) return 'OUT_OF_SERVICE';
  if (violationsFound) return 'FAILED';
  return 'PASSED';
}

function formatInspectionLevel(level: string): string {
  return level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function updateRoadsideInspectionField(
  inspectionId: string,
  field: string,
  value: string | number | null
): Promise<void> {
  // Note: This endpoint may need to be created
  const response = await fetch(apiUrl(`/api/safety/roadside-inspections/${inspectionId}`), {
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

export function createRoadsideInspectionColumns(
  onUpdate?: () => void
): ExtendedColumnDef<RoadsideInspectionData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    try {
      await updateRoadsideInspectionField(rowId, columnId, value);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating roadside inspection:', error);
      throw error;
    }
  };

  return [
    {
      id: 'inspectionDate',
      accessorKey: 'inspectionDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.inspectionDate),
      defaultVisible: true,
    },
    {
      id: 'inspectionLocation',
      accessorKey: 'inspectionLocation',
      header: 'Location',
      cell: ({ row }) => `${row.original.inspectionLocation}, ${row.original.inspectionState}`,
      defaultVisible: true,
    },
    {
      id: 'inspectionLevel',
      accessorKey: 'inspectionLevel',
      header: 'Level',
      cell: ({ row }) => (
        <Badge variant="outline">
          {formatInspectionLevel(row.original.inspectionLevel)}
        </Badge>
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
      defaultVisible: true,
    },
    {
      id: 'truck',
      header: 'Vehicle',
      cell: ({ row }) => {
        const truck = row.original.truck;
        if (!truck) return <span className="text-muted-foreground">—</span>;
        return (
          <Link
            href={`/dashboard/trucks/${truck.id}`}
            className="text-primary hover:underline"
          >
            {truck.truckNumber}
          </Link>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = formatStatus(row.original.outOfService, row.original.violationsFound);
        const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
        return (
          <Badge variant="outline" className={statusColor}>
            {status.replace(/_/g, ' ')}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'violationsFound',
      accessorKey: 'violationsFound',
      header: 'Violations',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.violationsFound
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-green-100 text-green-800 border-green-200'
          }
        >
          {row.original.violationsFound ? 'Yes' : 'No'}
        </Badge>
      ),
      defaultVisible: true,
    },
    {
      id: 'outOfService',
      accessorKey: 'outOfService',
      header: 'OOS',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.outOfService
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-green-100 text-green-800 border-green-200'
          }
        >
          {row.original.outOfService ? 'Yes' : 'No'}
        </Badge>
      ),
      defaultVisible: true,
    },
    {
      id: 'oosReason',
      accessorKey: 'oosReason',
      header: 'OOS Reason',
      cell: ({ row }) => {
        const reason = row.original.oosReason;
        if (!reason) return <span className="text-muted-foreground">—</span>;
        return <span className="truncate max-w-xs">{reason}</span>;
      },
      defaultVisible: false,
    },
    {
      id: 'dataQSubmitted',
      accessorKey: 'dataQSubmitted',
      header: 'DataQ',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.dataQSubmitted
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }
        >
          {row.original.dataQSubmitted ? 'Submitted' : 'Not Submitted'}
        </Badge>
      ),
      defaultVisible: false,
    },
  ];
}

