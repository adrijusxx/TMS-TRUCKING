'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReconcileFormProps {
  invoiceId: string;
  paymentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReconcileForm({
  invoiceId,
  paymentId,
  open,
  onOpenChange,
}: ReconcileFormProps) {
  const queryClient = useQueryClient();
  const [reconciledAmount, setReconciledAmount] = useState('');
  const [notes, setNotes] = useState('');

  const reconcileMutation = useMutation({
    mutationFn: async (data: {
      invoiceId: string;
      paymentId?: string;
      reconciledAmount: number;
      notes?: string;
    }) => {
      const response = await fetch(apiUrl('/api/reconciliation/reconcile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reconcile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      toast.success('Payment reconciled successfully');
      onOpenChange(false);
      setReconciledAmount('');
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reconcile payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconciledAmount || parseFloat(reconciledAmount) <= 0) {
      toast.warning('Please enter a valid amount');
      return;
    }

    reconcileMutation.mutate({
      invoiceId,
      paymentId: paymentId || undefined,
      reconciledAmount: parseFloat(reconciledAmount),
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reconcile Payment</DialogTitle>
          <DialogDescription>
            Match a payment to this invoice
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reconciledAmount">Reconciled Amount *</Label>
            <Input
              id="reconciledAmount"
              type="number"
              step="0.01"
              value={reconciledAmount}
              onChange={(e) => setReconciledAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reconciliation notes"
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
              disabled={reconcileMutation.isPending}
            >
              {reconcileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reconcile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

