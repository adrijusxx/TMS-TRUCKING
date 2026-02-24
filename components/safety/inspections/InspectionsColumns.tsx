'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export interface InspectionData {
  id: string;
  driverName?: string | null;
  inspectionReport?: string | null;
  mcNumber?: string | null;
  inspectionLevel: string;
  inspectionDate: string | Date;
  violationType?: string | null;
  recordable: boolean;
  status?: string | null;
  truckNumber?: string | null;
  trailerNumber?: string | null;
  totalCharge?: number | null;
  totalFee?: number | null;
  note?: string | null;
  violationsFound: boolean;
  outOfService: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
};

function formatLabel(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function createInspectionsColumns(): ExtendedColumnDef<InspectionData>[] {
  return [
    {
      id: 'driverName',
      header: 'Inspected to',
      cell: ({ row }) => row.original.driverName ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
      required: true,
    },
    {
      id: 'inspectionReport',
      header: 'Inspection report',
      cell: ({ row }) => row.original.inspectionReport ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'mcNumber',
      header: 'MC Number',
      cell: ({ row }) => row.original.mcNumber ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'inspectionLevel',
      accessorKey: 'inspectionLevel',
      header: 'Inspection Level',
      cell: ({ row }) => formatLabel(row.original.inspectionLevel),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: [
        { value: 'LEVEL_1', label: 'Level 1' },
        { value: 'LEVEL_2', label: 'Level 2' },
        { value: 'LEVEL_3', label: 'Level 3' },
        { value: 'LEVEL_5', label: 'Level 5' },
        { value: 'LEVEL_6', label: 'Level 6' },
      ],
    },
    {
      id: 'inspectionDate',
      accessorKey: 'inspectionDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.inspectionDate),
      defaultVisible: true,
    },
    {
      id: 'violationType',
      header: 'Violation type',
      cell: ({ row }) => {
        const v = row.original.violationType;
        if (!v) return <span className="text-muted-foreground">-</span>;
        return v;
      },
      defaultVisible: true,
    },
    {
      id: 'recordable',
      header: 'Recordable',
      cell: ({ row }) =>
        row.original.recordable ? (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Yes</Badge>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
      defaultVisible: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        if (!s) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant="outline" className={statusColors[s] || ''}>
            {formatLabel(s)}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'truck',
      header: 'Truck',
      cell: ({ row }) => row.original.truckNumber ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'trailer',
      header: 'Trailer',
      cell: ({ row }) => row.original.trailerNumber ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'totalCharge',
      header: 'Total Charge',
      cell: ({ row }) => formatCurrency(row.original.totalCharge ?? 0),
      defaultVisible: true,
    },
    {
      id: 'totalFee',
      header: 'Total Fee',
      cell: ({ row }) => formatCurrency(row.original.totalFee ?? 0),
      defaultVisible: true,
    },
    {
      id: 'note',
      header: 'Note',
      cell: ({ row }) => {
        const n = row.original.note;
        if (!n) return <span className="text-muted-foreground">-</span>;
        return <span className="truncate max-w-[200px] block">{n}</span>;
      },
      defaultVisible: true,
    },
  ];
}
