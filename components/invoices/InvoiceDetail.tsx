'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { InvoiceStatus } from '@prisma/client';
import {
  ArrowLeft,
  FileText,
  Download,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface InvoiceDetailProps {
  invoice: any;
  isSheet?: boolean;
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  INVOICED: 'bg-purple-100 text-purple-800 border-purple-200',
  POSTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

function formatStatus(status: InvoiceStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function sendInvoiceEmail(invoiceId: string) {
  const response = await fetch(apiUrl(`/api/invoices/${invoiceId}/send`), {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send invoice email');
  }
  return response.json();
}

async function syncInvoiceToQuickBooks(invoiceId: string, realmId?: string) {
  const response = await fetch(apiUrl('/api/integrations/quickbooks/sync-invoice'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoiceId, realmId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to sync invoice to QuickBooks');
  }
  return response.json();
}

export default function InvoiceDetail({ invoice, isSheet = false }: InvoiceDetailProps) {
  const queryClient = useQueryClient();

  // Overdue warning toast on mount
  useEffect(() => {
    if (invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.dueDate) {
      const dueDate = new Date(invoice.dueDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        toast.warning(`Invoice is ${diffDays} day${diffDays > 1 ? 's' : ''} overdue`, {
          description: `Due date was ${formatDate(invoice.dueDate)}. Consider following up with ${invoice.customer?.name || 'the customer'}.`,
          duration: 8000,
        });
      }
    }
  }, [invoice.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendEmailMutation = useMutation({
    mutationFn: () => sendInvoiceEmail(invoice.id),
    onSuccess: () => {
      toast.success('Invoice email sent successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invoice email');
    },
  });

  const syncQuickBooksMutation = useMutation({
    mutationFn: () => syncInvoiceToQuickBooks(invoice.id),
    onSuccess: (data) => {
      toast.success(data.message || 'Invoice synced to QuickBooks successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync invoice to QuickBooks');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isSheet && (
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[invoice.status as InvoiceStatus]}>
            {formatStatus(invoice.status)}
          </Badge>
          {invoice.qbSynced && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Synced to QuickBooks
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => {
              toast.info('Downloading PDF...', { duration: 2000 });
              window.open(apiUrl(`/api/invoices/${invoice.id}/pdf`), '_blank');
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending || invoice.status === 'PAID'}
          >
            <Mail className="h-4 w-4 mr-2" />
            {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
          <Button
            onClick={() => syncQuickBooksMutation.mutate()}
            disabled={syncQuickBooksMutation.isPending || invoice.qbSynced}
            variant="outline"
          >
            {syncQuickBooksMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : invoice.qbSynced ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Synced
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync to QuickBooks
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bill To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{invoice.customer.name}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer.customerNumber}
            </p>
            {invoice.customer.address && (
              <>
                <p className="text-sm">{invoice.customer.address}</p>
                <p className="text-sm">
                  {invoice.customer.city}, {invoice.customer.state}{' '}
                  {invoice.customer.zip}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoice Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.paidDate && (
              <div>
                <p className="text-sm text-muted-foreground">Paid Date</p>
                <p className="font-medium">{formatDate(invoice.paidDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span className="font-medium">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(invoice.total)}
              </span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="font-medium">
                  {formatCurrency(invoice.amountPaid)}
                </span>
              </div>
            )}
            {invoice.balance > 0 && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        {invoice.loads && invoice.loads.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Loads Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.loads.map((load: any) => (
                      <TableRow key={load.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/loads/${load.id}`}
                            className="text-primary hover:underline"
                          >
                            {load.loadNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {load.pickupCity}, {load.pickupState} →{' '}
                          {load.deliveryCity}, {load.deliveryState}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(load.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

