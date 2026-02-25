'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PageTransition } from '@/components/ui/page-transition';
import { apiUrl, formatCurrency, formatDate } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import type { RowSelectionState } from '@tanstack/react-table';
import {
  Send, ArrowLeft, Loader2, Trash2, DollarSign,
  Plus, RefreshCw, FileDown, ChevronDown, MoreHorizontal,
  ChevronsUpDown,
} from 'lucide-react';
import Link from 'next/link';
import BatchValidationDialog from './BatchValidationDialog';
import BatchInfoCards from './BatchInfoCards';
import BatchInvoiceTable from './BatchInvoiceTable';
import BatchPaymentDialog from './BatchPaymentDialog';
import BatchAddInvoiceDialog from './BatchAddInvoiceDialog';
import { flattenBatchItems, computeBatchTotals } from './batch-invoice-columns';
import { useBatchActions } from './useBatchActions';

interface BatchDetailProps {
  batchId: string;
}

const FILTER_TABS = ['ALL', 'DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const STATUS_COLORS: Record<string, string> = {
  UNPOSTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  POSTED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
};

const EMAIL_COLORS: Record<string, string> = {
  NOT_SENT: 'text-muted-foreground',
  SENT: 'text-green-600',
  PARTIALLY_SENT: 'text-yellow-600',
  FAILED: 'text-red-600',
};

async function fetchBatch(id: string) {
  const response = await fetch(apiUrl(`/api/batches/${id}`));
  if (!response.ok) throw new Error('Failed to fetch batch');
  return response.json();
}

async function fetchEmailLogs(batchId: string) {
  const response = await fetch(apiUrl(`/api/batches/${batchId}/email-logs`));
  if (!response.ok) return { data: [] };
  return response.json();
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function BatchDetail({ batchId }: BatchDetailProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddInvoiceDialog, setShowAddInvoiceDialog] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetchBatch(batchId),
  });

  const { data: emailLogsData } = useQuery({
    queryKey: ['batch-email-logs', batchId],
    queryFn: () => fetchEmailLogs(batchId),
  });

  const batch = data?.data;

  const {
    sendBatchMutation, updateStatusMutation,
    handleBulkStatusChange, handleBulkDelete, handleReconcile,
    handleExportPDF, handleRefresh,
    validationErrors, showValidationDialog, setShowValidationDialog, isExporting,
  } = useBatchActions(batchId, batch);

  const emailLogs: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    if (emailLogsData?.data) {
      for (const log of emailLogsData.data) map[log.invoiceId] = log;
    }
    return map;
  }, [emailLogsData]);

  const filteredItems = useMemo(() => {
    if (!batch?.items) return [];
    if (activeTab === 'ALL') return batch.items;
    return batch.items.filter((item: any) => item.invoice.status === activeTab);
  }, [batch?.items, activeTab]);

  const flatRows = useMemo(
    () => flattenBatchItems(filteredItems, emailLogs),
    [filteredItems, emailLogs],
  );

  const allFlatRows = useMemo(
    () => flattenBatchItems(batch?.items || [], emailLogs),
    [batch?.items, emailLogs],
  );

  const totals = useMemo(() => computeBatchTotals(allFlatRows), [allFlatRows]);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!batch) return <div>Batch not found</div>;

  const emailStatus = batch.emailStatus || 'NOT_SENT';
  const invoiceCount = batch.invoiceCount || batch.items?.length || 0;
  const statusColor = STATUS_COLORS[batch.postStatus] || STATUS_COLORS.UNPOSTED;
  const emailColor = EMAIL_COLORS[emailStatus] || EMAIL_COLORS.NOT_SENT;

  const invoiceList = (batch.items || []).map((item: any) => ({
    id: item.invoice.id,
    invoiceNumber: item.invoice.invoiceNumber,
    total: item.invoice.total,
    balance: item.invoice.balance,
    customer: item.invoice.customer,
  }));

  return (
    <PageTransition>
      <div className="space-y-3">
        {/* Compact Header */}
        <div className="flex items-center gap-3 min-h-[40px]">
          <Link
            href="/dashboard/batches"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{batch.batchNumber}</h1>
            <Badge variant="outline" className={`text-xs shrink-0 ${statusColor}`}>
              {formatStatus(batch.postStatus)}
            </Badge>
          </div>

          <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">
            by {batch.createdBy?.firstName} {batch.createdBy?.lastName} · {formatDate(batch.createdAt)}
          </span>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowAddInvoiceDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
            <Button size="sm" className="h-8"
              onClick={() => sendBatchMutation.mutate()}
              disabled={sendBatchMutation.isPending}>
              {sendBatchMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                : <Send className="h-3.5 w-3.5 mr-1" />}
              Send ({invoiceCount})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPaymentDialog(true)}>
                  <DollarSign className="h-4 w-4 mr-2" /> Mark a Payment
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleReconcile(selectedIds)}
                  disabled={selectedIds.length === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Reconcile Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                  <FileDown className="h-4 w-4 mr-2" /> Export All as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select
              value={batch.postStatus}
              onValueChange={(v: string) => updateStatusMutation.mutate(v as BatchPostStatus)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNPOSTED">Unposted</SelectItem>
                <SelectItem value="POSTED">Posted</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Card */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Invoices</span>
                <p className="text-lg font-semibold tabular-nums">{invoiceCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Total</span>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(batch.totalAmount || totals.amount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Balance</span>
                <p className={`text-lg font-semibold tabular-nums ${totals.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totals.balance)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Email</span>
                <p className={`text-lg font-semibold ${emailColor}`}>{formatStatus(emailStatus)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">MC#</span>
                <p className="text-lg font-semibold">{batch.mcNumber || '—'}</p>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
                  {detailsOpen ? 'Hide' : 'Edit'} Details
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="pt-3 mt-3 border-t">
              <BatchInfoCards batch={batch} batchId={batchId} />
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Invoices Card — tabs + table unified */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as FilterTab); setRowSelection({}); }}>
              <TabsList className="h-8">
                {FILTER_TABS.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="text-xs h-7 px-2">
                    {tab === 'ALL' ? `All (${invoiceCount})` : tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            {selectedIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Bulk ({selectedIds.length}) <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange(selectedIds, 'DRAFT')}>Set DRAFT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange(selectedIds, 'SENT')}>Set SENT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange(selectedIds, 'PAID')}>Set PAID</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => handleBulkDelete(selectedIds)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove from batch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Invoice Table */}
          <BatchInvoiceTable
            data={flatRows}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            batchNumber={batch.batchNumber}
          />
        </Card>
      </div>

      {/* Dialogs */}
      <BatchValidationDialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        errors={validationErrors}
      />
      <BatchPaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        batchId={batchId}
        invoices={invoiceList}
        preSelectedIds={selectedIds.length > 0 ? new Set(selectedIds) : undefined}
      />
      <BatchAddInvoiceDialog
        open={showAddInvoiceDialog}
        onClose={() => setShowAddInvoiceDialog(false)}
        batchId={batchId}
      />
    </PageTransition>
  );
}
