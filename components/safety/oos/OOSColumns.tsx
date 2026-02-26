'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface OOSData {
  id: string;
  oosDate: string | Date;
  oosReason: string;
  oosType: string;
  status: string;
  requiredCorrectiveAction?: string | null;
  inspectorName?: string | null;
  inspectorBadgeNumber?: string | null;
  resolvedAt?: string | Date | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  driver?: { id: string; user: { firstName: string; lastName: string } } | null;
  truck?: { id: string; truckNumber: string } | null;
}

export interface OOSActions {
  onResolve?: (order: OOSData) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-red-100 text-red-800 border-red-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const typeColors: Record<string, string> = {
  DRIVER: 'bg-blue-100 text-blue-800 border-blue-200',
  VEHICLE: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function createOOSColumns(actions?: OOSActions): ExtendedColumnDef<OOSData>[] {
  return [
    {
      id: 'oosDate',
      accessorKey: 'oosDate',
      header: 'OOS Date',
      cell: ({ row }) => formatDate(row.original.oosDate),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'oosType',
      accessorKey: 'oosType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className={typeColors[row.original.oosType] || ''}>
          {row.original.oosType}
        </Badge>
      ),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: [
        { value: 'DRIVER', label: 'Driver' },
        { value: 'VEHICLE', label: 'Vehicle' },
      ],
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
      id: 'truck',
      header: 'Truck',
      cell: ({ row }) => row.original.truck?.truckNumber ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'oosReason',
      accessorKey: 'oosReason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="max-w-[300px] truncate block">{row.original.oosReason}</span>
      ),
      defaultVisible: true,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColors[row.original.status] || ''}>
          {row.original.status}
        </Badge>
      ),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'CLOSED', label: 'Closed' },
      ],
    },
    {
      id: 'inspectorName',
      accessorKey: 'inspectorName',
      header: 'Inspector',
      cell: ({ row }) => row.original.inspectorName ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: false,
    },
    {
      id: 'resolvedAt',
      header: 'Resolved',
      cell: ({ row }) => row.original.resolvedAt ? formatDate(row.original.resolvedAt) : <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    ...(actions ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: OOSData } }) => {
        const order = row.original;
        if (order.status !== 'ACTIVE') return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onResolve && (
                <DropdownMenuItem onClick={() => actions.onResolve!(order)}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      defaultVisible: true,
    } as ExtendedColumnDef<OOSData>] : []),
  ];
}
