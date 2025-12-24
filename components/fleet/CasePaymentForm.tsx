'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Loader2, DollarSign, CreditCard, Receipt } from 'lucide-react';
import { cn, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

interface CasePaymentFormProps {
  breakdownId: string;
  payments: Payment[];
  totalPaid: number;
  totalCost: number;
}

const PAYMENT_METHODS = [
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
  { value: 'CHECK', label: 'Check', icon: '📝' },
  { value: 'ACH', label: 'ACH Transfer', icon: '🏦' },
  { value: 'WIRE', label: 'Wire Transfer', icon: '🔄' },
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'EFS', label: 'EFS', icon: '⛽' },
  { value: 'COMDATA', label: 'Comdata', icon: '⛽' },
  { value: 'CASHAPP', label: 'Cash App', icon: '📱' },
  { value: 'ZELLE', label: 'Zelle', icon: '📱' },
  { value: 'VENMO', label: 'Venmo', icon: '📱' },
  { value: 'QUICK_PAY', label: 'Quick Pay', icon: '⚡' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
];

async function addPayment(breakdownId: string, data: any) {
  const response = await fetch(apiUrl(`/api/breakdowns/${breakdownId}/payments`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to add payment');
  }
  return response.json();
}

export default function CasePaymentForm({ breakdownId, payments, totalPaid, totalCost }: CasePaymentFormProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CREDIT_CARD',
    referenceNumber: '',
    notes: '',
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => addPayment(breakdownId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-metrics-summary'] });
      toast.success('Payment added');
      setFormData({ amount: '', paymentMethod: 'CREDIT_CARD', referenceNumber: '', notes: '' });
      setShowForm(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    addMutation.mutate({
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      referenceNumber: formData.referenceNumber || undefined,
      notes: formData.notes || undefined,
    });
  };

  const balance = totalCost - totalPaid;
  const getMethodLabel = (method: string) => PAYMENT_METHODS.find(m => m.value === method)?.label || method;
  const getMethodIcon = (method: string) => PAYMENT_METHODS.find(m => m.value === method)?.icon || '💳';

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-background rounded-md border">
          <div className="text-xs text-muted-foreground">Estimated</div>
          <div className="text-sm font-semibold">${totalCost.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
          <div className="text-xs text-green-600 dark:text-green-400">Paid</div>
          <div className="text-sm font-semibold text-green-700 dark:text-green-300">${totalPaid.toFixed(2)}</div>
        </div>
        <div className={cn(
          'p-2 rounded-md border',
          balance > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-background'
        )}>
          <div className={cn('text-xs', balance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground')}>Balance</div>
          <div className={cn('text-sm font-semibold', balance > 0 ? 'text-orange-700 dark:text-orange-300' : '')}>${balance.toFixed(2)}</div>
        </div>
      </div>

      {/* Payments List */}
      {payments.length > 0 && (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">Payment #</TableHead>
                <TableHead className="h-8 text-xs">Method</TableHead>
                <TableHead className="h-8 text-xs text-right">Amount</TableHead>
                <TableHead className="h-8 text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="py-1.5 text-xs font-mono">{payment.paymentNumber}</TableCell>
                  <TableCell className="py-1.5 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {getMethodIcon(payment.paymentMethod)} {getMethodLabel(payment.paymentMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Payment Form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3 border rounded-md p-3 bg-background">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="h-8 text-xs pl-6"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Method *</Label>
              <Select value={formData.paymentMethod} onValueChange={(v) => setFormData(p => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.icon} {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reference # (optional)</Label>
            <Input
              value={formData.referenceNumber}
              onChange={(e) => setFormData(p => ({ ...p, referenceNumber: e.target.value }))}
              placeholder="Check #, confirmation, etc."
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5 mr-1.5" />}
              Add Payment
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Payment
        </Button>
      )}
    </div>
  );
}










