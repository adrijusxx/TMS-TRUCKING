import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { CustomerType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { EditableCell } from '@/components/ui/editable-cell';
import { formatCurrency } from '@/lib/utils';
import { updateEntityField } from '@/lib/utils/updateEntityField';

export interface CustomerData {
  id: string;
  customerNumber: string;
  name: string;
  type: CustomerType;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  warning: string | null;
  paymentTerms?: number;
  totalLoads?: number;
  totalRevenue?: number;
  createdAt: Date;
}

function formatCustomerType(type: CustomerType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const handleSave = async (rowId: string, columnId: string, value: string | number) => {
  await updateEntityField('customer', rowId, columnId, value);
};

const columns: ExtendedColumnDef<CustomerData>[] = [
  {
    id: 'customerNumber',
    accessorKey: 'customerNumber',
    header: 'Customer #',
    cell: ({ row }) => (
      <span className="text-primary hover:underline font-medium cursor-pointer">
        {row.original.customerNumber}
      </span>
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
    id: 'phone',
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.phone}
        rowId={row.original.id}
        columnId="phone"
        onSave={handleSave}
        type="text"
        placeholder="Enter phone number"
      />
    ),
    defaultVisible: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.email}
        rowId={row.original.id}
        columnId="email"
        onSave={handleSave}
        type="text"
        placeholder="Enter email"
      />
    ),
    defaultVisible: true,
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.address}
        rowId={row.original.id}
        columnId="address"
        onSave={handleSave}
        type="text"
        placeholder="Enter address"
      />
    ),
    defaultVisible: false,
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
    id: 'zip',
    accessorKey: 'zip',
    header: 'Zip',
    defaultVisible: false,
  },
  {
    id: 'paymentTerms',
    accessorKey: 'paymentTerms',
    header: 'Payment Terms',
    cell: ({ row }) => row.original.paymentTerms ? `${row.original.paymentTerms} days` : '—',
    defaultVisible: false,
  },
  {
    id: 'totalLoads',
    accessorKey: 'totalLoads',
    header: 'Total Loads',
    cell: ({ row }) => row.original.totalLoads ?? 0,
    defaultVisible: true,
  },
  {
    id: 'totalRevenue',
    accessorKey: 'totalRevenue',
    header: 'Total Revenue',
    cell: ({ row }) => row.original.totalRevenue ? formatCurrency(row.original.totalRevenue) : '—',
    defaultVisible: true,
  },
  {
    id: 'notes',
    accessorKey: 'warning',
    header: 'Notes',
    cell: ({ row }) => (
      <EditableCell
        value={row.original.warning || ''}
        rowId={row.original.id}
        columnId="warning"
        onSave={handleSave}
        type="text"
        placeholder="Enter notes"
      />
    ),
    defaultVisible: false,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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
    options: [],
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
    'phone',
    'email',
    'totalLoads',
    'totalRevenue',
  ],
  requiredColumns: ['customerNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'name', desc: false }],
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
      options: [],
      permission: 'mc_numbers.view',
    },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
  ],
});
