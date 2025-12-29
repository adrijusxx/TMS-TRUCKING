'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { Plus, DollarSign, FileText, Receipt, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  type: string;
  referenceNumber?: string | null;
  notes?: string | null;
  hasReceipt: boolean;
  hasInvoice: boolean;
  documentIds: string[];
  mcNumber?: {
    id: string;
    number: string;
  } | null;
}

interface PaymentTrackingProps {
  entityId: string;
  entityType: 'fuel' | 'breakdown';
  payments: Payment[];
  mcNumberId?: string | null;
  canEdit?: boolean;
}

export default function PaymentTracking({
  entityId,
  entityType,
  payments: initialPayments,
  mcNumberId,
  canEdit = true,
}: PaymentTrackingProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'OTHER',
    referenceNumber: '',
    notes: '',
    hasReceipt: false,
    hasInvoice: false,
    mcNumberId: mcNumberId || '',
  });
  const queryClient = useQueryClient();

  // Fetch payments
  const { data: paymentsData, refetch } = useQuery({
    queryKey: [`${entityType}-payments`, entityId],
    queryFn: async () => {
      const response = await fetch(
        apiUrl(`/api/payments?${entityType === 'fuel' ? 'fuelEntryId' : 'breakdownId'}=${entityId}`)
      );
      if (!response.ok) throw new Error('Failed to fetch payments');
      const result = await response.json();
      return result.data || [];
    },
    initialData: initialPayments,
  });

  const payments = paymentsData || initialPayments;

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl('/api/payments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: entityType === 'fuel' ? 'FUEL' : 'BREAKDOWN',
          [entityType === 'fuel' ? 'fuelEntryId' : 'breakdownId']: entityId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      setShowPaymentDialog(false);
      setPaymentData({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'OTHER',
        referenceNumber: '',
        notes: '',
        hasReceipt: false,
        hasInvoice: false,
        mcNumberId: mcNumberId || '',
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });

  const handleCreatePayment = () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    createPaymentMutation.mutate(paymentData);
  };

  const paymentMethodLabels: Record<string, string> = {
    CHECK: 'Check',
    WIRE: 'Wire Transfer',
    ACH: 'ACH',
    CREDIT_CARD: 'Credit Card',
    CASH: 'Cash',
    OTHER: 'Other',
    FACTOR: 'Factoring',
    QUICK_PAY: 'Quick Pay',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payments
              </CardTitle>
              <CardDescription>
                Track payments for this {entityType === 'fuel' ? 'fuel entry' : 'breakdown'}
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment: Payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{payment.paymentNumber}</Badge>
                      <span className="font-semibold text-lg">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.hasReceipt && (
                        <Badge variant="secondary" className="text-xs">
                          <Receipt className="h-3 w-3 mr-1" />
                          Receipt
                        </Badge>
                      )}
                      {payment.hasInvoice && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Invoice
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Payment Date</p>
                      <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium">
                        {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                      </p>
                    </div>
                    {payment.mcNumber && (
                      <div>
                        <p className="text-muted-foreground">MC Number</p>
                        <p className="font-medium">#{payment.mcNumber.number}</p>
                      </div>
                    )}
                    {payment.referenceNumber && (
                      <div>
                        <p className="text-muted-foreground">Reference Number</p>
                        <p className="font-medium">{payment.referenceNumber}</p>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{payment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No payments recorded yet</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Payment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for this {entityType === 'fuel' ? 'fuel entry' : 'breakdown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) =>
                  setPaymentData({ ...paymentData, paymentMethod: value })
                }
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                placeholder="Check number, transaction ID, etc."
                value={paymentData.referenceNumber}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, referenceNumber: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasReceipt"
                  checked={paymentData.hasReceipt}
                  onCheckedChange={(checked) =>
                    setPaymentData({ ...paymentData, hasReceipt: checked === true })
                  }
                />
                <Label htmlFor="hasReceipt" className="cursor-pointer">
                  Has Receipt
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasInvoice"
                  checked={paymentData.hasInvoice}
                  onCheckedChange={(checked) =>
                    setPaymentData({ ...paymentData, hasInvoice: checked === true })
                  }
                />
                <Label htmlFor="hasInvoice" className="cursor-pointer">
                  Has Invoice
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this payment"
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={createPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={createPaymentMutation.isPending || !paymentData.amount}
            >
              {createPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

