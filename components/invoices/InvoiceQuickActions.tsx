'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreVertical,
  Send,
  CheckCircle2,
  DollarSign,
  FileText,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { Invoice, FactoringStatus, PaymentMethod } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { FactoringStatusBadge } from './FactoringStatusBadge';
import { PaymentMethodBadge } from './PaymentMethodBadge';

interface InvoiceQuickActionsProps {
  invoice: Partial<Invoice> & {
    id: string;
    customer: { name: string; customerNumber: string };
    factoringCompany?: { name: string } | null;
  };
  onActionComplete?: () => void;
}

export function InvoiceQuickActions({ invoice, onActionComplete }: InvoiceQuickActionsProps) {
  const [action, setAction] = useState<'resend' | 'markPaid' | 'applyPayment' | 'submitToFactor' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleResendInvoice = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/invoices/${invoice.id}/resend`), {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resend invoice');

      toast.success('Invoice Resent', {
        description: `Invoice ${invoice.invoiceNumber} has been resent to ${invoice.customer.name}`,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onActionComplete?.();
      setAction(null);
    } catch (error) {
      toast.error('Failed to resend invoice', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/invoices/${invoice.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          amountPaid: invoice.total,
          balance: 0,
          paidDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to mark invoice as paid');

      toast.success('Invoice Marked as Paid', {
        description: `Invoice ${invoice.invoiceNumber} has been marked as paid`,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onActionComplete?.();
      setAction(null);
    } catch (error) {
      toast.error('Failed to mark invoice as paid', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitToFactor = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/invoices/${invoice.id}/submit-to-factor`), {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to submit invoice to factor');

      toast.success('Invoice Submitted to Factor', {
        description: `Invoice ${invoice.invoiceNumber} has been submitted to factoring company`,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onActionComplete?.();
      setAction(null);
    } catch (error) {
      toast.error('Failed to submit to factor', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitToFactor =
    invoice.factoringStatus === 'NOT_FACTORED' &&
    (invoice.balance ?? 0) > 0 &&
    invoice.factoringCompany;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAction('resend')}>
            <Send className="h-4 w-4 mr-2" />
            Resend Invoice
          </DropdownMenuItem>
          {invoice.status !== 'PAID' && (
            <DropdownMenuItem onClick={() => setAction('markPaid')}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Paid
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setAction('applyPayment')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Apply Payment
          </DropdownMenuItem>
          {canSubmitToFactor && (
            <DropdownMenuItem onClick={() => setAction('submitToFactor')}>
              <Building2 className="h-4 w-4 mr-2" />
              Submit to Factor
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Resend Invoice Dialog */}
      <Dialog open={action === 'resend'} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to resend invoice {invoice.invoiceNumber} to {invoice.customer.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleResendInvoice} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Resend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={action === 'markPaid'} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark invoice {invoice.invoiceNumber} as fully paid?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit to Factor Dialog */}
      <Dialog open={action === 'submitToFactor'} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit to Factor</DialogTitle>
            <DialogDescription>
              Submit invoice {invoice.invoiceNumber} to {invoice.factoringCompany?.name || 'factoring company'}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Factoring Status:</span>
              <FactoringStatusBadge status={invoice.factoringStatus || 'NOT_FACTORED'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="font-medium">${(invoice.balance ?? 0).toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitToFactor} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit to Factor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

