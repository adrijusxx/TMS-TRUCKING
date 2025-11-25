import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { CustomerType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface CustomerData {
  id: string;
  customerNumber: string;
  name: string;
  type: CustomerType;
  city: string;
  state: string;
  phone: string;
  email: string;
  paymentTerms: number;
  totalLoads: number;
  totalRevenue: number;
}

function formatCustomerType(type: CustomerType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const columns: ExtendedColumnDef<CustomerData>[] = [
  {
    id: 'customerNumber',
    accessorKey: 'customerNumber',
    header: 'Customer #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.customerNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    defaultVisible: true,
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">{formatCustomerType(row.original.type)}</Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'location',
    header: 'Location',
    cell: ({ row }) => `${row.original.city}, ${row.original.state}`,
    defaultVisible: true,
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => (
      <div>
        <div className="text-sm">{row.original.phone}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'paymentTerms',
    accessorKey: 'paymentTerms',
    header: 'Payment Terms',
    cell: ({ row }) => `${row.original.paymentTerms} days`,
    defaultVisible: false,
  },
  {
    id: 'totalLoads',
    accessorKey: 'totalLoads',
    header: 'Total Loads',
    defaultVisible: true,
  },
  {
    id: 'totalRevenue',
    accessorKey: 'totalRevenue',
    header: 'Total Revenue',
    cell: ({ row }) => formatCurrency(row.original.totalRevenue),
    defaultVisible: true,
  },
  {
    id: 'city',
    accessorKey: 'city',
    header: 'City',
    defaultVisible: false,
  },
  {
    id: 'state',
    accessorKey: 'state',
    header: 'State',
    defaultVisible: false,
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: 'Phone',
    defaultVisible: false,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: Object.keys(CustomerType).map((type) => ({
      value: type,
      label: formatCustomerType(type as CustomerType),
    })),
    permission: 'customers.edit',
  },
  {
    key: 'paymentTerms',
    label: 'Payment Terms (days)',
    type: 'number',
    permission: 'customers.edit',
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

export const customersTableConfig = createEntityTableConfig<CustomerData>({
  entityType: 'customers',
  columns,
  defaultVisibleColumns: [
    'customerNumber',
    'name',
    'type',
    'location',
    'contact',
    'totalLoads',
    'totalRevenue',
  ],
  requiredColumns: ['customerNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'customerNumber', desc: false }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    { key: 'type', label: 'Type', type: 'text' },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [], // Will be populated dynamically
      permission: 'mc_numbers.view',
    },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
  ],
});

