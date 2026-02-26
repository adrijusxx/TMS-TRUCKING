'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, Pencil, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface PolicyData {
  id: string;
  policyName: string;
  category: string;
  content: string;
  version: number;
  effectiveDate: string | Date;
  distributedAt?: string | Date | null;
  acknowledgments: Array<{
    id: string;
    status: string;
    acknowledgedAt?: string | Date | null;
    driver: { id: string; user: { firstName: string; lastName: string } };
  }>;
}

export interface PolicyActions {
  onEdit?: (policy: PolicyData) => void;
  onDelete?: (policy: PolicyData) => void;
  onDistribute?: (policy: PolicyData) => void;
}

const categoryLabels: Record<string, string> = {
  ACCIDENT_PROCEDURES: 'Accident Procedures',
  DRUG_ALCOHOL_POLICY: 'Drug & Alcohol',
  VEHICLE_USE_POLICY: 'Vehicle Use',
  PERSONAL_CONDUCT: 'Personal Conduct',
  OTHER: 'Other',
};

export function createPoliciesColumns(actions?: PolicyActions): ExtendedColumnDef<PolicyData>[] {
  return [
    {
      id: 'policyName',
      accessorKey: 'policyName',
      header: 'Policy Name',
      cell: ({ row }) => <span className="font-medium">{row.original.policyName}</span>,
      defaultVisible: true,
      required: true,
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">{categoryLabels[row.original.category] ?? row.original.category}</Badge>
      ),
      defaultVisible: true,
      filterType: 'select',
      filterOptions: Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
    },
    {
      id: 'version',
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => `v${row.original.version}`,
      defaultVisible: true,
    },
    {
      id: 'effectiveDate',
      accessorKey: 'effectiveDate',
      header: 'Effective Date',
      cell: ({ row }) => formatDate(row.original.effectiveDate),
      defaultVisible: true,
    },
    {
      id: 'distributed',
      header: 'Distributed',
      cell: ({ row }) => row.original.distributedAt
        ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{formatDate(row.original.distributedAt)}</Badge>
        : <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Not sent</Badge>,
      defaultVisible: true,
    },
    {
      id: 'acknowledgments',
      header: 'Acknowledged',
      cell: ({ row }) => {
        const acks = row.original.acknowledgments;
        if (acks.length === 0) return <span className="text-muted-foreground">-</span>;
        const done = acks.filter((a) => a.status === 'ACKNOWLEDGED').length;
        return (
          <Badge variant="outline" className={done === acks.length ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
            {done}/{acks.length}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    ...(actions ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: PolicyData } }) => {
        const policy = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onDistribute && (
                <DropdownMenuItem onClick={() => actions.onDistribute!(policy)}>
                  <Send className="h-4 w-4 mr-2" /> Distribute
                </DropdownMenuItem>
              )}
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit!(policy)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem onClick={() => actions.onDelete!(policy)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      defaultVisible: true,
    } as ExtendedColumnDef<PolicyData>] : []),
  ];
}
