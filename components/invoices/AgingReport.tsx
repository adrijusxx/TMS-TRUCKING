'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { DollarSign, AlertTriangle, Clock, Mail } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

async function fetchAgingReport() {
  const response = await fetch(apiUrl('/api/invoices/aging'));
  if (!response.ok) throw new Error('Failed to fetch aging report');
  return response.json();
}

// Bucket configs: key, display label, color classes, chart fill
const BUCKET_CONFIG = [
  { key: 'current', label: 'Current (Not Due)', headerClass: 'text-green-700', borderClass: 'border-green-300', badgeClass: 'bg-green-100 text-green-800 border-green-200', chartFill: '#22c55e' },
  { key: '1-30', label: '1–30 Days Past Due', headerClass: 'text-amber-600', borderClass: 'border-amber-300', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', chartFill: '#f59e0b' },
  { key: '31-60', label: '31–60 Days Past Due', headerClass: 'text-orange-600', borderClass: 'border-orange-300', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200', chartFill: '#f97316' },
  { key: '61-90', label: '61–90 Days Past Due', headerClass: 'text-red-500', borderClass: 'border-red-300', badgeClass: 'bg-red-100 text-red-700 border-red-200', chartFill: '#ef4444' },
  { key: '90+', label: '90+ Days Past Due', headerClass: 'text-red-700', borderClass: 'border-red-500', badgeClass: 'bg-red-200 text-red-900 border-red-400', chartFill: '#b91c1c' },
];

function getDaysPastDueBadge(days: number) {
  if (days <= 0) return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Current</Badge>;
  if (days <= 30) return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{days}d past due</Badge>;
  if (days <= 60) return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">{days}d past due</Badge>;
  if (days <= 90) return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">{days}d past due</Badge>;
  return <Badge variant="outline" className="bg-red-200 text-red-900 border-red-400">{days}d past due</Badge>;
}

function getReminderMailto(customer: any) {
  const subject = encodeURIComponent(
    `Payment Reminder — ${formatCurrency(customer.totalOutstanding)} Outstanding`
  );
  const body = encodeURIComponent(
    `Dear ${customer.customerName},\n\nThis is a friendly reminder that you have ${customer.invoiceCount} outstanding invoice(s) totaling ${formatCurrency(customer.totalOutstanding)}.\n\nPlease arrange payment at your earliest convenience.\n\nThank you.`
  );
  return `mailto:${customer.customerEmail ?? ''}?subject=${subject}&body=${body}`;
}

export default function AgingReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['aging-report'],
    queryFn: fetchAgingReport,
  });

  const [customerFilter, setCustomerFilter] = useState<string>('all');

  const summary = data?.data?.summary;
  const agingBuckets = data?.data?.agingBuckets;
  const byCustomer: any[] = data?.data?.byCustomer || [];

  const filteredCustomers =
    customerFilter === 'all'
      ? byCustomer
      : byCustomer.filter((c: any) => c.customerId === customerFilter);

  const chartData = summary
    ? BUCKET_CONFIG.map((b) => ({
        bucket: b.key === 'current' ? 'Current' : b.key,
        amount: summary[b.key] ?? 0,
        fill: b.chartFill,
      }))
    : [];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Track outstanding invoices by age</p>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.totalInvoices} invoices</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.current)}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">31–60 Days</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(summary['31-60'])}</div>
            </CardContent>
          </Card>
          <Card className="border-red-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary['90+'])}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart with per-bucket colors */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aging Buckets</CardTitle>
            <CardDescription>Outstanding amounts by age — warmer colors indicate more overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Aging Bucket Cards — color-coded borders */}
      {agingBuckets && (
        <div className="grid gap-4 md:grid-cols-2">
          {BUCKET_CONFIG.map((cfg) => {
            const bucketData = agingBuckets[cfg.key];
            if (!bucketData) return null;
            return (
              <Card key={cfg.key} className={`border-2 ${cfg.borderClass}`}>
                <CardHeader>
                  <CardTitle className={cfg.headerClass}>{cfg.label}</CardTitle>
                  <CardDescription>
                    {formatCurrency(bucketData.total)} &bull; {bucketData.invoices.length} invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bucketData.invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No invoices</p>
                  ) : (
                    <div className="space-y-2">
                      {bucketData.invoices.slice(0, 5).map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                            <p className="text-xs text-muted-foreground">{invoice.customer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(invoice.balance)}</p>
                            <Badge variant="outline" className={`text-xs ${cfg.badgeClass}`}>
                              {invoice.daysPastDue > 0 ? `${invoice.daysPastDue}d` : 'On time'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {bucketData.invoices.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          +{bucketData.invoices.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* By Customer — with filter + Send Reminder button */}
      {byCustomer.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Outstanding by Customer</CardTitle>
                <CardDescription>Customers with outstanding invoices</CardDescription>
              </div>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {byCustomer.map((c: any) => (
                    <SelectItem key={c.customerId} value={c.customerId}>
                      {c.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Oldest</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer: any) => (
                    <TableRow key={customer.customerId}>
                      <TableCell>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-sm text-muted-foreground">{customer.customerNumber}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(customer.totalOutstanding)}
                      </TableCell>
                      <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                      <TableCell className="text-right">{formatDate(customer.oldestInvoice)}</TableCell>
                      <TableCell className="text-right">
                        {getDaysPastDueBadge(customer.daysPastDue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/customers/${customer.customerId}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <a href={getReminderMailto(customer)}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              Remind
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <div className="text-center py-8">Loading aging report...</div>}

      {!isLoading && !summary && (
        <div className="text-center py-8 text-muted-foreground">No outstanding invoices found</div>
      )}
    </div>
  );
}
