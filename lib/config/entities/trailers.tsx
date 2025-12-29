import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField, CustomBulkAction } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import McBadge from '@/components/mc-numbers/McBadge';

interface TrailerData {
  id: string;
  trailerNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  state: string | null;
  mcNumber: {
    id: string;
    number: string;
    companyName: string;
  } | null;
  type: string | null;
  ownership: string | null;
  ownerName: string | null;
  status: string | null;
  fleetStatus: string | null;
  assignedTruck: {
    id: string;
    truckNumber: string;
  } | null;
  operatorDriver: {
    id: string;
    driverNumber: string;
    name: string;
  } | null;
  loadCount: number;
  activeLoads: number;
  lastUsed: Date | null;
  registrationExpiry: Date | null;
  insuranceExpiry: Date | null;
  inspectionExpiry: Date | null;
}

// Column definitions
const columns: ExtendedColumnDef<TrailerData>[] = [
  {
    id: 'trailerNumber',
    accessorKey: 'trailerNumber',
    header: 'Trailer #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/trailers/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.trailerNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'vehicle',
    header: 'Vehicle',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.year ? `${row.original.year} ` : ''}
          {row.original.make} {row.original.model}
        </div>
        {row.original.vin && (
          <div className="text-sm text-muted-foreground">
            VIN: {row.original.vin.slice(0, 8)}...
          </div>
        )}
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'licensePlate',
    header: 'License Plate',
    cell: ({ row }) =>
      row.original.licensePlate
        ? `${row.original.licensePlate}${row.original.state ? ` (${row.original.state})` : ''}`
        : '—',
    defaultVisible: true,
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => row.original.type || '—',
    defaultVisible: true,
  },
  {
    id: 'assignedTruck',
    header: 'Assigned Truck',
    cell: ({ row }) => {
      if (row.original.assignedTruck) {
        return (
          <Link
            href={`/dashboard/trucks/${row.original.assignedTruck.id}`}
            className="text-primary hover:underline"
          >
            {row.original.assignedTruck.truckNumber}
          </Link>
        );
      }
      return <span className="text-muted-foreground">Unassigned</span>;
    },
    defaultVisible: true,
  },
  {
    id: 'loadCount',
    accessorKey: 'loadCount',
    header: 'Total Loads',
    cell: ({ row }) => row.original.loadCount,
    defaultVisible: true,
  },
  {
    id: 'activeLoads',
    accessorKey: 'activeLoads',
    header: 'Active Loads',
    cell: ({ row }) => (
      <Badge variant={row.original.activeLoads > 0 ? 'default' : 'outline'}>
        {row.original.activeLoads}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => row.original.status || '—',
    defaultVisible: false,
  },
  {
    id: 'fleetStatus',
    accessorKey: 'fleetStatus',
    header: 'Fleet Status',
    cell: ({ row }) => row.original.fleetStatus || '—',
    defaultVisible: false,
  },
  {
    id: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => {
      const mcNumber = row.original.mcNumber;
      if (!mcNumber) {
        return '—';
      }
      return (
        <McBadge
          mcNumber={mcNumber.number}
          mcNumberId={mcNumber.id}
          companyName={mcNumber.companyName}
          size="sm"
        />
      );
    },
    defaultVisible: false,
    permission: 'mc_numbers.view',
  },
  {
    id: 'ownership',
    accessorKey: 'ownership',
    header: 'Ownership',
    cell: ({ row }) => row.original.ownership || '—',
    defaultVisible: false,
  },
  {
    id: 'lastUsed',
    accessorKey: 'lastUsed',
    header: 'Last Used',
    cell: ({ row }) => (row.original.lastUsed ? formatDate(row.original.lastUsed) : 'Never'),
    defaultVisible: false,
  },
  {
    id: 'registrationExpiry',
    accessorKey: 'registrationExpiry',
    header: 'Registration Expiry',
    cell: ({ row }) =>
      row.original.registrationExpiry ? formatDate(row.original.registrationExpiry) : '—',
    defaultVisible: false,
  },
  {
    id: 'insuranceExpiry',
    accessorKey: 'insuranceExpiry',
    header: 'Insurance Expiry',
    cell: ({ row }) =>
      row.original.insuranceExpiry ? formatDate(row.original.insuranceExpiry) : '—',
    defaultVisible: false,
  },
  {
    id: 'inspectionExpiry',
    accessorKey: 'inspectionExpiry',
    header: 'Inspection Expiry',
    cell: ({ row }) =>
      row.original.inspectionExpiry ? formatDate(row.original.inspectionExpiry) : '—',
    defaultVisible: false,
  },
];

// Bulk edit fields
const bulkEditFields: BulkEditField[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'text',
    permission: 'trailers.edit',
  },
  {
    key: 'ownership',
    label: 'Ownership',
    type: 'text',
    permission: 'trailers.edit',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'text',
    permission: 'trailers.edit',
  },
  {
    key: 'fleetStatus',
    label: 'Fleet Status',
    type: 'text',
    permission: 'trailers.edit',
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
export const trailersTableConfig = createEntityTableConfig<TrailerData>({
  entityType: 'trailers',
  columns,
  defaultVisibleColumns: [
    'trailerNumber',
    'vehicle',
    'licensePlate',
    'type',
    'assignedTruck',
    'loadCount',
    'activeLoads',
  ],
  requiredColumns: ['trailerNumber'],
  bulkEditFields,
  customBulkActions,
  defaultSort: [{ id: 'trailerNumber', desc: false }],
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'type',
      label: 'Type',
      type: 'text',
    },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [], // Will be populated dynamically
      permission: 'mc_numbers.view',
    },
    {
      key: 'make',
      label: 'Make',
      type: 'text',
    },
    {
      key: 'model',
      label: 'Model',
      type: 'text',
    },
    {
      key: 'state',
      label: 'License State',
      type: 'text',
    },
    {
      key: 'ownership',
      label: 'Ownership',
      type: 'text',
    },
  ],
});

