'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';

export interface IncidentData {
  id: string;
  incidentNumber: string;
  incidentType: string;
  severity: string;
  date: string | Date;
  location: string;
  city?: string | null;
  state?: string | null;
  status: string;
  injuriesInvolved: boolean;
  fatalitiesInvolved: boolean;
  estimatedCost: number | null;
  investigationNotes?: string | null;
  description?: string | null;
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
  investigation: {
    id: string;
    status: string;
  } | null;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 border-red-200',
  REPORTED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_INVESTIGATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CLOSED: 'bg-green-100 text-green-800 border-green-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  COMPLIANT: 'bg-green-100 text-green-800 border-green-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function updateIncidentField(
  incidentId: string,
  field: string,
  value: string | number | null
): Promise<void> {
  const response = await fetch(apiUrl(`/api/safety/incidents/${incidentId}`), {
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

export function createIncidentColumns(
  onUpdate?: () => void
): ExtendedColumnDef<IncidentData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    try {
      await updateIncidentField(rowId, columnId, value);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating incident:', error);
      throw error;
    }
  };

  return [
    {
      id: 'incidentNumber',
      accessorKey: 'incidentNumber',
      header: 'Incident #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/safety/incidents/${row.original.id}`}
          className="text-primary hover:underline font-medium"
        >
          {row.original.incidentNumber}
        </Link>
      ),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'incidentType',
      accessorKey: 'incidentType',
      header: 'Type',
      cell: ({ row }) => row.original.incidentType.replace(/_/g, ' '),
      defaultVisible: true,
    },
    {
      id: 'severity',
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.original.severity;
        const severityColors: Record<string, string> = {
          CRITICAL: 'bg-red-100 text-red-800 border-red-200',
          HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
          MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          MINOR: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return (
          <Badge variant="outline" className={severityColors[severity] || 'bg-gray-100 text-gray-800'}>
            {severity}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'date',
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.date),
      defaultVisible: true,
    },
    {
      id: 'location',
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const location = row.original.location;
        const city = row.original.city;
        const state = row.original.state;
        if (city && state) {
          return `${location}, ${city}, ${state}`;
        }
        return location;
      },
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
        return truck.truckNumber;
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
      id: 'injuriesInvolved',
      accessorKey: 'injuriesInvolved',
      header: 'Injuries',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.injuriesInvolved
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }
        >
          {row.original.injuriesInvolved ? 'Yes' : 'No'}
        </Badge>
      ),
      defaultVisible: false,
    },
    {
      id: 'fatalitiesInvolved',
      accessorKey: 'fatalitiesInvolved',
      header: 'Fatalities',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.fatalitiesInvolved
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }
        >
          {row.original.fatalitiesInvolved ? 'Yes' : 'No'}
        </Badge>
      ),
      defaultVisible: false,
    },
    {
      id: 'estimatedCost',
      accessorKey: 'estimatedCost',
      header: 'Est. Cost',
      cell: ({ row }) => {
        const cost = row.original.estimatedCost;
        if (!cost) return <span className="text-muted-foreground">—</span>;
        return `$${cost.toLocaleString()}`;
      },
      defaultVisible: false,
    },
    {
      id: 'investigationNotes',
      accessorKey: 'investigationNotes',
      header: 'Notes',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.investigationNotes || ''}
          rowId={row.original.id}
          columnId="investigationNotes"
          onSave={handleSave}
          type="text"
          placeholder="Enter notes"
        />
      ),
      defaultVisible: false,
    },
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-muted-foreground">—</span>;
        return <span className="truncate max-w-xs">{desc}</span>;
      },
      defaultVisible: false,
    },
  ];
}

