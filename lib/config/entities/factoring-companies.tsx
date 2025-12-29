import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface FactoringCompanyData {
  id: string;
  name: string;
  accountNumber?: string | null;
  reservePercentage: number;
  reserveHoldDays: number;
  apiProvider?: string | null;
  exportFormat?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  _count?: {
    invoices: number;
    customers: number;
  };
}

const columns: ExtendedColumnDef<FactoringCompanyData>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Company Name',
    defaultVisible: true,
    required: true,
  },
  {
    id: 'accountNumber',
    accessorKey: 'accountNumber',
    header: 'Account #',
    cell: ({ row }) => row.original.accountNumber || 'N/A',
    defaultVisible: true,
  },
  {
    id: 'reservePercentage',
    accessorKey: 'reservePercentage',
    header: 'Reserve %',
    cell: ({ row }) => `${row.original.reservePercentage}%`,
    defaultVisible: true,
  },
  {
    id: 'reserveHoldDays',
    accessorKey: 'reserveHoldDays',
    header: 'Hold Days',
    cell: ({ row }) => `${row.original.reserveHoldDays} days`,
    defaultVisible: true,
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => (
      <div>
        {row.original.contactName && <div className="text-sm">{row.original.contactName}</div>}
        {row.original.contactEmail && (
          <div className="text-xs text-muted-foreground">{row.original.contactEmail}</div>
        )}
        {row.original.contactPhone && (
          <div className="text-xs text-muted-foreground">{row.original.contactPhone}</div>
        )}
        {!row.original.contactName && !row.original.contactEmail && !row.original.contactPhone && 'N/A'}
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'outline'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'stats',
    header: 'Usage',
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original._count?.invoices && (
          <div>Invoices: {row.original._count.invoices}</div>
        )}
        {row.original._count?.customers && (
          <div>Customers: {row.original._count.customers}</div>
        )}
      </div>
    ),
    defaultVisible: false,
  },
  {
    id: 'apiProvider',
    accessorKey: 'apiProvider',
    header: 'API Provider',
    defaultVisible: false,
  },
  {
    id: 'exportFormat',
    accessorKey: 'exportFormat',
    header: 'Export Format',
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'isActive',
    label: 'Active Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
    permission: 'factoring_companies.edit',
  },
  {
    key: 'reservePercentage',
    label: 'Reserve Percentage',
    type: 'number',
    permission: 'factoring_companies.edit',
  },
  {
    key: 'reserveHoldDays',
    label: 'Reserve Hold Days',
    type: 'number',
    permission: 'factoring_companies.edit',
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

export const factoringCompaniesTableConfig = createEntityTableConfig<FactoringCompanyData>({
  entityType: 'factoring-companies',
  columns,
  defaultVisibleColumns: [
    'name',
    'accountNumber',
    'reservePercentage',
    'reserveHoldDays',
    'contact',
    'isActive',
  ],
  requiredColumns: ['name'],
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
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ],
});

