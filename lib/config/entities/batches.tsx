import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { BatchPostStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BatchData {
  id: string;
  batchNumber: string;
  postStatus: BatchPostStatus;
  mcNumber: string | null;
  totalAmount: number;
  invoiceCount: number;
  notes: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function formatStatus(status: BatchPostStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const statusColors: Record<BatchPostStatus, string> = {
  UNPOSTED: 'bg-orange-100 text-orange-800 border-orange-200',
  POSTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
};

const columns: ExtendedColumnDef<BatchData>[] = [
  {
    id: 'batchNumber',
    accessorKey: 'batchNumber',
    header: 'Batch #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/accounting/batches/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.batchNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'postStatus',
    accessorKey: 'postStatus',
    header: 'Post status',
    cell: ({ row }) => (
      <Badge variant="outline" className={statusColors[row.original.postStatus]}>
        {formatStatus(row.original.postStatus)}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'mcNumber',
    accessorKey: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => row.original.mcNumber ?? 'N/A',
    defaultVisible: false,
    permission: 'mc_numbers.view',
  },
  {
    id: 'invoiceCount',
    accessorKey: 'invoiceCount',
    header: 'Invoices',
    defaultVisible: true,
  },
  {
    id: 'totalAmount',
    accessorKey: 'totalAmount',
    header: 'Total Amount',
    cell: ({ row }) => formatCurrency(row.original.totalAmount),
    defaultVisible: true,
  },
  {
    id: 'createdBy',
    header: 'Created by',
    cell: ({ row }) =>
      `${row.original.createdBy.firstName} ${row.original.createdBy.lastName}`,
    defaultVisible: true,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created date',
    cell: ({ row }) => formatDate(new Date(row.original.createdAt)),
    defaultVisible: true,
  },
  {
    id: 'notes',
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => row.original.notes || 'N/A',
    defaultVisible: true,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'postStatus',
    label: 'Post Status',
    type: 'select',
    options: Object.keys(BatchPostStatus).map((status) => ({
      value: status,
      label: formatStatus(status as BatchPostStatus),
    })),
    permission: 'batches.edit',
  },
  {
    key: 'mcNumberId',
    label: 'MC Number',
    type: 'select',
    options: [], // Will be populated dynamically by BulkEditDialog
    permission: 'mc_numbers.edit',
    placeholder: 'Select MC number',
  },
];

export const batchesTableConfig = createEntityTableConfig<BatchData>({
  entityType: 'batches',
  columns,
  defaultVisibleColumns: [
    'batchNumber',
    'postStatus',
    'createdBy',
    'createdAt',
    'invoiceCount',
    'mcNumber',
    'totalAmount',
    'notes',
  ],
  requiredColumns: ['batchNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'createdAt', desc: true }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'postStatus',
      label: 'Post Status',
      type: 'select',
      options: Object.keys(BatchPostStatus).map((status) => ({
        value: status,
        label: formatStatus(status as BatchPostStatus),
      })),
    },
  ],
});

