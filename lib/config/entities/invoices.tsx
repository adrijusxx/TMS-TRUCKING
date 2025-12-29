import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { InvoiceStatus, InvoiceSubStatus, FactoringStatus, PaymentMethod } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateAgingDays } from '@/lib/utils/aging';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  loadId?: string | null;
  customer: {
    id: string;
    name: string;
    customerNumber: string;
  };
  invoiceDate: string;
  dueDate: string;
  total: number;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  paidAmount?: number;
  balance?: number;
  mcNumber?: string | null;
  subStatus?: InvoiceSubStatus | null;
  reconciliationStatus?: string;
  factoringStatus?: FactoringStatus;
  paymentMethod?: PaymentMethod | null;
  factoringCompany?: {
    id: string;
    name: string;
  } | null;
  agingDays?: number;
  agingStatus?: 'NOT_OVERDUE' | 'OVERDUE';
  accrual?: number;
}

function formatStatus(status: InvoiceStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  INVOICED: 'bg-purple-100 text-purple-800 border-purple-200',
  POSTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const columns: ExtendedColumnDef<InvoiceData>[] = [
  {
    id: 'invoiceNumber',
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/invoices/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.invoiceNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'loadId',
    accessorKey: 'loadId',
    header: 'Load #',
    cell: ({ row }) =>
      row.original.loadId ? (
        <Link
          href={`/dashboard/loads/${row.original.loadId}`}
          className="text-primary hover:underline"
        >
          {row.original.loadId}
        </Link>
      ) : (
        '—'
      ),
    defaultVisible: true,
  },
  {
    id: 'customer',
    header: 'Broker Name',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.customer.id}`}
        className="text-primary hover:underline"
      >
        {row.original.customer.name}
      </Link>
    ),
    defaultVisible: true,
  },
  {
    id: 'total',
    accessorKey: 'total',
    header: 'Total Amount',
    cell: ({ row }) => formatCurrency(row.original.total),
    defaultVisible: false,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const displayStatus = row.original.status === 'DRAFT' ? 'Draft' :
                            row.original.status === 'SENT' ? 'Sent' :
                            row.original.status === 'PAID' ? 'Paid' :
                            formatStatus(row.original.status);
      return (
        <Badge variant="outline" className={statusColors[row.original.status]}>
          {displayStatus}
        </Badge>
      );
    },
    defaultVisible: true,
  },
  {
    id: 'invoiceDate',
    accessorKey: 'invoiceDate',
    header: 'Date',
    cell: ({ row }) => formatDate(new Date(row.original.invoiceDate)),
    defaultVisible: true,
  },
  {
    id: 'balance',
    accessorKey: 'balance',
    header: 'Balance due',
    cell: ({ row }) => formatCurrency(row.original.balance || row.original.total - (row.original.paidAmount || 0)),
    defaultVisible: true,
  },
  {
    id: 'paidAmount',
    accessorKey: 'paidAmount',
    header: 'Paid',
    cell: ({ row }) => formatCurrency(row.original.paidAmount || 0),
    defaultVisible: true,
  },
  {
    id: 'subStatus',
    accessorKey: 'subStatus',
    header: 'Sub Status',
    cell: ({ row }) => row.original.subStatus || '—',
    defaultVisible: true,
  },
  {
    id: 'agingDays',
    accessorKey: 'agingDays',
    header: 'Aging days',
    cell: ({ row }) => {
      const days = row.original.agingDays ?? calculateAgingDays(row.original.dueDate);
      return days;
    },
    defaultVisible: true,
  },
  {
    id: 'agingStatus',
    accessorKey: 'agingStatus',
    header: 'Aging status',
    cell: ({ row }) => {
      const days = row.original.agingDays ?? calculateAgingDays(row.original.dueDate);
      const status = row.original.agingStatus ?? (days <= 0 ? 'NOT_OVERDUE' : 'OVERDUE');
      const isOverdue = status === 'OVERDUE' || days > 0;
      return (
        <Badge
          variant="outline"
          className={
            isOverdue
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-green-100 text-green-800 border-green-200'
          }
        >
          {status === 'NOT_OVERDUE' ? 'NOT OVERDUE' : 'OVERDUE'}
        </Badge>
      );
    },
    defaultVisible: true,
  },
  {
    id: 'accrual',
    accessorKey: 'accrual',
    header: 'Accrual',
    cell: ({ row }) => formatCurrency(row.original.accrual ?? row.original.total),
    defaultVisible: true,
  },
  {
    id: 'factoringStatus',
    accessorKey: 'factoringStatus',
    header: 'Factoring Status',
    cell: ({ row }) => row.original.factoringStatus || '—',
    defaultVisible: false,
  },
  {
    id: 'paymentMethod',
    accessorKey: 'paymentMethod',
    header: 'Payment Method',
    cell: ({ row }) => row.original.paymentMethod || '—',
    defaultVisible: false,
  },
  {
    id: 'mcNumber',
    accessorKey: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => row.original.mcNumber ?? '—',
    defaultVisible: true,
    permission: 'mc_numbers.view',
  },
  {
    id: 'reconciliationStatus',
    accessorKey: 'reconciliationStatus',
    header: 'Reconciliation status',
    cell: ({ row }) => (
      <span className={row.original.reconciliationStatus === 'Not reconciled' ? 'text-red-600' : ''}>
        {row.original.reconciliationStatus || 'Not reconciled'}
      </span>
    ),
    defaultVisible: true,
  },
  {
    id: 'loadIdDetail',
    accessorKey: 'loadId',
    header: 'Load ID',
    cell: ({ row }) =>
      row.original.loadId ? (
        <Link
          href={`/dashboard/loads/${row.original.loadId}`}
          className="text-primary hover:underline"
        >
          {row.original.loadId}
        </Link>
      ) : (
        '—'
      ),
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.keys(InvoiceStatus).map((status) => ({
      value: status,
      label: formatStatus(status as InvoiceStatus),
    })),
    permission: 'invoices.edit',
  },
  {
    key: 'subStatus',
    label: 'Sub Status',
    type: 'select',
    options: Object.keys(InvoiceSubStatus).map((status) => ({
      value: status,
      label: status,
    })),
    permission: 'invoices.edit',
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

export const invoicesTableConfig = createEntityTableConfig<InvoiceData>({
  entityType: 'invoices',
  columns,
  defaultVisibleColumns: [
    'customer',
    'invoiceNumber',
    'loadId',
    'mcNumber',
    'invoiceDate',
    'status',
    'subStatus',
    'agingDays',
    'agingStatus',
    'accrual',
    'paidAmount',
    'balance',
    'reconciliationStatus',
  ],
  requiredColumns: ['invoiceNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'invoiceDate', desc: true }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: Object.keys(InvoiceStatus).map((status) => ({
        value: status,
        label: formatStatus(status as InvoiceStatus),
      })),
    },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [], // Will be populated dynamically
      permission: 'mc_numbers.view',
    },
    {
      key: 'customerId',
      label: 'Customer',
      type: 'text',
    },
  ],
});

