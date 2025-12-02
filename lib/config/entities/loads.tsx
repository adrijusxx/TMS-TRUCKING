import React from 'react';
import { createEntityTableConfig } from '../entity-table-config';
import type { ExtendedColumnDef, BulkEditField } from '@/components/data-table/types';
import { LoadStatus } from '@prisma/client';
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
  createdAt?: Date | string;
  updatedAt?: Date | string;
  missingDocuments?: string[];
  hasMissingDocuments?: boolean;
  rateConfirmation?: Array<{
    id: string;
    rateConfNumber: string | null;
  }> | null;
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
      classes.push('bg-green-50 border-l-4 border-l-green-500');
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
        classes[0] = 'bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-l-green-500';
      } else {
        classes.push('bg-blue-50 border-l-4 border-l-blue-500');
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
      const missingDocs = row.original.missingDocuments || [];

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
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
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
  },
  {
    id: 'rateConfNumber',
    header: 'Rate Con #',
    cell: ({ row }) => {
      const rateConf = row.original.rateConfirmation?.[0];
      return (
        <RateConfEditableCell
          loadId={row.original.id}
          rateConfId={rateConf?.id || null}
          rateConfNumber={rateConf?.rateConfNumber || null}
        />
      );
    },
    defaultVisible: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <LoadStatusCell loadId={row.original.id} status={row.original.status} />
    ),
    defaultVisible: true,
    enableColumnFilter: true,
    filterKey: 'status',
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
  },
  {
    id: 'revenue',
    accessorKey: 'revenue',
    header: 'Rate',
    cell: ({ row }) => formatCurrency(row.original.revenue),
    defaultVisible: true,
    // Rate is NOT editable - financial safety
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
    enableColumnFilter: true,
    filterKey: 'customerId',
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
    defaultVisible: false, // Hidden by default since we have Origin/Dest columns
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
    enableColumnFilter: true,
    filterKey: 'driverId',
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
    enableColumnFilter: true,
    filterKey: 'truckId',
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
    accessorKey: 'totalMiles',
    header: 'Miles',
    cell: ({ row }) => {
      const miles = (row.original as any).totalMiles ?? row.original.miles;
      return miles ? miles.toLocaleString() : 'N/A';
    },
    defaultVisible: false,
  },
  {
    id: 'loadedMiles',
    accessorKey: 'loadedMiles',
    header: 'Loaded Miles',
    cell: ({ row }) => {
      const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles;
      return loadedMiles ? loadedMiles.toLocaleString() : 'N/A';
    },
    defaultVisible: false,
  },
  {
    id: 'emptyMiles',
    accessorKey: 'emptyMiles',
    header: 'Empty Miles',
    cell: ({ row }) => {
      const totalMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
      const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles ?? 0;
      // Empty miles = total miles - loaded miles (includes deadhead to pickup)
      const emptyMiles = Math.max(totalMiles - loadedMiles, 0);
      return emptyMiles > 0 ? emptyMiles.toLocaleString() : 'N/A';
    },
    defaultVisible: false,
  },
  {
    id: 'rpmLoaded',
    header: 'RPM (Loaded)',
    cell: ({ row }) => {
      const revenue = row.original.revenue || 0;
      const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles ?? 0;
      if (loadedMiles > 0) {
        const rpm = revenue / loadedMiles;
        return formatCurrency(rpm);
      }
      return 'N/A';
    },
    defaultVisible: false,
    enableHiding: true,
  },
  {
    id: 'rpmEmpty',
    header: 'RPM (Empty)',
    cell: ({ row }) => {
      const revenue = row.original.revenue || 0;
      const totalMiles = (row.original as any).totalMiles ?? row.original.miles ?? 0;
      const loadedMiles = (row.original as any).loadedMiles ?? row.original.loadedMiles ?? 0;
      const storedEmptyMiles = (row.original as any).emptyMiles ?? row.original.emptyMiles ?? 0;
      // Empty miles = stored emptyMiles + loadedMiles (loadedMiles are deadhead in this context)
      const emptyMiles = storedEmptyMiles + loadedMiles;
      if (emptyMiles > 0) {
        const rpm = revenue / emptyMiles;
        return formatCurrency(rpm);
      }
      return 'N/A';
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
      if (totalMiles > 0) {
        const rpm = revenue / totalMiles;
        return formatCurrency(rpm);
      }
      return 'N/A';
    },
    defaultVisible: false,
    enableHiding: true,
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
  {
    id: 'documents',
    header: 'Documents',
    cell: ({ row }) => {
      const hasMissingDocs = row.original.hasMissingDocuments || false;
      const missingDocs = row.original.missingDocuments || [];

      const documentLabels: Record<string, string> = {
        BOL: 'BOL',
        POD: 'POD',
        RATE_CONFIRMATION: 'Rate Conf',
      };

      if (!hasMissingDocs) {
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <FileText className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Missing {missingDocs.length}
                </Badge>
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
      );
    },
    defaultVisible: true,
    enableColumnFilter: false,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      // createdAt might be a string or Date
      const date = row.original.createdAt || (row.original as any).createdAt;
      if (!date) return 'N/A';
      
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
    enableColumnFilter: false, // Don't enable column filter for date columns
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
    'rateConfNumber',
    'status',
    'origin',
    'destination',
    'revenue',
    'customer',
  ],
  requiredColumns: ['loadNumber'],
  bulkEditFields,
  defaultSort: [{ id: 'createdAt', desc: true }], // Newest loads first
  defaultPageSize: 20,
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableImport: true,
  enableExport: true,
  enableBulkEdit: true,
  enableBulkDelete: true,
  filterDefinitions: [
    {
      key: 'createdToday',
      label: 'Created Today',
      type: 'boolean',
    },
    {
      key: 'pickupToday',
      label: 'Pickup Today',
      type: 'boolean',
    },
    {
      key: 'createdLast24h',
      label: 'Created Last 24h',
      type: 'boolean',
    },
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
    { 
      key: 'customerId', 
      label: 'Customer', 
      type: 'text',
    },
    { 
      key: 'driverId', 
      label: 'Driver', 
      type: 'text',
    },
    { 
      key: 'pickupCity', 
      label: 'Pickup City', 
      type: 'text',
    },
    { 
      key: 'pickupState', 
      label: 'Pickup State', 
      type: 'text',
    },
    { 
      key: 'deliveryCity', 
      label: 'Delivery City', 
      type: 'text',
    },
    { 
      key: 'deliveryState', 
      label: 'Delivery State', 
      type: 'text',
    },
    { 
      key: 'truckNumber', 
      label: 'Truck Number', 
      type: 'text',
    },
    { 
      key: 'dispatcherId', 
      label: 'Dispatcher', 
      type: 'text',
    },
    { 
      key: 'pickupDate', 
      label: 'Pickup Date Range', 
      type: 'daterange',
    },
    { 
      key: 'deliveryDate', 
      label: 'Delivery Date Range', 
      type: 'daterange',
    },
    { 
      key: 'date', 
      label: 'Created Date Range', 
      type: 'daterange',
    },
    { 
      key: 'revenue', 
      label: 'Min Revenue', 
      type: 'number',
    },
    { 
      key: 'miles', 
      label: 'Min Miles', 
      type: 'number',
    },
    {
      key: 'hasMissingDocuments',
      label: 'Missing Documents',
      type: 'boolean',
      permission: 'documents.view', // Only show to users who can view documents
      helpText: 'Show only loads with missing required documents (BOL, POD, Rate Confirmation)',
    },
  ],
});

