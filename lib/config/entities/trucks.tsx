import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField, CustomBulkAction } from '@/components/data-table/types';
import { TruckStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface TruckData {
  id: string;
  truckNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  equipmentType: string;
  status: TruckStatus;
  currentDrivers: Array<{
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  odometerReading: number | null | undefined;
  mcNumber?: {
    id: string;
    number: string;
  };
}

const statusColors: Record<TruckStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  IN_USE: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  MAINTENANCE_DUE: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  NEEDS_REPAIR: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

function formatStatus(status: TruckStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatEquipmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Column definitions
const columns: ExtendedColumnDef<TruckData>[] = [
  {
    id: 'truckNumber',
    accessorKey: 'truckNumber',
    header: 'Truck #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/trucks/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.truckNumber}
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
          {row.original.year} {row.original.make} {row.original.model}
        </div>
        <div className="text-sm text-muted-foreground">
          {row.original.vin ? `VIN: ${row.original.vin.slice(0, 8)}...` : ''}
        </div>
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'licensePlate',
    header: 'License Plate',
    cell: ({ row }) => `${row.original.licensePlate} (${row.original.state})`,
    defaultVisible: true,
  },
  {
    id: 'equipmentType',
    accessorKey: 'equipmentType',
    header: 'Equipment',
    cell: ({ row }) => formatEquipmentType(row.original.equipmentType),
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={statusColors[row.original.status]}>
        {formatStatus(row.original.status)}
      </Badge>
    ),
    defaultVisible: true,
  },
  {
    id: 'driver',
    header: 'Driver',
    cell: ({ row }) => {
      if (row.original.currentDrivers && row.original.currentDrivers.length > 0) {
        return (
          <div>
            {row.original.currentDrivers.map((driver) => (
              <Link
                key={driver.id}
                href={`/dashboard/drivers/${driver.id}`}
                className="text-primary hover:underline block"
              >
                {driver.user.firstName} {driver.user.lastName}
              </Link>
            ))}
          </div>
        );
      }
      return <span className="text-muted-foreground">Unassigned</span>;
    },
    defaultVisible: true,
  },
  {
    id: 'odometerReading',
    accessorKey: 'odometerReading',
    header: 'Odometer',
    cell: ({ row }) => {
      const reading = row.original.odometerReading;
      return reading != null ? reading.toLocaleString() : '—';
    },
    defaultVisible: true,
  },
  {
    id: 'vin',
    accessorKey: 'vin',
    header: 'VIN',
    defaultVisible: false,
  },
  {
    id: 'make',
    accessorKey: 'make',
    header: 'Make',
    defaultVisible: false,
  },
  {
    id: 'model',
    accessorKey: 'model',
    header: 'Model',
    defaultVisible: false,
  },
  {
    id: 'year',
    accessorKey: 'year',
    header: 'Year',
    defaultVisible: false,
  },
  {
    id: 'state',
    accessorKey: 'state',
    header: 'State',
    defaultVisible: false,
  },
  {
    id: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => row.original.mcNumber?.number || '—',
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
    options: Object.keys(TruckStatus).map((status) => ({
      value: status,
      label: formatStatus(status as TruckStatus),
    })),
    permission: 'trucks.edit',
  },
  {
    key: 'equipmentType',
    label: 'Equipment Type',
    type: 'text',
    permission: 'trucks.edit',
  },
];

// Custom bulk actions
const customBulkActions: CustomBulkAction[] = [
  // Add custom actions here if needed
  // Example: bulk assign to driver, bulk status change, etc.
];

// Create and export the configuration
export const trucksTableConfig = createEntityTableConfig<TruckData>({
  entityType: 'trucks',
  columns,
  defaultVisibleColumns: [
    'truckNumber',
    'vehicle',
    'licensePlate',
    'equipmentType',
    'status',
    'driver',
    'odometerReading',
  ],
  requiredColumns: ['truckNumber'],
  bulkEditFields,
  customBulkActions,
  defaultSort: [{ id: 'truckNumber', desc: false }],
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
      options: Object.keys(TruckStatus).map((status) => ({
        value: status,
        label: formatStatus(status as TruckStatus),
      })),
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
      key: 'equipmentType',
      label: 'Equipment Type',
      type: 'text',
    },
    {
      key: 'state',
      label: 'License State',
      type: 'text',
    },
  ],
});
