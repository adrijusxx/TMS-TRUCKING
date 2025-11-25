import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RateConfirmationData {
  id: string;
  loadId: string;
  invoiceId?: string | null;
  rateConfNumber?: string | null;
  baseRate: number;
  fuelSurcharge: number;
  accessorialCharges: number;
  totalRate: number;
  paymentTerms: number;
  paymentMethod?: string | null;
  matchedToInvoice: boolean;
  matchedAt?: Date | null;
  notes?: string | null;
  load: {
    id: string;
    loadNumber: string;
    customer: {
      name: string;
      customerNumber: string;
    };
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
  } | null;
  matchedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const columns: ExtendedColumnDef<RateConfirmationData>[] = [
  {
    id: 'rateConfNumber',
    accessorKey: 'rateConfNumber',
    header: 'Rate Conf #',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.rateConfNumber || `RC-${row.original.id.slice(0, 8)}`}
      </div>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'load',
    header: 'Load',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/loads/${row.original.load.id}`}
        className="text-primary hover:underline"
      >
        {row.original.load.loadNumber}
      </Link>
    ),
    defaultVisible: true,
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => row.original.load.customer.name,
    defaultVisible: true,
  },
  {
    id: 'totalRate',
    accessorKey: 'totalRate',
    header: 'Total Rate',
    cell: ({ row }) => formatCurrency(row.original.totalRate),
    defaultVisible: true,
  },
  {
    id: 'matchedToInvoice',
    accessorKey: 'matchedToInvoice',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.matchedToInvoice ? 'default' : 'outline'}>
        {row.original.matchedToInvoice ? 'Matched' : 'Unmatched'}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'invoice',
    header: 'Invoice',
    cell: ({ row }) =>
      row.original.invoice ? (
        <Link
          href={`/dashboard/invoices/${row.original.invoice.id}`}
          className="text-primary hover:underline"
        >
          {row.original.invoice.invoiceNumber}
        </Link>
      ) : (
        'N/A'
      ),
    defaultVisible: false,
  },
  {
    id: 'paymentTerms',
    accessorKey: 'paymentTerms',
    header: 'Payment Terms',
    cell: ({ row }) => `${row.original.paymentTerms} days`,
    defaultVisible: false,
  },
  {
    id: 'matchedAt',
    accessorKey: 'matchedAt',
    header: 'Matched At',
    cell: ({ row }) => (row.original.matchedAt ? formatDate(row.original.matchedAt) : 'N/A'),
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'paymentTerms',
    label: 'Payment Terms (days)',
    type: 'number',
    permission: 'rate_confirmations.edit',
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

export const rateConfirmationsTableConfig = createEntityTableConfig<RateConfirmationData>({
  entityType: 'rate-confirmations',
  columns,
  defaultVisibleColumns: [
    'rateConfNumber',
    'load',
    'customer',
    'totalRate',
    'matchedToInvoice',
  ],
  requiredColumns: ['rateConfNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'matchedAt', desc: true }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'matchedToInvoice',
      label: 'Matched Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Matched' },
        { value: 'false', label: 'Unmatched' },
      ],
    },
  ],
});

