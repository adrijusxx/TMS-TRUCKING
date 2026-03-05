'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { BatchPostStatus } from '@prisma/client';
import { toast } from 'sonner';

export function useBatchActions(batchId: string, batch: any) {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const invalidateBatch = () => {
    queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
    queryClient.invalidateQueries({ queryKey: ['batch-email-logs', batchId] });
    queryClient.invalidateQueries({ queryKey: ['batches'] });
  };

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
      invalidateBatch();
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
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      invalidateBatch();
      toast.success('Status updated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleBulkStatusChange = async (selectedIds: string[], status: string) => {
    if (!status || selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((invoiceId) =>
          fetch(apiUrl(`/api/invoices/${invoiceId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      );
      toast.success(`Updated ${selectedIds.length} invoice(s) to ${status}`);
      invalidateBatch();
    } catch {
      toast.error('Failed to update invoices');
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Remove ${selectedIds.length} invoice(s) from this batch?`)) return;
    try {
      const ids = selectedIds.join(',');
      await fetch(apiUrl(`/api/batches/${batchId}/invoices?invoiceIds=${ids}`), { method: 'DELETE' });
      toast.success(`Removed ${selectedIds.length} invoice(s)`);
      invalidateBatch();
    } catch {
      toast.error('Failed to remove invoices');
    }
  };

  const handleReconcile = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      toast.error('Select invoices to reconcile');
      return;
    }
    try {
      await Promise.all(
        selectedIds.map((invoiceId) =>
          fetch(apiUrl(`/api/invoices/${invoiceId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reconciliationStatus: 'RECONCILED' }),
          })
        )
      );
      toast.success(`Reconciled ${selectedIds.length} invoice(s)`);
      invalidateBatch();
    } catch {
      toast.error('Failed to reconcile');
    }
  };

  const handleExportPDF = useCallback(async () => {
    if (!batch?.items?.length) return;
    setIsExporting(true);
    try {
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

  const handleRefresh = () => {
    invalidateBatch();
    toast.success('Refreshed');
  };

  return {
    sendBatchMutation,
    updateStatusMutation,
    handleBulkStatusChange,
    handleBulkDelete,
    handleReconcile,
    handleExportPDF,
    handleRefresh,
    validationErrors,
    showValidationDialog,
    setShowValidationDialog,
    isExporting,
  };
}
