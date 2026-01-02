'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, ExternalLink, FileWarning, BadgeDollarSign, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { sendPodReminder } from '@/app/actions/invoices/send-pod-reminder';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

async function fetchWatchdogs() {
  const response = await fetch(apiUrl('/api/invoices/watchdogs'));
  if (!response.ok) throw new Error('Failed to fetch watchdogs');
  return response.json();
}

export default function WatchdogList() {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendReminder = async (loadId: string, email: string) => {
    if (!email) {
      toast.error('No dispatcher email available');
      return;
    }
    setSendingId(loadId);
    try {
      const result = await sendPodReminder(loadId, email);
      if (result.success) {
        toast.success('Reminder sent to dispatcher');
      } else {
        toast.error(result.error || 'Failed to send reminder');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSendingId(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['watchdogs'],
    queryFn: fetchWatchdogs,
  });

  const overdue = data?.data?.overdueInvoices || { count: 0, totalAmount: 0, invoices: [] };
  const unreconciled = data?.data?.unreconciledPayments || { count: 0, totalAmount: 0, payments: [] };
  const unposted = data?.data?.unpostedBatches || { count: 0, totalAmount: 0, batches: [] };
  const missingDocs = data?.data?.missingDocuments || { count: 0, loads: [] };
  const readyToBill = data?.data?.readyToBill || { count: 0, totalAmount: 0, loads: [] };

  console.log('Watchdog Missing Docs Data:', missingDocs);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            Monitor critical invoice issues requiring attention
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className={missingDocs.count > 0 ? 'border-red-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-red-500" />
              Missing Documents
            </CardTitle>
            <CardDescription>Delivered loads missing PODs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{missingDocs.count}</div>
            <p className="text-sm text-muted-foreground">
              {missingDocs.count === 0 ? 'All documents up to date' : `${missingDocs.count} loads req. attention`}
            </p>
          </CardContent>
        </Card>

        <Card className={readyToBill.count > 0 ? 'border-green-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-green-500" />
              Ready to Bill
            </CardTitle>
            <CardDescription>Loads ready for invoicing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{readyToBill.count}</div>
            <p className="text-sm text-muted-foreground">
              {readyToBill.count === 0 ? 'No pending invoices' : `${formatCurrency(readyToBill.totalAmount)} to bill`}
            </p>
          </CardContent>
        </Card>
        <Card className={overdue.count > 0 ? 'border-orange-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Overdue Invoices
            </CardTitle>
            <CardDescription>Invoices past due date with outstanding balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overdue.count}</div>
            <p className="text-sm text-muted-foreground">
              {overdue.count === 0
                ? 'No overdue invoices'
                : `${formatCurrency(overdue.totalAmount)} outstanding`}
            </p>
          </CardContent>
        </Card>

        <Card className={unreconciled.count > 0 ? 'border-red-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Unreconciled Payments
            </CardTitle>
            <CardDescription>Payments not matched to invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreconciled.count}</div>
            <p className="text-sm text-muted-foreground">
              {unreconciled.count === 0
                ? 'All payments reconciled'
                : `${formatCurrency(unreconciled.totalAmount)} unmatched`}
            </p>
          </CardContent>
        </Card>

        <Card className={unposted.count > 0 ? 'border-yellow-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Unposted Batches
            </CardTitle>
            <CardDescription>Batches not yet sent to factoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unposted.count}</div>
            <p className="text-sm text-muted-foreground">
              {unposted.count === 0
                ? 'All batches posted'
                : `${formatCurrency(unposted.totalAmount)} pending`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Lists */}
      {missingDocs.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Documents (PODs)</CardTitle>
            <CardDescription>Loads delivered but missing Proof of Delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Delivered Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingDocs.loads.slice(0, 10).map((load: any) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">{load.loadNumber}</TableCell>
                      <TableCell>{load.customer?.name}</TableCell>
                      <TableCell>{load.driverName}</TableCell>
                      <TableCell>{load.deliveredAt ? formatDate(load.deliveredAt) : '-'}</TableCell>
                      <TableCell className="text-right">
                        {load.dispatcherEmail ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={sendingId === load.id}
                            onClick={() => handleSendReminder(load.id, load.dispatcherEmail)}
                          >
                            {sendingId === load.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Mail className="h-3 w-3 mr-1" />
                            )}
                            {sendingId === load.id ? 'Sending...' : 'Email Dispatcher'}
                          </Button>
                        ) : (
                          <Link href={`/dashboard/loads/${load.id}`}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              Upload Manually <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {readyToBill.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Bill</CardTitle>
            <CardDescription>Loads delivered and documented, ready for invoicing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Delivered Date</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readyToBill.loads.slice(0, 10).map((load: any) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">{load.loadNumber}</TableCell>
                      <TableCell>{load.customer?.name}</TableCell>
                      <TableCell>{load.deliveredAt ? formatDate(load.deliveredAt) : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(load.revenue)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/invoices/generate?loadId=${load.id}`}>
                          <Button variant="ghost" size="sm">
                            Create Invoice <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {overdue.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue Invoices</CardTitle>
            <CardDescription>Invoices requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Past Due</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.invoices.slice(0, 10).map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.customer.customerNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                          {invoice.daysPastDue} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        {formatCurrency(invoice.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {overdue.invoices.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 10 of {overdue.invoices.length} overdue invoices
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {unreconciled.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unreconciled Payments</CardTitle>
            <CardDescription>Payments that need to be matched to invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unreconciled.payments.slice(0, 10).map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                      <TableCell>
                        {payment.invoice ? (
                          <Link
                            href={`/dashboard/invoices/${payment.invoice.id}`}
                            className="text-primary hover:underline"
                          >
                            {payment.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">No invoice</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/invoices/reconciliation`}>
                          <Button variant="ghost" size="sm">
                            Reconcile <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {unreconciled.payments.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 10 of {unreconciled.payments.length} unreconciled payments
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {unposted.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unposted Batches</CardTitle>
            <CardDescription>Batches ready to be sent to factoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Invoice Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unposted.batches.slice(0, 10).map((batch: any) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                      <TableCell>{formatDate(batch.createdAt)}</TableCell>
                      <TableCell className="text-right">{batch.invoiceCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(batch.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/accounting/batches/${batch.id}`}>
                          <Button variant="ghost" size="sm">
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {unposted.batches.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 10 of {unposted.batches.length} unposted batches
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && <div className="text-center py-8">Loading watchdogs...</div>}

      {!isLoading && overdue.count === 0 && unreconciled.count === 0 && unposted.count === 0 && missingDocs.count === 0 && readyToBill.count === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
            <p className="text-muted-foreground">
              No overdue invoices, unreconciled payments, or unposted batches.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

