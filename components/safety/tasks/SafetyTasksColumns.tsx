'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Lock, Unlock, Paperclip, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SafetyTaskData {
  id: string;
  taskNumber: string;
  taskType: string;
  date: string | Date;
  mcNumber?: { id: string; number: string; companyName: string } | null;
  driver?: { id: string; user: { firstName: string; lastName: string } } | null;
  truck?: { id: string; truckNumber: string } | null;
  trailer?: { id: string; trailerNumber: string } | null;
  note?: string | null;
  documents?: Array<{ id: string }>;
  driverCompStatus?: string | null;
  status: string;
  driverAmount?: number | null;
  totalAmount?: number | null;
  isLocked: boolean;
  settlementId?: string | null;
  load?: { id: string; loadNumber: string } | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface SafetyTaskActions {
  onEdit?: (task: SafetyTaskData) => void;
  onDelete?: (task: SafetyTaskData) => void;
  onToggleLock?: (task: SafetyTaskData) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const typeColors: Record<string, string> = {
  ACCIDENT_CLAIM: 'bg-red-100 text-red-800 border-red-200',
  INSPECTION: 'bg-blue-100 text-blue-800 border-blue-200',
  CITATION: 'bg-orange-100 text-orange-800 border-orange-200',
  GENERAL: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatLabel(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function createSafetyTaskColumns(actions?: SafetyTaskActions): ExtendedColumnDef<SafetyTaskData>[] {
  return [
    {
      id: 'taskNumber',
      accessorKey: 'taskNumber',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-medium text-primary">{row.original.taskNumber}</span>
      ),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'date',
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.date),
      defaultVisible: true,
    },
    {
      id: 'mcNumber',
      header: 'MC Number',
      cell: ({ row }) => row.original.mcNumber?.companyName ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
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
      id: 'trailer',
      header: 'Trailer',
      cell: ({ row }) => row.original.trailer?.trailerNumber ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'note',
      accessorKey: 'note',
      header: 'Note',
      cell: ({ row }) => {
        const note = row.original.note;
        if (!note) return <span className="text-muted-foreground">-</span>;
        return <span className="truncate max-w-[200px] block">{note}</span>;
      },
      defaultVisible: true,
    },
    {
      id: 'attachments',
      header: 'Attachments',
      cell: ({ row }) => {
        const count = row.original.documents?.length || 0;
        if (!count) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" /> {count}
          </span>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'driverCompStatus',
      header: 'Driver Comp.',
      cell: ({ row }) => {
        const s = row.original.driverCompStatus;
        if (!s) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="outline">{formatLabel(s)}</Badge>;
      },
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
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
    {
      id: 'driverAmount',
      header: 'Driver Amount',
      cell: ({ row }) => formatCurrency(row.original.driverAmount ?? 0),
      defaultVisible: true,
    },
    {
      id: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => formatCurrency(row.original.totalAmount ?? 0),
      defaultVisible: true,
    },
    {
      id: 'isLocked',
      header: 'Locked',
      cell: ({ row }) =>
        row.original.isLocked ? (
          <Lock className="h-4 w-4 text-red-500" />
        ) : (
          <Unlock className="h-4 w-4 text-muted-foreground" />
        ),
      defaultVisible: true,
    },
    {
      id: 'settlement',
      header: 'Settlement',
      cell: ({ row }) => {
        const s = row.original.settlementId;
        if (!s) return <span className="text-muted-foreground">-</span>;
        return <Link href={`/dashboard/settlements/${s}`} className="text-primary hover:underline">View</Link>;
      },
      defaultVisible: false,
    },
    {
      id: 'load',
      header: 'Load',
      cell: ({ row }) => {
        const l = row.original.load;
        if (!l) return <span className="text-muted-foreground">-</span>;
        return <Link href={`/dashboard/loads/${l.id}`} className="text-primary hover:underline">{l.loadNumber}</Link>;
      },
      defaultVisible: false,
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.location ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: false,
    },
    {
      id: 'city',
      accessorKey: 'city',
      header: 'City',
      cell: ({ row }) => row.original.city ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'state',
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => row.original.state ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'taskType',
      accessorKey: 'taskType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className={typeColors[row.original.taskType] || ''}>
          {formatLabel(row.original.taskType)}
        </Badge>
      ),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ACCIDENT_CLAIM', label: 'Accident / Claim' },
        { value: 'INSPECTION', label: 'Inspection' },
        { value: 'CITATION', label: 'Citation' },
        { value: 'GENERAL', label: 'General' },
      ],
    },
    ...(actions ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: SafetyTaskData } }) => {
        const task = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit!(task)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {actions.onToggleLock && (
                <DropdownMenuItem onClick={() => actions.onToggleLock!(task)}>
                  {task.isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  {task.isLocked ? 'Unlock' : 'Lock'}
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem onClick={() => actions.onDelete!(task)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      defaultVisible: true,
    } as ExtendedColumnDef<SafetyTaskData>] : []),
  ];
}
