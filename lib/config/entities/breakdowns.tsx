import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField, CustomBulkAction } from '@/components/data-table/types';
import { BreakdownStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface BreakdownData {
  id: string;
  breakdownNumber: string;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  load?: {
    id: string;
    loadNumber: string;
  } | null;
  driver?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  breakdownType: string;
  status: BreakdownStatus;
  priority: string;
  location: string;
  description: string;
  reportedAt: Date;
  totalCost: number;
  downtimeHours?: number | null;
  mcNumber?: {
    id: string;
    number: string;
    companyName: string;
  } | null;
}

function formatStatus(status: BreakdownStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusColor(status: BreakdownStatus): string {
  const colors: Record<BreakdownStatus, string> = {
    REPORTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    DISPATCHED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    WAITING_PARTS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

// Column definitions
const columns: ExtendedColumnDef<BreakdownData>[] = [
  {
    id: 'truck',
    header: 'Truck #',
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
    id: 'driver',
    header: 'Driver Name',
    cell: ({ row }) =>
      row.original.driver
        ? `${row.original.driver.user.firstName} ${row.original.driver.user.lastName}`
        : 'N/A',
    defaultVisible: true,
  },
  {
    id: 'reportedAt',
    accessorKey: 'reportedAt',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.reportedAt),
    defaultVisible: true,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Issue Description',
    cell: ({ row }) => (
      <div className="max-w-md truncate" title={row.original.description}>
        {row.original.description || 'N/A'}
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={getStatusColor(row.original.status)}>
        {formatStatus(row.original.status)}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'totalCost',
    accessorKey: 'totalCost',
    header: 'Cost',
    cell: ({ row }) => formatCurrency(row.original.totalCost),
    defaultVisible: true,
  },
  {
    id: 'downtimeHours',
    accessorKey: 'downtimeHours',
    header: 'Downtime',
    cell: ({ row }) =>
      row.original.downtimeHours
        ? `${row.original.downtimeHours.toFixed(1)} hrs`
        : 'N/A',
    defaultVisible: true,
  },
  {
    id: 'load',
    header: 'Load',
    cell: ({ row }) =>
      row.original.load ? (
        <Link
          href={`/dashboard/loads/${row.original.load.id}`}
          className="text-primary hover:underline"
        >
          {row.original.load.loadNumber}
        </Link>
      ) : (
        'N/A'
      ),
    defaultVisible: false,
  },
  {
    id: 'driver',
    header: 'Driver',
    cell: ({ row }) =>
      row.original.driver
        ? `${row.original.driver.user.firstName} ${row.original.driver.user.lastName}`
        : 'N/A',
    defaultVisible: false,
  },
  {
    id: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => row.original.mcNumber?.number || 'N/A',
    defaultVisible: false,
    permission: 'mc_numbers.view',
  },
];

// Bulk edit fields
const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.keys(BreakdownStatus).map((status) => ({
      value: status,
      label: formatStatus(status as BreakdownStatus),
    })),
    permission: 'breakdowns.edit',
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'HIGH', label: 'High' },
      { value: 'CRITICAL', label: 'Critical' },
    ],
    permission: 'breakdowns.edit',
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

// Custom bulk actions
const customBulkActions: CustomBulkAction[] = [];

// Create and export the configuration
export const breakdownsTableConfig = createEntityTableConfig<BreakdownData>({
  entityType: 'breakdowns',
  columns,
  defaultVisibleColumns: [
    'truck',
    'driver',
    'reportedAt',
    'description',
    'status',
    'totalCost',
  ],
  requiredColumns: ['breakdownNumber'],
  bulkEditFields,
  customBulkActions,
  defaultSort: [{ id: 'reportedAt', desc: true }],
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
      options: Object.keys(BreakdownStatus).map((status) => ({
        value: status,
        label: formatStatus(status as BreakdownStatus),
      })),
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'CRITICAL', label: 'Critical' },
      ],
    },
    {
      key: 'breakdownType',
      label: 'Breakdown Type',
      type: 'text',
    },
  ],
});

