import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EntityLink } from '@/components/common/EntityLink';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchInvoiceRow {
  id: string;
  customerName: string;
  customerId: string;
  loadNumber: string;
  loadId: string;
  invoiceNumber: string;
  invoiceId: string;
  driverPay: number;
  deliveryDate: string | null;
  pickupDate: string | null;
  deliveredAt: string | null;
  driverName: string;
  status: string;
  factoringPartyName: string;
  billingType: string;
  total: number;
  isSent: boolean;
  podUploadedAt: string | null;
  invoiceNote: string;
  paymentNote: string;
  qbSyncStatus: string;
  balance: number;
  truckNumber: string;
  factoringCompanyId: string;
  rateConfirmationUrl: string;
  podUrl: string;
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

/** Transform nested batch API items + email logs into flat rows for DataTable */
export function flattenBatchItems(
  items: any[],
  emailLogs: Record<string, any>,
): BatchInvoiceRow[] {
  return items.map((item) => {
    const inv = item.invoice;
    const load = inv.load;
    const log = emailLogs[inv.id];
    return {
      id: inv.id,
      customerName: inv.customer?.name || '-',
      customerId: inv.customer?.id || '',
      loadNumber: load?.loadNumber || '-',
      loadId: load?.id || '',
      invoiceNumber: inv.invoiceNumber,
      invoiceId: inv.id,
      driverPay: load?.driverPay || 0,
      deliveryDate: load?.deliveryDate || null,
      pickupDate: load?.pickupDate || null,
      deliveredAt: load?.deliveredAt || null,
      driverName: load?.driver?.user
        ? `${load.driver.user.firstName} ${load.driver.user.lastName}`
        : '-',
      status: inv.status,
      factoringPartyName: inv.factoringCompany?.name || '-',
      billingType: inv.factoringCompany ? 'Factoring' : 'Email',
      total: inv.total || 0,
      isSent: log?.status === 'SENT',
      podUploadedAt: load?.podUploadedAt || null,
      invoiceNote: inv.invoiceNote || '',
      paymentNote: inv.paymentNote || '',
      qbSyncStatus: inv.qbSyncStatus || '-',
      balance: inv.balance || 0,
      truckNumber: load?.truck?.truckNumber || '-',
      factoringCompanyId: inv.factoringCompany?.id || '',
      rateConfirmationUrl: (load?.rateConfirmation || load?.documents?.find((d: any) => d.type === 'RATE_CONFIRMATION')) && load?.id
        ? `/api/loads/${load.id}/ratecon`
        : '',
      podUrl: load?.documents?.find((d: any) => d.type === 'POD') && load?.id
        ? `/api/loads/${load.id}/pod`
        : '',
    };
  });
}

/** Compute aggregate totals from flat rows */
export function computeBatchTotals(rows: BatchInvoiceRow[]) {
  let amount = 0;
  let driverGross = 0;
  let balance = 0;
  for (const row of rows) {
    amount += row.total;
    driverGross += row.driverPay;
    balance += row.balance;
  }
  return { amount, driverGross, balance };
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const statusVariant = (status: string) => {
  switch (status) {
    case 'PAID': return 'success' as const;
    case 'OVERDUE': return 'destructive' as const;
    case 'PARTIAL': return 'warning' as const;
    case 'SENT':
    case 'INVOICED': return 'info' as const;
    case 'CANCELLED': return 'error' as const;
    default: return 'secondary' as const;
  }
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnOptions {
  onViewPackage: (invoiceId: string, invoiceNumber: string) => void;
}

export function createBatchInvoiceColumns(opts: ColumnOptions): ExtendedColumnDef<BatchInvoiceRow>[] {
  return [
    // Invoice #
    {
      id: 'invoiceNumber',
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <EntityLink
          entityType="invoices"
          entityId={row.original.invoiceId}
          className="font-medium text-primary hover:underline whitespace-nowrap cursor-pointer"
        >
          {row.original.invoiceNumber}
        </EntityLink>
      ),
      className: 'min-w-[110px]',
      defaultVisible: true,
      required: true,
    },
    // Customer
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) =>
        row.original.customerId ? (
          <EntityLink
            entityType="customers"
            entityId={row.original.customerId}
            className="font-medium text-primary hover:underline truncate block max-w-[180px] cursor-pointer"
          >
            {row.original.customerName}
          </EntityLink>
        ) : (
          <span className="font-medium truncate block max-w-[180px]">{row.original.customerName}</span>
        ),
      className: 'min-w-[140px]',
      defaultVisible: true,
    },
    // Load #
    {
      id: 'loadNumber',
      accessorKey: 'loadNumber',
      header: 'Load #',
      cell: ({ row }) =>
        row.original.loadId ? (
          <EntityLink
            entityType="loads"
            entityId={row.original.loadId}
            className="text-muted-foreground hover:underline whitespace-nowrap cursor-pointer"
          >
            {row.original.loadNumber}
          </EntityLink>
        ) : (
          <span className="text-muted-foreground">{row.original.loadNumber}</span>
        ),
      defaultVisible: true,
    },
    // Status
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
      defaultVisible: true,
    },
    // Amount
    {
      id: 'total',
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">{formatCurrency(row.original.total)}</span>
      ),
      className: 'text-right min-w-[90px]',
      defaultVisible: true,
    },
    // Driver Gross
    {
      id: 'driverPay',
      accessorKey: 'driverPay',
      header: 'Driver Gross',
      cell: ({ row }) =>
        row.original.driverPay
          ? <span className="whitespace-nowrap">{formatCurrency(row.original.driverPay)}</span>
          : <span className="text-muted-foreground">-</span>,
      className: 'text-right min-w-[100px]',
      defaultVisible: true,
    },
    // Balance
    {
      id: 'balance',
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => (
        <span className={`font-medium whitespace-nowrap ${row.original.balance > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
          {formatCurrency(row.original.balance)}
        </span>
      ),
      className: 'text-right min-w-[90px]',
      defaultVisible: true,
    },
    // Pickup
    {
      id: 'pickupDate',
      accessorKey: 'pickupDate',
      header: 'Pickup',
      cell: ({ row }) =>
        row.original.pickupDate
          ? <span className="whitespace-nowrap">{formatDate(new Date(row.original.pickupDate))}</span>
          : <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    // Delivery
    {
      id: 'deliveryDate',
      accessorKey: 'deliveryDate',
      header: 'Delivery',
      cell: ({ row }) =>
        row.original.deliveryDate
          ? <span className="whitespace-nowrap">{formatDate(new Date(row.original.deliveryDate))}</span>
          : <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    // Delivered At
    {
      id: 'deliveredAt',
      accessorKey: 'deliveredAt',
      header: 'Delivered At',
      cell: ({ row }) =>
        row.original.deliveredAt
          ? <span className="whitespace-nowrap">{formatDate(new Date(row.original.deliveredAt))}</span>
          : <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    // Driver
    {
      id: 'driverName',
      accessorKey: 'driverName',
      header: 'Driver',
      cell: ({ row }) => (
        <span className="truncate block max-w-[140px]">{row.original.driverName}</span>
      ),
      className: 'min-w-[100px]',
      defaultVisible: true,
    },
    // Truck
    {
      id: 'truckNumber',
      accessorKey: 'truckNumber',
      header: 'Truck',
      defaultVisible: true,
    },
    // Billing
    {
      id: 'billingType',
      accessorKey: 'billingType',
      header: 'Billing',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          {row.original.billingType}
        </Badge>
      ),
      defaultVisible: true,
    },
    // POD
    {
      id: 'pod',
      accessorKey: 'podUrl',
      header: 'POD',
      cell: ({ row }) =>
        row.original.podUrl ? (
          <a
            href={apiUrl(row.original.podUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            POD
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      enableSorting: false,
      defaultVisible: true,
    },
    // Rate Con
    {
      id: 'rateConfirmation',
      accessorKey: 'rateConfirmationUrl',
      header: 'Rate Con',
      cell: ({ row }) =>
        row.original.rateConfirmationUrl ? (
          <a
            href={apiUrl(row.original.rateConfirmationUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            PDF
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      enableSorting: false,
      defaultVisible: true,
    },
    // Factoring PDF — opens InvoicePackageDialog for all invoices
    {
      id: 'factoringPdf',
      accessorKey: 'invoiceId',
      header: 'Package',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-primary hover:underline font-medium"
          onClick={() => opts.onViewPackage(row.original.invoiceId, row.original.invoiceNumber)}
        >
          <FileText className="h-3 w-3 mr-1" />
          View PDF
        </Button>
      ),
      enableSorting: false,
      defaultVisible: true,
    },

    // --- Secondary columns (hidden by default) ---
    {
      id: 'isSent',
      accessorKey: 'isSent',
      header: 'Sent',
      cell: ({ row }) =>
        row.original.isSent ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
        ),
      className: 'text-center',
      defaultVisible: false,
    },
    {
      id: 'invoiceNote',
      accessorKey: 'invoiceNote',
      header: 'Invoice Note',
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate block">
          {row.original.invoiceNote || '-'}
        </span>
      ),
      defaultVisible: false,
    },
    {
      id: 'paymentNote',
      accessorKey: 'paymentNote',
      header: 'Note',
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate block">
          {row.original.paymentNote || '-'}
        </span>
      ),
      defaultVisible: false,
    },
    {
      id: 'qbSyncStatus',
      accessorKey: 'qbSyncStatus',
      header: 'Sync Status',
      cell: ({ row }) => {
        const label = row.original.qbSyncStatus;
        if (label === '-') return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            variant={label === 'SYNCED' ? 'success' : label === 'FAILED' ? 'error' : 'secondary'}
          >
            {label}
          </Badge>
        );
      },
      defaultVisible: false,
    },
  ];
}
