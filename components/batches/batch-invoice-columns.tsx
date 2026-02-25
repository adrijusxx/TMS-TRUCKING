import React from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ExtendedColumnDef } from '@/components/data-table/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchInvoiceRow {
  id: string;
  shipmentId: string;
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
      shipmentId: load?.shipmentId || '-',
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
      rateConfirmationUrl: load?.rateConfirmation?.document?.fileUrl || '',
      podUrl: load?.documents?.[0]?.fileUrl || '',
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

export function createBatchInvoiceColumns(): ExtendedColumnDef<BatchInvoiceRow>[] {
  return [
    // --- Primary columns (visible by default) ---
    {
      id: 'invoiceNumber',
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/invoices/${row.original.invoiceId}`}
          className="font-medium text-primary hover:underline whitespace-nowrap"
        >
          {row.original.invoiceNumber}
        </Link>
      ),
      className: 'min-w-[110px]',
      defaultVisible: true,
      required: true,
    },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) =>
        row.original.customerId ? (
          <Link
            href={`/dashboard/customers/${row.original.customerId}`}
            className="font-medium text-primary hover:underline truncate block max-w-[180px]"
          >
            {row.original.customerName}
          </Link>
        ) : (
          <span className="font-medium truncate block max-w-[180px]">{row.original.customerName}</span>
        ),
      className: 'min-w-[140px]',
      defaultVisible: true,
    },
    {
      id: 'loadNumber',
      accessorKey: 'loadNumber',
      header: 'Load #',
      cell: ({ row }) =>
        row.original.loadId ? (
          <Link
            href={`/dashboard/loads/${row.original.loadId}`}
            className="text-muted-foreground hover:underline whitespace-nowrap"
          >
            {row.original.loadNumber}
          </Link>
        ) : (
          <span className="text-muted-foreground">{row.original.loadNumber}</span>
        ),
      defaultVisible: true,
    },
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
    {
      id: 'truckNumber',
      accessorKey: 'truckNumber',
      header: 'Truck',
      defaultVisible: true,
    },
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
    {
      id: 'pod',
      accessorKey: 'podUrl',
      header: 'POD',
      cell: ({ row }) =>
        row.original.podUrl ? (
          <a
            href={row.original.podUrl}
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

    // --- Secondary columns (hidden by default, user can enable) ---
    {
      id: 'shipmentId',
      accessorKey: 'shipmentId',
      header: 'Shipment',
      defaultVisible: false,
    },
    {
      id: 'pickupDate',
      accessorKey: 'pickupDate',
      header: 'Pickup',
      cell: ({ row }) =>
        row.original.pickupDate
          ? <span className="whitespace-nowrap">{formatDate(new Date(row.original.pickupDate))}</span>
          : <span className="text-muted-foreground">-</span>,
      defaultVisible: false,
    },
    {
      id: 'deliveredAt',
      accessorKey: 'deliveredAt',
      header: 'Delivered At',
      cell: ({ row }) =>
        row.original.deliveredAt
          ? <span className="whitespace-nowrap">{formatDate(new Date(row.original.deliveredAt))}</span>
          : <span className="text-muted-foreground">-</span>,
      defaultVisible: false,
    },
    {
      id: 'factoringPdf',
      accessorKey: 'factoringCompanyId',
      header: 'Factoring PDF',
      cell: ({ row }) =>
        row.original.factoringCompanyId ? (
          <a
            href={`/api/invoices/${row.original.invoiceId}/package`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View PDF
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      enableSorting: false,
      defaultVisible: false,
    },
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
      id: 'rateConfirmation',
      accessorKey: 'rateConfirmationUrl',
      header: 'Rate Con',
      cell: ({ row }) =>
        row.original.rateConfirmationUrl ? (
          <a
            href={row.original.rateConfirmationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      enableSorting: false,
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
