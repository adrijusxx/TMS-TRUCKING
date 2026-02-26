'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PaymentInstrumentPicker } from '@/components/company-expenses/PaymentInstrumentPicker';

interface BatchPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  batchId: string;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    balance: number;
    customer: { name: string };
  }>;
  preSelectedIds?: Set<string>;
}

const PAYMENT_METHODS = ['CHECK', 'WIRE', 'ACH', 'CREDIT_CARD', 'CASH', 'OTHER'] as const;

export default function BatchPaymentDialog({
  open, onClose, batchId, invoices, preSelectedIds,
}: BatchPaymentDialogProps) {
  const queryClient = useQueryClient();
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('CHECK');
  const [paymentInstrumentId, setPaymentInstrumentId] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If pre-selected invoices, filter to those
  const availableInvoices = preSelectedIds && preSelectedIds.size > 0
    ? invoices.filter((inv) => preSelectedIds.has(inv.id))
    : invoices.filter((inv) => inv.balance > 0);

  const selectedInvoice = availableInvoices.find((inv) => inv.id === invoiceId);

  const handleSubmit = async () => {
    if (!invoiceId || !amount || !paymentDate || !paymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/payments/mark'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: numAmount,
          paymentDate: new Date(paymentDate).toISOString(),
          paymentMethod,
          paymentInstrumentId: paymentInstrumentId || undefined,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to record payment');
      }
      toast.success(`Payment of ${formatCurrency(numAmount)} recorded`);
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      resetAndClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setInvoiceId('');
    setAmount('');
    setPaymentInstrumentId(null);
    setReferenceNumber('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark a Payment</DialogTitle>
          <DialogDescription>Record a payment against an invoice in this batch.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Invoice *</Label>
            <Select value={invoiceId} onValueChange={(v) => {
              setInvoiceId(v);
              const inv = availableInvoices.find((i) => i.id === v);
              if (inv) setAmount(String(inv.balance));
            }}>
              <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
              <SelectContent>
                {availableInvoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.customer.name} (bal: {formatCurrency(inv.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" />
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground">Balance: {formatCurrency(selectedInvoice.balance)}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference #</Label>
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Check #, wire ref..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Card / Account</Label>
            <PaymentInstrumentPicker
              value={paymentInstrumentId}
              onChange={setPaymentInstrumentId}
              placeholder="Select card or account (optional)..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment notes..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
