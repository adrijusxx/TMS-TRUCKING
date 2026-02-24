'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Check, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ClaimData {
  id: string;
  claimNumber: string;
  claimType: string;
  dateOfLoss: string | Date;
  insuranceCompany: string;
  adjusterName?: string | null;
  status: string;
  hasPoliceReport: boolean;
  hasTowing: boolean;
  recordable: boolean;
  coverageType?: string | null;
  driver?: { id: string; user: { firstName: string; lastName: string } } | null;
  truck?: { id: string; truckNumber: string } | null;
  trailer?: { id: string; trailerNumber: string } | null;
  driverCompStatus?: string | null;
  driverAmount?: number | null;
  vendorCompStatus?: string | null;
  vendorAmount?: number | null;
  totalCharge?: number | null;
  totalFee?: number | null;
  incident?: { id: string; incidentNumber: string } | null;
}

export interface ClaimActions {
  onEdit?: (claim: ClaimData) => void;
  onDelete?: (claim: ClaimData) => void;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CLOSED: 'bg-green-100 text-green-800 border-green-200',
  DENIED: 'bg-gray-100 text-gray-800 border-gray-200',
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

export function createClaimsColumns(actions?: ClaimActions): ExtendedColumnDef<ClaimData>[] {
  return [
    {
      id: 'claimNumber',
      accessorKey: 'claimNumber',
      header: 'Claim #',
      cell: ({ row }) => <span className="font-medium">{row.original.claimNumber}</span>,
      defaultVisible: true,
      required: true,
    },
    {
      id: 'mcNumber',
      header: 'MC Number',
      cell: () => <span className="text-muted-foreground">-</span>,
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
      id: 'dateOfLoss',
      accessorKey: 'dateOfLoss',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.dateOfLoss),
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
        { value: 'OPEN', label: 'Open' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'CLOSED', label: 'Closed' },
        { value: 'DENIED', label: 'Denied' },
      ],
    },
    {
      id: 'adjusterName',
      accessorKey: 'adjusterName',
      header: 'Claim Adjuster',
      cell: ({ row }) => row.original.adjusterName ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'hasPoliceReport',
      header: 'Police Report',
      cell: ({ row }) => <BoolBadge value={row.original.hasPoliceReport} />,
      defaultVisible: true,
    },
    {
      id: 'hasTowing',
      header: 'Towing',
      cell: ({ row }) => <BoolBadge value={row.original.hasTowing} />,
      defaultVisible: true,
    },
    {
      id: 'recordable',
      header: 'Recordable',
      cell: ({ row }) => <BoolBadge value={row.original.recordable} />,
      defaultVisible: true,
    },
    {
      id: 'coverageType',
      header: 'Coverage Type',
      cell: ({ row }) => {
        const c = row.original.coverageType;
        if (!c) return <span className="text-muted-foreground">-</span>;
        return formatLabel(c);
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
      id: 'driverAmount',
      header: 'Driver Amount',
      cell: ({ row }) => formatCurrency(row.original.driverAmount ?? 0),
      defaultVisible: true,
    },
    {
      id: 'vendorCompStatus',
      header: 'Vendor Comp.',
      cell: ({ row }) => {
        const s = row.original.vendorCompStatus;
        if (!s) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="outline">{formatLabel(s)}</Badge>;
      },
      defaultVisible: true,
    },
    {
      id: 'vendorAmount',
      header: 'Vendor Amount',
      cell: ({ row }) => formatCurrency(row.original.vendorAmount ?? 0),
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
    ...(actions ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: ClaimData } }) => {
        const claim = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit!(claim)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem onClick={() => actions.onDelete!(claim)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      defaultVisible: true,
    } as ExtendedColumnDef<ClaimData>] : []),
  ];
}
