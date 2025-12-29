import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface VendorData {
  id: string;
  vendorNumber: string;
  name: string;
  type: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentTerms: number;
  creditLimit?: number | null;
  contacts?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const columns: ExtendedColumnDef<VendorData>[] = [
  {
    id: 'vendorNumber',
    accessorKey: 'vendorNumber',
    header: 'Vendor #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/vendors/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.vendorNumber}
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
      <Badge variant="outline">{formatType(row.original.type)}</Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'address',
    header: 'Address',
    cell: ({ row }) => {
      if (row.original.address || row.original.city || row.original.state) {
        return (
          <div>
            {row.original.address && <div>{row.original.address}</div>}
            {(row.original.city || row.original.state) && (
              <div className="text-sm text-muted-foreground">
                {row.original.city}
                {row.original.city && row.original.state ? ', ' : ''}
                {row.original.state} {row.original.zip}
              </div>
            )}
          </div>
        );
      }
      return 'N/A';
    },
    defaultVisible: true,
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => {
      const primaryContact = row.original.contacts?.find((c) => c.isPrimary) || row.original.contacts?.[0];
      if (primaryContact) {
        return (
          <div>
            <div className="text-sm">{primaryContact.name}</div>
            {primaryContact.phone && (
              <div className="text-xs text-muted-foreground">{primaryContact.phone}</div>
            )}
            {primaryContact.email && (
              <div className="text-xs text-muted-foreground">{primaryContact.email}</div>
            )}
          </div>
        );
      }
      if (row.original.phone || row.original.email) {
        return (
          <div>
            {row.original.phone && <div className="text-sm">{row.original.phone}</div>}
            {row.original.email && <div className="text-xs text-muted-foreground">{row.original.email}</div>}
          </div>
        );
      }
      return 'N/A';
    },
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
    id: 'creditLimit',
    accessorKey: 'creditLimit',
    header: 'Credit Limit',
    cell: ({ row }) => row.original.creditLimit ? `$${row.original.creditLimit.toLocaleString()}` : 'N/A',
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
    type: 'text',
    permission: 'vendors.edit',
  },
  {
    key: 'paymentTerms',
    label: 'Payment Terms (days)',
    type: 'number',
    permission: 'vendors.edit',
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

export const vendorsTableConfig = createEntityTableConfig<VendorData>({
  entityType: 'vendors',
  columns,
  defaultVisibleColumns: ['vendorNumber', 'name', 'type', 'address', 'contact'],
  requiredColumns: ['vendorNumber'],
  bulkEditFields,
  customBulkActions: [],
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
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
  ],
});

