'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Check, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AccidentData {
  id: string;
  incidentNumber: string;
  incidentType: string;
  severity: string;
  date: string | Date;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
  driverId?: string | null;
  truckId?: string | null;
  loadId?: string | null;
  status: string;
  estimatedCost?: number | null;
  dotReportable: boolean;
  injuriesInvolved: boolean;
  fatalitiesInvolved: boolean;
  driver?: { id: string; user: { firstName: string; lastName: string } } | null;
  truck?: { id: string; truckNumber: string } | null;
}

export interface AccidentActions {
  onEdit?: (accident: AccidentData) => void;
  onDelete?: (accident: AccidentData) => void;
}

const severityColors: Record<string, string> = {
  MINOR: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MAJOR: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  FATAL: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors: Record<string, string> = {
  REPORTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNDER_INVESTIGATION: 'bg-blue-100 text-blue-800 border-blue-200',
  INVESTIGATION_COMPLETE: 'bg-green-100 text-green-800 border-green-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatLabel(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function BoolBadge({ value }: { value: boolean }) {
  return value ? (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><Check className="h-3 w-3" /></Badge>
  ) : (
    <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200"><X className="h-3 w-3" /></Badge>
  );
}

export function createAccidentsColumns(actions?: AccidentActions): ExtendedColumnDef<AccidentData>[] {
  return [
    {
      id: 'incidentNumber',
      accessorKey: 'incidentNumber',
      header: 'Incident #',
      cell: ({ row }) => <span className="font-medium">{row.original.incidentNumber}</span>,
      defaultVisible: true,
      required: true,
    },
    {
      id: 'driver',
      header: 'Driver',
      cell: ({ row }) => {
        const d = row.original.driver;
        if (!d) return <span className="text-muted-foreground">-</span>;
        return `${d.user.firstName} ${d.user.lastName}`;
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
      id: 'incidentType',
      accessorKey: 'incidentType',
      header: 'Type',
      cell: ({ row }) => formatLabel(row.original.incidentType),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ACCIDENT', label: 'Accident' },
        { value: 'COLLISION', label: 'Collision' },
        { value: 'ROLLOVER', label: 'Rollover' },
        { value: 'FIRE', label: 'Fire' },
        { value: 'SPILL', label: 'Spill' },
        { value: 'INJURY', label: 'Injury' },
        { value: 'EQUIPMENT_FAILURE', label: 'Equipment Failure' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    {
      id: 'severity',
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => (
        <Badge variant="outline" className={severityColors[row.original.severity] || ''}>
          {formatLabel(row.original.severity)}
        </Badge>
      ),
      defaultVisible: true,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status] || ''}>
          {formatLabel(row.original.status)}
        </Badge>
      ),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: [
        { value: 'REPORTED', label: 'Reported' },
        { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
        { value: 'INVESTIGATION_COMPLETE', label: 'Investigation Complete' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'CLOSED', label: 'Closed' },
      ],
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const { city, state } = row.original;
        if (!city && !state) return <span className="text-muted-foreground">-</span>;
        return [city, state].filter(Boolean).join(', ');
      },
      defaultVisible: true,
    },
    {
      id: 'truck',
      header: 'Truck',
      cell: ({ row }) => row.original.truck?.truckNumber ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'dotReportable',
      header: 'DOT Reportable',
      cell: ({ row }) => <BoolBadge value={row.original.dotReportable} />,
      defaultVisible: true,
    },
    {
      id: 'estimatedCost',
      accessorKey: 'estimatedCost',
      header: 'Est. Cost',
      cell: ({ row }) => formatCurrency(row.original.estimatedCost ?? 0),
      defaultVisible: true,
    },
    ...(actions ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: AccidentData } }) => {
        const accident = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit!(accident)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem onClick={() => actions.onDelete!(accident)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      defaultVisible: true,
    } as ExtendedColumnDef<AccidentData>] : []),
  ];
}
