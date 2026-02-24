'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import {
  Send, ArrowLeft, Loader2, Trash2, Download, Filter,
  DollarSign, Plus, RefreshCw, FileDown, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import BatchValidationDialog from './BatchValidationDialog';
import BatchInfoCards from './BatchInfoCards';
import BatchInvoiceTable from './BatchInvoiceTable';
import BatchPaymentDialog from './BatchPaymentDialog';
import BatchAddInvoiceDialog from './BatchAddInvoiceDialog';

interface BatchDetailProps {
  batchId: string;
}

const FILTER_TABS = ['ALL', 'DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

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

export default function BatchDetail({ batchId }: BatchDetailProps) {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddInvoiceDialog, setShowAddInvoiceDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => fetchBatch(batchId),
  });

  const { data: emailLogsData } = useQuery({
    queryKey: ['batch-email-logs', batchId],
    queryFn: () => fetchEmailLogs(batchId),
  });

  const sendBatchMutation = useMutation({
    mutationFn: async () => {
      const valRes = await fetch(apiUrl(`/api/batches/${batchId}/validate`));
      const valData = await valRes.json();
      if (!valData.data?.ready) {
        setValidationErrors(valData.data?.errors || []);
        setShowValidationDialog(true);
        throw new Error('VALIDATION_BLOCKED');
      }
      const response = await fetch(apiUrl(`/api/batches/${batchId}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to send batch');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batch-email-logs', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch sent successfully');
    },
    onError: (error) => {
      if (error.message !== 'VALIDATION_BLOCKED') toast.error(`Send failed: ${error.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (postStatus: BatchPostStatus) => {
      const response = await fetch(apiUrl(`/api/batches/${batchId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Status updated');
    },
  });

  const batch = data?.data;

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

  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length
    && filteredItems.every((item: any) => selectedIds.has(item.invoice.id));

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredItems.map((item: any) => item.invoice.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkStatusChange = async (status: string) => {
    if (!status || selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((invoiceId) =>
          fetch(apiUrl(`/api/invoices/${invoiceId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      );
      toast.success(`Updated ${selectedIds.size} invoice(s) to ${status}`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
    } catch {
      toast.error('Failed to update invoices');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Remove ${selectedIds.size} invoice(s) from this batch?`)) return;
    try {
      const ids = Array.from(selectedIds).join(',');
      await fetch(apiUrl(`/api/batches/${batchId}/invoices?invoiceIds=${ids}`), { method: 'DELETE' });
      toast.success(`Removed ${selectedIds.size} invoice(s)`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
    } catch {
      toast.error('Failed to remove invoices');
    }
  };

  const handleReconcile = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select invoices to reconcile');
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedIds).map((invoiceId) =>
          fetch(apiUrl(`/api/invoices/${invoiceId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reconciliationStatus: 'RECONCILED' }),
          })
        )
      );
      toast.success(`Reconciled ${selectedIds.size} invoice(s)`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
    } catch {
      toast.error('Failed to reconcile');
    }
  };

  const handleExportPDF = useCallback(async () => {
    if (!batch?.items?.length) return;
    setIsExporting(true);
    try {
      // Download PDF packages sequentially to avoid overwhelming the server
      for (const item of batch.items) {
        const inv = item.invoice;
        const response = await fetch(apiUrl(`/api/invoices/${inv.id}/package`));
        if (!response.ok) continue;
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${inv.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      toast.success(`Exported ${batch.items.length} invoice PDF(s)`);
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [batch?.items]);

  const handleExportCSV = useCallback(() => {
    if (!filteredItems.length) return;
    const headers = ['Invoice #', 'Customer', 'Load #', 'Driver', 'Status', 'Total', 'Balance'];
    const rows = filteredItems.map((item: any) => {
      const inv = item.invoice;
      const driverName = inv.load?.driver?.user
        ? `${inv.load.driver.user.firstName} ${inv.load.driver.user.lastName}` : '';
      return [inv.invoiceNumber, inv.customer?.name, inv.load?.loadNumber || '', driverName,
        inv.status, inv.total, inv.balance].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batch?.batchNumber || batchId}-invoices.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [filteredItems, batch?.batchNumber, batchId]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
    queryClient.invalidateQueries({ queryKey: ['batch-email-logs', batchId] });
    toast.success('Refreshed');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!batch) return <div>Batch not found</div>;

  // Flatten invoice list for payment dialog
  const invoiceList = (batch.items || []).map((item: any) => ({
    id: item.invoice.id,
    invoiceNumber: item.invoice.invoiceNumber,
    total: item.invoice.total,
    balance: item.invoice.balance,
    customer: item.invoice.customer,
  }));

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <Tabs defaultValue="batches">
        <TabsList>
          <TabsTrigger value="batches" asChild>
            <Link href="/dashboard/batches">Batches</Link>
          </TabsTrigger>
          <TabsTrigger value="invoices" asChild>
            <Link href="/dashboard/accounting?tab=invoices">Invoices</Link>
          </TabsTrigger>
          <TabsTrigger value="aging" asChild>
            <Link href="/dashboard/accounting?tab=aging">Aging report</Link>
          </TabsTrigger>
          <TabsTrigger value="reports" asChild>
            <Link href="/dashboard/accounting?tab=reports">Invoice reports</Link>
          </TabsTrigger>
          <TabsTrigger value="reconciliation" asChild>
            <Link href="/dashboard/accounting?tab=reconciliation">Reconciliation</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/batches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h2 className="text-xl font-bold">{batch.batchNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"
            onClick={() => sendBatchMutation.mutate()}
            disabled={sendBatchMutation.isPending}>
            {sendBatchMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Send ({batch.items?.length || 0})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPaymentDialog(true)}>
            <DollarSign className="h-4 w-4 mr-1" /> Mark a Payment
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddInvoiceDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add load
          </Button>
          <Button variant="outline" size="sm" onClick={handleReconcile}>
            <RefreshCw className="h-4 w-4 mr-1" /> Reconcile
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
            Export as PDF
          </Button>
          <Select
            value={batch.postStatus}
            onValueChange={(v: string) => updateStatusMutation.mutate(v as BatchPostStatus)}>
            <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="UNPOSTED">UNPOSTED</SelectItem>
              <SelectItem value="POSTED">POSTED</SelectItem>
              <SelectItem value="PAID">PAID</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {batch.mcNumber && (
          <div className="text-sm px-3 py-1 rounded border bg-muted">
            MC NUMBER: <span className="font-medium">{batch.mcNumber}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as FilterTab); setSelectedIds(new Set()); }}>
          <TabsList className="h-8">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs h-7 px-2">
                {tab === 'ALL' ? `All (${batch.items?.length || 0})` : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        {selectedIds.size > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk actions ({selectedIds.size}) <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkStatusChange('DRAFT')}>Set DRAFT</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange('SENT')}>Set SENT</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange('PAID')}>Set PAID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove from batch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Cards + Editable Fields */}
      <BatchInfoCards batch={batch} batchId={batchId} emailLogsData={emailLogsData} />

      {/* Invoice Table */}
      <BatchInvoiceTable
        items={filteredItems}
        emailLogs={emailLogs}
        selectedIds={selectedIds}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        allSelected={allSelected}
      />

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Total amount sum: <span className="font-medium text-foreground">
            {formatCurrency(filteredItems.reduce((s: number, i: any) => s + (i.invoice.total || 0), 0))}
          </span>
        </div>
        <div>{filteredItems.length} of {batch.items?.length || 0} invoice(s)</div>
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
        preSelectedIds={selectedIds.size > 0 ? selectedIds : undefined}
      />
      <BatchAddInvoiceDialog
        open={showAddInvoiceDialog}
        onClose={() => setShowAddInvoiceDialog(false)}
        batchId={batchId}
      />
    </div>
  );
}
