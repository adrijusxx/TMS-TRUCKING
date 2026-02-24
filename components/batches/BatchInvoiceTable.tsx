'use client';

import { useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { Download, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface BatchInvoiceTableProps {
  items: any[];
  emailLogs: Record<string, any>;
  selectedIds: Set<string>;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  allSelected: boolean;
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
    case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
    case 'PARTIAL': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'SENT': case 'INVOICED': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function BatchInvoiceTable({
  items, emailLogs, selectedIds, onToggleAll, onToggleOne, allSelected,
}: BatchInvoiceTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadPackage = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const response = await fetch(apiUrl(`/api/invoices/${invoiceId}/package`));
      if (!response.ok) throw new Error('Failed to generate package');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-package-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const totals = useMemo(() => {
    let amount = 0, driverGross = 0, balance = 0;
    for (const item of items) {
      amount += item.invoice.total || 0;
      balance += item.invoice.balance || 0;
      driverGross += item.invoice.load?.driverPay || 0;
    }
    return { amount, driverGross, balance };
  }, [items]);

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={onToggleAll} /></TableHead>
            <TableHead>Shipment</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Load ID</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead className="text-right">Driver Gross</TableHead>
            <TableHead>Delivery Time</TableHead>
            <TableHead>Pickup Time</TableHead>
            <TableHead>Delivered</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Factoring Party</TableHead>
            <TableHead>Billing Type</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-center">Is Sent</TableHead>
            <TableHead>Rate Con</TableHead>
            <TableHead>POD</TableHead>
            <TableHead>Invoice Note</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TooltipProvider>
            {items.map((item: any) => {
              const inv = item.invoice;
              const load = inv.load;
              const log = emailLogs[inv.id];
              const driverName = load?.driver?.user
                ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : '-';
              const billingType = inv.factoringCompany ? 'Factoring company' : 'Email';
              const isSent = log?.status === 'SENT';
              const syncLabel = inv.qbSyncStatus || '-';

              return (
                <TableRow key={inv.id} data-state={selectedIds.has(inv.id) ? 'selected' : undefined}>
                  <TableCell><Checkbox checked={selectedIds.has(inv.id)} onCheckedChange={() => onToggleOne(inv.id)} /></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{load?.shipmentId || '-'}</TableCell>
                  <TableCell className="font-medium">{inv.customer?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{load?.loadNumber || '-'}</TableCell>
                  <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-right">{load?.driverPay ? formatCurrency(load.driverPay) : '-'}</TableCell>
                  <TableCell className="text-xs">{load?.deliveryDate ? formatDate(load.deliveryDate) : '-'}</TableCell>
                  <TableCell className="text-xs">{load?.pickupDate ? formatDate(load.pickupDate) : '-'}</TableCell>
                  <TableCell className="text-xs">{load?.deliveredAt ? formatDate(load.deliveredAt) : '-'}</TableCell>
                  <TableCell>{driverName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadgeClass(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{inv.factoringCompany?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{billingType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                  <TableCell className="text-center">
                    {isSent
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      : <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />}
                  </TableCell>
                  <TableCell>
                    {load?.id ? (
                      <Link href={`/dashboard/loads/${load.id}`} className="text-xs text-primary hover:underline">
                        Rate confirmation
                      </Link>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {load?.podUploadedAt ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">POD</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{inv.invoiceNote || '-'}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{inv.paymentNote || '-'}</TableCell>
                  <TableCell>
                    {syncLabel !== '-' ? (
                      <Badge variant="outline" className={
                        syncLabel === 'SYNCED' ? 'bg-green-50 text-green-700' :
                        syncLabel === 'FAILED' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-700'
                      }>{syncLabel}</Badge>
                    ) : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">{formatCurrency(inv.balance)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => downloadPackage(inv.id, inv.invoiceNumber)}
                            disabled={downloadingId === inv.id}>
                            {downloadingId === inv.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Download className="h-3.5 w-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download PDF Package</TooltipContent>
                      </Tooltip>
                      <Link href={`/dashboard/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-1.5">
                          <FileText className="h-3.5 w-3.5 mr-0.5" /> View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TooltipProvider>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="font-semibold">Total amount sum: {formatCurrency(totals.amount)}</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(totals.driverGross)}</TableCell>
            <TableCell colSpan={7} />
            <TableCell className="text-right font-bold">{formatCurrency(totals.amount)}</TableCell>
            <TableCell colSpan={6} />
            <TableCell className="text-right font-bold text-red-600">{formatCurrency(totals.balance)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
