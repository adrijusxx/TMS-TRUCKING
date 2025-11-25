'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { InvoiceStatus } from '@prisma/client';

interface InvoiceInlineEditProps {
  row: {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    subStatus?: string | null;
    reconciliationStatus?: string | null;
    paymentMethod?: string | null;
    factoringStatus?: string | null;
    notes?: string | null;
    invoiceNote?: string | null;
    paymentNote?: string | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function updateInvoice(invoiceId: string, data: any) {
  const response = await fetch(apiUrl(`/api/invoices/${invoiceId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update invoice');
  }
  return response.json();
}

export default function InvoiceInlineEdit({ row, onSave, onCancel }: InvoiceInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      status: row.status || 'DRAFT',
      subStatus: row.subStatus || '',
      reconciliationStatus: row.reconciliationStatus || '',
      paymentMethod: row.paymentMethod || '',
      factoringStatus: row.factoringStatus || '',
      notes: row.notes || '',
      invoiceNote: row.invoiceNote || '',
      paymentNote: row.paymentNote || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateInvoice(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', row.id] });
      toast.success('Invoice updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      status: data.status,
      subStatus: data.subStatus || null,
      reconciliationStatus: data.reconciliationStatus || null,
      paymentMethod: data.paymentMethod || null,
      factoringStatus: data.factoringStatus || null,
      notes: data.notes || null,
      invoiceNote: data.invoiceNote || null,
      paymentNote: data.paymentNote || null,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as InvoiceStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="INVOICED">Invoiced</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subStatus">Sub Status</Label>
              <Input id="subStatus" {...register('subStatus')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reconciliationStatus">Reconciliation Status</Label>
              <Select
                value={watch('reconciliationStatus') || 'none'}
                onValueChange={(value) => setValue('reconciliationStatus', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="RECONCILED">Reconciled</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={watch('paymentMethod') || 'none'}
                onValueChange={(value) => setValue('paymentMethod', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="WIRE">Wire Transfer</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="factoringStatus">Factoring Status</Label>
              <Select
                value={watch('factoringStatus') || 'none'}
                onValueChange={(value) => setValue('factoringStatus', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="FUNDED">Funded</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="invoiceNote">Invoice Note</Label>
              <Input id="invoiceNote" {...register('invoiceNote')} />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="paymentNote">Payment Note</Label>
              <Input id="paymentNote" {...register('paymentNote')} />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register('notes')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving || updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




