'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceStatus } from '@prisma/client';
import { FileText, Building2, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    name: string;
    customerNumber: string;
  };
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  paidAmount?: number;
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatStatus(status: InvoiceStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchInvoice(id: string) {
  const response = await fetch(`/api/invoices/${id}`);
  if (!response.ok) throw new Error('Failed to fetch invoice');
  return response.json();
}

interface InvoiceQuickViewProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceQuickView({ invoiceId, open, onOpenChange }: InvoiceQuickViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => fetchInvoice(invoiceId!),
    enabled: !!invoiceId && open,
  });

  const invoice: Invoice | undefined = data?.data;
  const balance = invoice ? invoice.total - (invoice.paidAmount || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>Quick view of invoice information</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading invoice details
          </div>
        ) : !invoice ? (
          <div className="text-center py-8 text-muted-foreground">
            Invoice not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{invoice.invoiceNumber}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {invoice.customer.name} ({invoice.customer.customerNumber})
                </p>
              </div>
              <Badge
                variant="outline"
                className={`${statusColors[invoice.status as InvoiceStatus]}`}
              >
                {formatStatus(invoice.status)}
              </Badge>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Invoice Date
                </p>
                <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <Separator />

            {/* Customer */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Customer
              </h4>
              <p className="font-medium">{invoice.customer.name}</p>
              <p className="text-sm text-muted-foreground">
                Customer #{invoice.customer.customerNumber}
              </p>
            </div>

            <Separator />

            {/* Financial Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.paidAmount !== undefined && invoice.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(invoice.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Balance</span>
                      <span className={`font-medium ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {invoiceId && (
                <Link href={`/dashboard/invoices/${invoiceId}`}>
                  <Button>
                    View Full Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

