import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField, CustomBulkAction } from '@/components/data-table/types';
import { DriverStatus, PayType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';
import McBadge from '@/components/mc-numbers/McBadge';
import { UserCheck, UserX } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface DriverData {
  id: string;
  driverNumber: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  medicalCardExpiry: Date;
  drugTestDate: Date | null;
  backgroundCheck: Date | null;
  status: DriverStatus;
  homeTerminal: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  payType: PayType;
  payRate: number;
  rating: number | null;
  totalLoads: number;
  totalMiles: number;
  onTimePercentage: number;
  mcNumber?: {
    id: string;
    number: string;
    companyName: string;
  } | null;
  currentTruck?: {
    id: string;
    truckNumber: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

function formatStatus(status: DriverStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const statusColors: Record<DriverStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ON_DUTY: 'bg-blue-100 text-blue-800 border-blue-200',
  DRIVING: 'bg-purple-100 text-purple-800 border-purple-200',
  OFF_DUTY: 'bg-gray-100 text-gray-800 border-gray-200',
  SLEEPER_BERTH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INACTIVE: 'bg-red-100 text-red-800 border-red-200',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DISPATCHED: 'bg-orange-100 text-orange-800 border-orange-200',
};

function formatPayType(payType: PayType): string {
  return payType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const columns: ExtendedColumnDef<DriverData>[] = [
  {
    id: 'driverNumber',
    accessorKey: 'driverNumber',
    header: 'Driver #',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/drivers/${row.original.id}`}
        className="text-primary hover:underline font-medium"
      >
        {row.original.driverNumber}
      </Link>
    ),
    defaultVisible: true,
    required: true,
  },
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.user.firstName} {row.original.user.lastName}
        </div>
        <div className="text-sm text-muted-foreground">{row.original.user.email}</div>
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
    id: 'license',
    header: 'License',
    cell: ({ row }) => (
      <div>
        <div>{row.original.licenseNumber}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.licenseState} • Exp: {formatDate(row.original.licenseExpiry)}
        </div>
      </div>
    ),
    defaultVisible: true,
  },
  {
    id: 'payType',
    accessorKey: 'payType',
    header: 'Pay Type',
    cell: ({ row }) => (
      <div>
        <div>{formatPayType(row.original.payType)}</div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(row.original.payRate)}
        </div>
      </div>
    ),
    defaultVisible: false,
  },
  {
    id: 'currentTruck',
    header: 'Truck',
    cell: ({ row }) =>
      row.original.currentTruck ? (
        <Link
          href={`/dashboard/trucks/${row.original.currentTruck.id}`}
          className="text-primary hover:underline"
        >
          {row.original.currentTruck.truckNumber}
        </Link>
      ) : (
        'Unassigned'
      ),
    defaultVisible: true,
  },
  {
    id: 'stats',
    header: 'Stats',
    cell: ({ row }) => (
      <div className="text-sm">
        <div>Loads: {row.original.totalLoads}</div>
        <div>Miles: {row.original.totalMiles.toLocaleString()}</div>
        {row.original.rating && <div>Rating: {row.original.rating.toFixed(1)}</div>}
      </div>
    ),
    defaultVisible: false,
  },
  {
    id: 'mcNumber',
    header: 'MC Number',
    cell: ({ row }) =>
      row.original.mcNumber ? (
        <McBadge
          mcNumber={row.original.mcNumber.number}
          mcNumberId={row.original.mcNumber.id}
          companyName={row.original.mcNumber.companyName}
          size="sm"
        />
      ) : (
        '—'
      ),
    defaultVisible: false,
    permission: 'mc_numbers.view',
  },
  {
    id: 'medicalCardExpiry',
    accessorKey: 'medicalCardExpiry',
    header: 'Medical Card',
    cell: ({ row }) => formatDate(row.original.medicalCardExpiry),
    defaultVisible: false,
  },
  {
    id: 'homeTerminal',
    accessorKey: 'homeTerminal',
    header: 'Home Terminal',
    defaultVisible: false,
  },
];

const bulkEditFields: BulkEditField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: Object.keys(DriverStatus).map((status) => ({
      value: status,
      label: formatStatus(status as DriverStatus),
    })),
    permission: 'drivers.edit',
  },
  {
    key: 'payType',
    label: 'Pay Type',
    type: 'select',
    options: Object.keys(PayType).map((type) => ({
      value: type,
      label: formatPayType(type as PayType),
    })),
    permission: 'drivers.edit',
  },
  {
    key: 'payRate',
    label: 'Pay Rate',
    type: 'number',
    permission: 'drivers.edit',
  },
  {
    key: 'homeTerminal',
    label: 'Home Terminal',
    type: 'text',
    permission: 'drivers.edit',
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

// Custom bulk actions for HR operations
// Note: These handlers will be called from BulkActionBar which handles toast notifications and query invalidation
const customBulkActions: CustomBulkAction[] = [
  {
    id: 'activate',
    label: 'Activate Drivers',
    icon: <UserCheck className="h-4 w-4" />,
    variant: 'default',
    permission: 'drivers.edit',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to activate the selected drivers?',
    handler: async (selectedIds: string[]) => {
      const response = await fetch(apiUrl('/api/bulk-actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'drivers',
          action: 'update',
          ids: selectedIds,
          updates: { status: 'AVAILABLE' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to activate drivers');
      }

      // Success toast and query invalidation handled by BulkActionBar
    },
  },
  {
    id: 'deactivate',
    label: 'Deactivate Drivers',
    icon: <UserX className="h-4 w-4" />,
    variant: 'outline',
    permission: 'drivers.edit',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to deactivate the selected drivers?',
    handler: async (selectedIds: string[]) => {
      const response = await fetch(apiUrl('/api/bulk-actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'drivers',
          action: 'update',
          ids: selectedIds,
          updates: { status: 'INACTIVE' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to deactivate drivers');
      }

      // Success toast and query invalidation handled by BulkActionBar
    },
  },
];

export const driversTableConfig = createEntityTableConfig<DriverData>({
  entityType: 'drivers',
  columns,
  defaultVisibleColumns: [
    'driverNumber',
    'name',
    'status',
    'license',
    'currentTruck',
  ],
  requiredColumns: ['driverNumber'],
  bulkEditFields,
  customBulkActions,
  defaultSort: [{ id: 'driverNumber', desc: false }],
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
      options: Object.keys(DriverStatus).map((status) => ({
        value: status,
        label: formatStatus(status as DriverStatus),
      })),
    },
    {
      key: 'mcNumberId',
      label: 'MC Number',
      type: 'select',
      options: [], // Will be populated dynamically
      permission: 'mc_numbers.view',
    },
    { key: 'licenseState', label: 'License State', type: 'text' },
    { key: 'homeTerminal', label: 'Home Terminal', type: 'text' },
  ],
});

