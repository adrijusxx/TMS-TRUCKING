import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { LoadStatus, LoadDispatchStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import McBadge from '@/components/mc-numbers/McBadge';
import { LoadStatusCell } from '@/components/loads/LoadStatusCell';
import { RateConfEditableCell } from '@/components/loads/RateConfEditableCell';
import { AlertTriangle, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  weight: number | null;
  trailerNumber?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  missingDocuments?: string[];
  hasMissingDocuments?: boolean;
  rateConfirmation?: Array<{
    id: string;
    rateConfNumber: string | null;
  }> | null;
  dispatchStatus?: LoadDispatchStatus | null;
}

export function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Type guard for MC number object
function isMcNumberObject(
  mcNumber: string | { id: string; number: string; companyName?: string } | null | undefined
): mcNumber is { id: string; number: string; companyName?: string } {
  return typeof mcNumber === 'object' && mcNumber !== null && 'number' in mcNumber;
}

export const statusColors: Record<LoadStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EN_ROUTE_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-blue-100 text-blue-800 border-blue-200',
  LOADED: 'bg-green-100 text-green-800 border-green-200',
  EN_ROUTE_DELIVERY: 'bg-teal-100 text-teal-800 border-teal-200',
  AT_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  BILLING_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_TO_BILL: 'bg-lime-100 text-lime-800 border-lime-200',
  INVOICED: 'bg-lime-100 text-lime-800 border-lime-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Helper function to determine row highlight class based on dates
 * Returns className string for row highlighting
 */
export function getLoadRowClassName(load: LoadData): string {
  const classes: string[] = [];

  // Check if created today
  if (load.createdAt) {
    const createdAt = new Date(load.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (createdAt >= today && createdAt < tomorrow) {
      // Subtle success highlight
      classes.push('bg-status-success-muted/20 border-l-2 border-l-status-success');
    }
  }

  // Check if pickup date is today
  if (load.pickupDate) {
    const pickupDate = new Date(load.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (pickupDate >= today && pickupDate < tomorrow) {
      if (classes.length > 0) {
        // Both conditions met - use combined styling
        classes[0] = 'bg-status-success-muted/30 border-l-2 border-l-status-success shadow-sm';
      } else {
        // Subtle info/info highlight for upcoming pickup
        classes.push('bg-status-info-muted/20 border-l-2 border-l-status-info');
      }
    }
  }

  return classes.join(' ');
}

const columns: ExtendedColumnDef<LoadData>[] = [
  {
    id: 'loadNumber',
    accessorKey: 'loadNumber',
    header: 'Load #',
    cell: ({ row }) => {
      // Check if created today
      const isNew = row.original.createdAt ? (() => {
        const createdAt = new Date(row.original.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return createdAt >= today && createdAt < tomorrow;
      })() : false;

      const hasMissingDocs = row.original.hasMissingDocuments || false;

      // Deduplicate missing documents
      const missingDocs = Array.from(new Set(row.original.missingDocuments || []));

      const documentLabels: Record<string, string> = {
        BOL: 'Bill of Lading',
        POD: 'Proof of Delivery',
        RATE_CONFIRMATION: 'Rate Confirmation',
      };

      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/loads/${row.original.id}`}
            className="text-primary hover:underline font-medium"
          >
            {row.original.loadNumber}
          </Link>
          {isNew && (
            <Badge variant="success-outline" className="text-[10px] h-4.5 px-1 uppercase tracking-tighter font-bold">
              New
            </Badge>
          )}
          {hasMissingDocs && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold">Missing Documents:</p>
                    {missingDocs.map((doc) => (
                      <p key={doc} className="text-sm">• {documentLabels[doc] || doc}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
    defaultVisible: true,
    required: true,
    filterType: 'text',
    filterKey: 'loadNumber',
  },

  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <LoadStatusCell
        loadId={row.original.id}
        status={row.original.status}
        dispatchStatus={row.original.dispatchStatus}
      />
    ),
    defaultVisible: true,
    enableColumnFilter: true,
    filterKey: 'status',
    filterType: 'multiselect',
    filterOptions: Object.keys(LoadStatus).map((status) => ({
      value: status,
      label: formatStatus(status as LoadStatus),
    })),
  },
  {
    id: 'origin',
    header: 'Origin',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.pickupCity || 'N/A'}, {row.original.pickupState || 'N/A'}
      </div>
    ),
    defaultVisible: true,
    filterType: 'text',
    filterKey: 'pickupCity', // Best effort for now
  },
  {
    id: 'destination',
    header: 'Dest',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.deliveryCity || 'N/A'}, {row.original.deliveryState || 'N/A'}
      </div>
    ),
    defaultVisible: true,
    filterType: 'text',
    filterKey: 'deliveryCity', // Best effort
  },
  {
    id: 'pickupState',
    accessorKey: 'pickupState',
    header: 'Pickup ST',
    cell: ({ row }) => row.original.pickupState || '—',
    defaultVisible: false,
    enableSorting: true,
    tooltip: 'Two-letter state code for pickup location. Enable to sort loads by origin state.',
  },
  {
    id: 'deliveryState',
    accessorKey: 'deliveryState',
    header: 'Delivery ST',
    cell: ({ row }) => row.original.deliveryState || '—',
    defaultVisible: false,
    enableSorting: true,
    tooltip: 'Two-letter state code for delivery location. Enable to sort loads by destination state.',
  },
  {
    id: 'revenue',
    accessorKey: 'revenue',
    header: 'Rate',
    cell: ({ row }) => formatCurrency(row.original.revenue),
    defaultVisible: true,
    // Rate is NOT editable - financial safety
    filterType: 'number',
    tooltip: 'Total rate charged to the customer for this load (from Rate Confirmation).',
  },
  {
    id: 'customer',
    header: 'Customer',
    className: 'w-full min-w-[200px]',
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
    enableColumnFilter: true,
    filterKey: 'customerId',
    filterType: 'searchable-select',
  },
  {
    id: 'route',
    header: 'Route',
    className: 'w-full min-w-[300px]',
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
    filterType: 'text',
    filterKey: 'route',
  },
  {
    id: 'driver',
    header: 'Driver',
    cell: ({ row }) =>
      row.original.driver && row.original.driver.user ? (
        <span className="text-sm font-medium">
          {row.original.driver.user.firstName} {row.original.driver.user.lastName}
        </span>
      ) : (
        'Unassigned'
      ),
    defaultVisible: true,
    enableColumnFilter: true,
    filterKey: 'driverId',
    filterType: 'searchable-select',
  },
  {
    id: 'truck',
    header: 'Truck',
    cell: ({ row }) =>
      row.original.truck ? (
        <span className="text-sm font-medium">
          {row.original.truck.truckNumber}
        </span>
      ) : (
        'Unassigned'
      ),
    defaultVisible: true,
    enableColumnFilter: true,
    filterKey: 'truckId',
    filterType: 'searchable-select',
  },
  {
    id: 'trailer',
    header: 'Trailer',
    cell: ({ row }) => {
      const trailerNumber = (row.original as any).trailerNumber;
      return trailerNumber || '—';
    },
    defaultVisible: true,
    enableColumnFilter: true,
    filterKey: 'trailerId',
    filterType: 'searchable-select',
  },
  {
    id: 'dispatcher',
    header: 'Dispatcher',
    cell: ({ row }) =>
      row.original.dispatcher ? (
        <span className="text-sm">
          {row.original.dispatcher.firstName} {row.original.dispatcher.lastName}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    defaultVisible: true,
    enableColumnFilter: true,
    filterKey: 'dispatcherId',
    filterType: 'searchable-select',
  },
  {
    id: 'pickupDate',
    accessorKey: 'pickupDate',
    header: 'Pickup Date',
    cell: ({ row }) => (row.original.pickupDate ? formatDate(row.original.pickupDate) : '—'),
    defaultVisible: true,
    filterType: 'date',
  },
  {
    id: 'deliveryDate',
    accessorKey: 'deliveryDate',
    header: 'Delivery Date',
    cell: ({ row }) => (row.original.deliveryDate ? formatDate(row.original.deliveryDate) : '—'),
    defaultVisible: true,
    filterType: 'date',
  },
  {
    id: 'miles',
    accessorKey: 'totalMiles',
    header: 'Miles',
    cell: ({ row }) => {
      const miles = (row.original as any).totalMiles ?? row.original.miles;
      return miles ? miles.toLocaleString() : '—';
    },
    defaultVisible: true,
    filterType: 'number',
    tooltip: 'Total distance for this load (loaded + empty miles combined).',
  },
  {
    id: 'loadedMiles',
    accessorKey: 'loadedMiles',
    header: 'Loaded Miles',
    cell: ({ row }) => {
      // Use stored loadedMiles first, fallback to totalMiles (since loaded miles ≈ total when empty is unknown)
      const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles;
      if (loadedMiles !== null && loadedMiles !== undefined && loadedMiles > 0) {
        return loadedMiles.toLocaleString();
      }
      // Fallback to totalMiles as loaded miles (assumes empty miles = 0 when not specified)
      const totalMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
      return totalMiles > 0 ? totalMiles.toLocaleString() : '—';
    },
    defaultVisible: false,
  },
  {
    id: 'emptyMiles',
    accessorKey: 'emptyMiles',
    header: 'Empty Miles',
    cell: ({ row }) => {
      // Use stored emptyMiles first
      const storedEmpty = (row.original as any).emptyMiles ?? row.original.emptyMiles;
      if (storedEmpty !== null && storedEmpty !== undefined && storedEmpty > 0) {
        return storedEmpty.toLocaleString();
      }
      // Fallback: calculate from total - loaded
      const totalMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
      const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles ?? 0;
      if (loadedMiles > 0 && totalMiles > loadedMiles) {
        return Math.max(totalMiles - loadedMiles, 0).toLocaleString();
      }
      // Show 0 if we have total miles but no empty miles data (assumes all loaded)
      return totalMiles > 0 ? '0' : '—';
    },
    defaultVisible: false,
  },
  {
    id: 'rpmLoaded',
    header: 'RPM (Loaded)',
    cell: ({ row }) => {
      const revenue = row.original.revenue || 0;
      // Use stored loadedMiles first, fallback to totalMiles
      let loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles ?? 0;
      if (loadedMiles === 0) {
        // Fallback: use totalMiles as loaded miles when loadedMiles not specified
        loadedMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
      }
      if (loadedMiles > 0 && revenue > 0) {
        const rpm = revenue / loadedMiles;
        return formatCurrency(rpm);
      }
      return '—';
    },
    defaultVisible: true,
    enableHiding: true,
    tooltip: 'Rate Per Mile (loaded miles only). Revenue divided by loaded miles.',
  },
  {
    id: 'rpmEmpty',
    header: 'RPM (Empty)',
    cell: ({ row }) => {
      const revenue = row.original.revenue || 0;
      // Use stored emptyMiles first
      const storedEmpty = (row.original as any).emptyMiles ?? row.original.emptyMiles;
      let emptyMiles = 0;
      if (storedEmpty !== null && storedEmpty !== undefined && storedEmpty > 0) {
        emptyMiles = storedEmpty;
      } else {
        // Fallback: calculate from total - loaded
        const totalMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
        const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles ?? 0;
        if (loadedMiles > 0 && totalMiles > loadedMiles) {
          emptyMiles = totalMiles - loadedMiles;
        }
      }
      if (emptyMiles > 0 && revenue > 0) {
        const rpm = revenue / emptyMiles;
        return formatCurrency(rpm);
      }
      return '—';
    },
    defaultVisible: false,
    enableHiding: true,
  },
  {
    id: 'rpmTotal',
    header: 'RPM (Total)',
    cell: ({ row }) => {
      const revenue = row.original.revenue || 0;
      const totalMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
      if (totalMiles > 0 && revenue > 0) {
        const rpm = revenue / totalMiles;
        return formatCurrency(rpm);
      }
      return '—';
    },
    defaultVisible: false,
    enableHiding: true,
  },
  {
    id: 'weight',
    accessorKey: 'weight',
    header: 'Weight',
    cell: ({ row }) => row.original.weight ? `${row.original.weight.toLocaleString()} lbs` : '—',
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
      if (!mcNumber) return '—';
      // Handle both object format (from API) and string format
      return (
        <div className="pl-1">
          {isMcNumberObject(mcNumber) ? (
            <McBadge
              mcNumber={mcNumber.number}
              mcNumberId={mcNumber.id}
              companyName={mcNumber.companyName}
              size="sm"
            />
          ) : (
            <McBadge mcNumber={mcNumber as string} size="sm" />
          )}
        </div>
      );
    },
    defaultVisible: true,
    permission: 'mc_numbers.view',
    enableColumnFilter: true,
    filterKey: 'mcNumberId',
    filterType: 'searchable-select',
    className: 'min-w-[150px]',
  },

  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      // createdAt might be a string or Date
      const date = row.original.createdAt || (row.original as any).createdAt;
      if (!date) return '—';

      const dateObj = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Check if today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateToday = new Date(dateObj);
      dateToday.setHours(0, 0, 0, 0);
      const isToday = dateToday.getTime() === today.getTime();

      if (isToday) {
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        return 'Today';
      }

      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;

      return formatDate(dateObj);
    },
    defaultVisible: true,
    enableSorting: true,
    enableColumnFilter: true,
    filterType: 'date',
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
    'status',
    'route',
    'driver',
    'truck',
    'trailer',
    'pickupDate',
    'deliveryDate',
    'rpmLoaded',
    'miles',
    'dispatcher',
    'mcNumber',
  ],
  requiredColumns: ['loadNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'createdAt', desc: true }], // Newest loads first
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: false, // Handled by header buttons in LoadListNew
  enableExport: false, // Handled by header buttons in LoadListNew
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [], // Removed as we use inline filters
});

