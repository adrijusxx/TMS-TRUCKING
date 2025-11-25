import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { InspectionStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface InspectionData {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  inspectionDate: Date;
  status: InspectionStatus;
  defects: number;
  oosStatus: boolean;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  nextInspectionDue?: Date | null;
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusColor(status: InspectionStatus): string {
  const colors: Record<InspectionStatus, string> = {
    PASSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CONDITIONAL: 'bg-yellow-100 text-yellow-800',
    OUT_OF_SERVICE: 'bg-red-100 text-red-800',
    PENDING: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

const columns: ExtendedColumnDef<InspectionData>[] = [
  {
    id: 'inspectionNumber',
    accessorKey: 'inspectionNumber',
    header: 'Inspection #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/fleet/inspections/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.inspectionNumber}
      </Link>
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
    id: 'inspectionType',
    accessorKey: 'inspectionType',
    header: 'Type',
    cell: ({ row }) => formatType(row.original.inspectionType),
    defaultVisible: true,
  },
  {
    id: 'inspectionDate',
    accessorKey: 'inspectionDate',
    header: 'Date',
    cell: ({ row }) => formatDate(row.original.inspectionDate),
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={getStatusColor(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'defects',
    accessorKey: 'defects',
    header: 'Defects',
    cell: ({ row }) => (
      <Badge variant={row.original.defects > 0 ? 'destructive' : 'outline'}>
        {row.original.defects}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'oosStatus',
    accessorKey: 'oosStatus',
    header: 'OOS',
    cell: ({ row }) => (
      <Badge variant={row.original.oosStatus ? 'destructive' : 'outline'}>
        {row.original.oosStatus ? 'Yes' : 'No'}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'nextInspectionDue',
    accessorKey: 'nextInspectionDue',
    header: 'Next Due',
    cell: ({ row }) => (row.original.nextInspectionDue ? formatDate(row.original.nextInspectionDue) : 'N/A'),
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
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.keys(InspectionStatus).map((status) => ({
      value: status,
      label: status,
    })),
    permission: 'inspections.edit',
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

export const inspectionsTableConfig = createEntityTableConfig<InspectionData>({
  entityType: 'inspections',
  columns,
  defaultVisibleColumns: [
    'inspectionNumber',
    'truck',
    'inspectionType',
    'inspectionDate',
    'status',
    'defects',
    'oosStatus',
  ],
  requiredColumns: ['inspectionNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'inspectionDate', desc: true }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    { key: 'inspectionType', label: 'Type', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'truckId', label: 'Truck', type: 'text' },
  ],
});

