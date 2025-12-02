'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import BatchInvoiceSelector from './BatchInvoiceSelector';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface CreateBatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedInvoiceIds?: string[];
}

export default function CreateBatchForm({ open, onOpenChange, preselectedInvoiceIds = [] }: CreateBatchFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(preselectedInvoiceIds);
  const [mcNumberId, setMcNumberId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Update selected invoices when preselectedInvoiceIds changes
  useEffect(() => {
    if (preselectedInvoiceIds.length > 0) {
      setSelectedInvoiceIds(preselectedInvoiceIds);
    }
  }, [preselectedInvoiceIds]);

  // Fetch all MC numbers to get the number string from ID
  const { data: mcNumbersData } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
      if (!response.ok) return [];
      const result = await response.json();
      // Ensure we always return an array
      return Array.isArray(result.data) ? result.data : [];
    },
  });

  // Get MC number string from selected ID
  const getMcNumberString = (id: string): string | undefined => {
    if (!mcNumbersData || !Array.isArray(mcNumbersData)) return undefined;
    const mcNumber = mcNumbersData.find((mc: any) => mc.id === id);
    return mcNumber?.number;
  };

  const createBatchMutation = useMutation({
    mutationFn: async (data: {
      invoiceIds: string[];
      mcNumber?: string;
      notes?: string;
    }) => {
      const response = await fetch(apiUrl('/api/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create batch');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      onOpenChange(false);
      router.push(`/dashboard/accounting/batches/${data.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceIds.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    // Get MC number string from ID if selected
    const mcNumberString = mcNumberId ? getMcNumberString(mcNumberId) : undefined;

    createBatchMutation.mutate({
      invoiceIds: selectedInvoiceIds,
      mcNumber: mcNumberString || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Select invoices to group into a batch
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1 min-h-0">
          <McNumberSelector
            value={mcNumberId}
            onValueChange={setMcNumberId}
            label="MC Number (Optional)"
            required={false}
          />

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Select Invoices</Label>
              {preselectedInvoiceIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {preselectedInvoiceIds.length} invoice(s) preselected from invoice list
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <BatchInvoiceSelector
                selectedInvoiceIds={selectedInvoiceIds}
                onSelectionChange={setSelectedInvoiceIds}
                excludeInvoiceIds={[]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this batch"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBatchMutation.isPending || selectedInvoiceIds.length === 0}
            >
              {createBatchMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Batch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

