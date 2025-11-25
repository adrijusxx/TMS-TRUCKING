import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface MaintenanceData {
  id: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  scheduledDate: Date | null;
  completedDate: Date | null;
  vendor: string | null;
  invoiceNumber: string | null;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  createdAt: Date;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    OIL_CHANGE: 'bg-blue-100 text-blue-800',
    REPAIR: 'bg-red-100 text-red-800',
    INSPECTION: 'bg-green-100 text-green-800',
    PMI: 'bg-purple-100 text-purple-800',
    ENGINE: 'bg-orange-100 text-orange-800',
    TRANSMISSION: 'bg-yellow-100 text-yellow-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

const columns: ExtendedColumnDef<MaintenanceData>[] = [
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className={getTypeColor(row.original.type)}>
        {formatType(row.original.type)}
      </Badge>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'truck',
    header: 'Truck',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/trucks/${row.original.truck.id}`}
        className="text-primary hover:underline"
      >
        {row.original.truck.truckNumber}
      </Link>
    ),
    defaultVisible: true,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    defaultVisible: true,
  },
  {
    id: 'cost',
    accessorKey: 'cost',
    header: 'Cost',
    cell: ({ row }) => formatCurrency(row.original.cost),
    defaultVisible: true,
  },
  {
    id: 'mileage',
    accessorKey: 'mileage',
    header: 'Mileage',
    cell: ({ row }) => row.original.mileage.toLocaleString(),
    defaultVisible: true,
  },
  {
    id: 'scheduledDate',
    accessorKey: 'scheduledDate',
    header: 'Scheduled',
    cell: ({ row }) => (row.original.scheduledDate ? formatDate(row.original.scheduledDate) : 'N/A'),
    defaultVisible: true,
  },
  {
    id: 'completedDate',
    accessorKey: 'completedDate',
    header: 'Completed',
    cell: ({ row }) => (row.original.completedDate ? formatDate(row.original.completedDate) : 'Pending'),
    defaultVisible: true,
  },
  {
    id: 'vendor',
    accessorKey: 'vendor',
    header: 'Vendor',
    cell: ({ row }) => row.original.vendor || 'N/A',
    defaultVisible: false,
  },
  {
    id: 'invoiceNumber',
    accessorKey: 'invoiceNumber',
    header: 'Invoice #',
    cell: ({ row }) => row.original.invoiceNumber || 'N/A',
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'text',
    permission: 'maintenance.edit',
  },
  {
    key: 'vendor',
    label: 'Vendor',
    type: 'text',
    permission: 'maintenance.edit',
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

export const maintenanceTableConfig = createEntityTableConfig<MaintenanceData>({
  entityType: 'maintenance',
  columns,
  defaultVisibleColumns: ['type', 'truck', 'description', 'cost', 'mileage', 'scheduledDate', 'completedDate'],
  requiredColumns: ['type'],
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
    { key: 'type', label: 'Type', type: 'text' },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [], // Will be populated dynamically
      permission: 'mc_numbers.view',
    },
    { key: 'truckId', label: 'Truck', type: 'text' },
  ],
});

