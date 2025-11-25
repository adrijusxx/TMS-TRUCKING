import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { LoadStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import McBadge from '@/components/mc-numbers/McBadge';

interface LoadData {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  mcNumber?: string | {
    id: string;
    number: string;
    companyName?: string;
  } | null;
  customer: {
    id: string;
    name: string;
    customerNumber: string;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  truck?: {
    id: string;
    truckNumber: string;
  };
  dispatcher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  pickupLocation?: string | null;
  pickupCity: string;
  pickupState: string;
  pickupDate: Date | null;
  deliveryLocation?: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryDate: Date | null;
  revenue: number;
  driverPay: number;
  profit: number;
  miles: number;
  weight: number | null;
}

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Type guard for MC number object
function isMcNumberObject(
  mcNumber: string | { id: string; number: string; companyName?: string } | null | undefined
): mcNumber is { id: string; number: string; companyName?: string } {
  return typeof mcNumber === 'object' && mcNumber !== null && 'number' in mcNumber;
}

const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-blue-100 text-blue-800 border-blue-200',
  LOADED: 'bg-green-100 text-green-800 border-green-200',
  EN_ROUTE_DELIVERY: 'bg-teal-100 text-teal-800 border-teal-200',
  AT_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INVOICED: 'bg-lime-100 text-lime-800 border-lime-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const columns: ExtendedColumnDef<LoadData>[] = [
  {
    id: 'loadNumber',
    accessorKey: 'loadNumber',
    header: 'Load #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/loads/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.loadNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) =>
      row.original.customer ? (
        <Link
          href={`/dashboard/customers/${row.original.customer.id}`}
          className="text-primary hover:underline"
        >
          {row.original.customer.name}
        </Link>
      ) : (
        'N/A'
      ),
    defaultVisible: true,
  },
  {
    id: 'route',
    header: 'Route',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.pickupCity || 'N/A'}, {row.original.pickupState || 'N/A'}
        </div>
        <div className="text-sm text-muted-foreground">
          → {row.original.deliveryCity || 'N/A'}, {row.original.deliveryState || 'N/A'}
        </div>
      </div>
    ),
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
    cell: ({ row }) =>
      row.original.driver && row.original.driver.user ? (
        <Link
          href={`/dashboard/drivers/${row.original.driver.id}`}
          className="text-primary hover:underline"
        >
          {row.original.driver.user.firstName} {row.original.driver.user.lastName}
        </Link>
      ) : (
        'Unassigned'
      ),
    defaultVisible: true,
  },
  {
    id: 'truck',
    header: 'Truck',
    cell: ({ row }) =>
      row.original.truck ? (
        <Link
          href={`/dashboard/trucks/${row.original.truck.id}`}
          className="text-primary hover:underline"
        >
          {row.original.truck.truckNumber}
        </Link>
      ) : (
        'Unassigned'
      ),
    defaultVisible: true,
  },
  {
    id: 'revenue',
    accessorKey: 'revenue',
    header: 'Revenue',
    cell: ({ row }) => formatCurrency(row.original.revenue),
    defaultVisible: true,
  },
  {
    id: 'pickupDate',
    accessorKey: 'pickupDate',
    header: 'Pickup Date',
    cell: ({ row }) => (row.original.pickupDate ? formatDate(row.original.pickupDate) : 'N/A'),
    defaultVisible: false,
  },
  {
    id: 'deliveryDate',
    accessorKey: 'deliveryDate',
    header: 'Delivery Date',
    cell: ({ row }) => (row.original.deliveryDate ? formatDate(row.original.deliveryDate) : 'N/A'),
    defaultVisible: false,
  },
  {
    id: 'miles',
    accessorKey: 'miles',
    header: 'Miles',
    cell: ({ row }) => row.original.miles ? row.original.miles.toLocaleString() : 'N/A',
    defaultVisible: false,
  },
  {
    id: 'weight',
    accessorKey: 'weight',
    header: 'Weight',
    cell: ({ row }) => row.original.weight ? `${row.original.weight.toLocaleString()} lbs` : 'N/A',
    defaultVisible: false,
  },
  {
    id: 'driverPay',
    accessorKey: 'driverPay',
    header: 'Driver Pay',
    cell: ({ row }) => formatCurrency(row.original.driverPay),
    defaultVisible: false,
    permission: 'loads.view_financial',
  },
  {
    id: 'profit',
    accessorKey: 'profit',
    header: 'Profit',
    cell: ({ row }) => formatCurrency(row.original.profit),
    defaultVisible: false,
    permission: 'loads.view_financial',
  },
  {
    id: 'mcNumber',
    accessorKey: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) => {
      const mcNumber = row.original.mcNumber;
      if (!mcNumber) return 'N/A';
      // Handle both object format (from API) and string format
      if (isMcNumberObject(mcNumber)) {
        return (
          <McBadge 
            mcNumber={mcNumber.number} 
            mcNumberId={mcNumber.id}
            companyName={mcNumber.companyName}
            size="sm" 
          />
        );
      }
      return <McBadge mcNumber={mcNumber as string} size="sm" />;
    },
    defaultVisible: false,
    permission: 'mc_numbers.view',
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.keys(LoadStatus).map((status) => ({
      value: status,
      label: formatStatus(status as LoadStatus),
    })),
    permission: 'loads.edit',
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

export const loadsTableConfig = createEntityTableConfig<LoadData>({
  entityType: 'loads',
  columns,
  defaultVisibleColumns: [
    'loadNumber',
    'customer',
    'route',
    'status',
    'driver',
    'truck',
    'revenue',
  ],
  requiredColumns: ['loadNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'loadNumber', desc: false }],
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
      type: 'multiselect',
      options: Object.keys(LoadStatus).map((status) => ({
        value: status,
        label: formatStatus(status as LoadStatus),
      })),
    },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [], // Will be populated dynamically
      permission: 'mc_numbers.view',
    },
    { key: 'customerId', label: 'Customer ID', type: 'text' },
    { key: 'driverId', label: 'Driver ID', type: 'text' },
    { key: 'pickupCity', label: 'Pickup City', type: 'text' },
    { key: 'deliveryCity', label: 'Delivery City', type: 'text' },
    { 
      key: 'date', 
      label: 'Date Range', 
      type: 'daterange' 
    },
    { 
      key: 'revenue', 
      label: 'Min Revenue', 
      type: 'number' 
    },
  ],
});

