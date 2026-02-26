'use client';

import { useMemo, useState, useCallback } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { RowSelectionState } from '@tanstack/react-table';
import {
  createBatchInvoiceColumns,
  computeBatchTotals,
  type BatchInvoiceRow,
} from './batch-invoice-columns';
import { InvoicePackageDialog } from './InvoicePackageDialog';

interface BatchInvoiceTableProps {
  data: BatchInvoiceRow[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  batchNumber?: string;
  isLoading?: boolean;
}

export default function BatchInvoiceTable({
  data,
  rowSelection,
  onRowSelectionChange,
  batchNumber,
  isLoading,
}: BatchInvoiceTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [packageDialog, setPackageDialog] = useState<{
    open: boolean;
    invoiceId: string;
    invoiceNumber: string;
  }>({ open: false, invoiceId: '', invoiceNumber: '' });

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

  const handleViewPackage = useCallback((invoiceId: string, invoiceNumber: string) => {
    setPackageDialog({ open: true, invoiceId, invoiceNumber });
  }, []);

  const columns = useMemo(
    () => createBatchInvoiceColumns({ onViewPackage: handleViewPackage }),
    [handleViewPackage]
  );
  const totals = useMemo(() => computeBatchTotals(data), [data]);

  const handleExportCSV = useCallback(() => {
    if (data.length === 0) return;
    const headers = [
      'Invoice #', 'Customer', 'Load #', 'Driver', 'Status', 'Total', 'Balance',
    ];
    const rows = data.map((row) =>
      [row.invoiceNumber, row.customerName, row.loadNumber, row.driverName,
        row.status, row.total, row.balance].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batchNumber || 'export'}-invoices.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [data, batchNumber]);

  const rowActions = useCallback(
    (row: BatchInvoiceRow) => (
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => downloadPackage(row.invoiceId, row.invoiceNumber)}
                disabled={downloadingId === row.invoiceId}
              >
                {downloadingId === row.invoiceId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PDF Package</TooltipContent>
          </Tooltip>
          <Link href={`/dashboard/invoices/${row.invoiceId}`}>
            <Button variant="ghost" size="sm" className="h-7 px-1.5">
              <FileText className="h-3.5 w-3.5 mr-0.5" /> View
            </Button>
          </Link>
        </div>
      </TooltipProvider>
    ),
    [downloadingId],
  );

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        rowActions={rowActions}
        entityType="batch-invoices"
        filterKey="invoiceNumber,customerName,loadNumber"
        searchPlaceholder="Search invoices..."
        onExport={handleExportCSV}
        emptyMessage="No invoices in this batch"
      />

      {/* Footer Totals */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 text-sm border rounded-lg bg-muted/40">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-muted-foreground text-xs">Total Amount</span>
              <p className="font-semibold">{formatCurrency(totals.amount)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Driver Gross</span>
              <p className="font-semibold">{formatCurrency(totals.driverGross)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Balance</span>
              <p className={`font-semibold ${totals.balance > 0 ? 'text-red-600' : ''}`}>
                {formatCurrency(totals.balance)}
              </p>
            </div>
          </div>
          <span className="text-muted-foreground text-xs">{data.length} invoice(s)</span>
        </div>
      )}

      {/* Invoice Package Preview Dialog */}
      <InvoicePackageDialog
        open={packageDialog.open}
        onOpenChange={(open) => setPackageDialog((prev) => ({ ...prev, open }))}
        invoiceId={packageDialog.invoiceId}
        invoiceNumber={packageDialog.invoiceNumber}
      />
    </div>
  );
}
