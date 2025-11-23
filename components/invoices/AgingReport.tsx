'use client';

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
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { DollarSign, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

async function fetchAgingReport() {
  const response = await fetch(apiUrl('/api/invoices/aging'));
  if (!response.ok) throw new Error('Failed to fetch aging report');
  return response.json();
}

export default function AgingReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['aging-report'],
    queryFn: fetchAgingReport,
  });

  const summary = data?.data?.summary;
  const agingBuckets = data?.data?.agingBuckets;
  const byCustomer = data?.data?.byCustomer || [];

  const chartData = summary
    ? [
        { bucket: 'Current', amount: summary.current },
        { bucket: '1-30', amount: summary['1-30'] },
        { bucket: '31-60', amount: summary['31-60'] },
        { bucket: '61-90', amount: summary['61-90'] },
        { bucket: '90+', amount: summary['90+'] },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Track outstanding invoices by age
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalInvoices} invoices
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.current)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary['31-60'])}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary['90+'])}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aging Buckets</CardTitle>
            <CardDescription>Outstanding amounts by age</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Aging Buckets */}
      {agingBuckets && (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(agingBuckets).map(([bucket, data]: [string, any]) => (
            <Card key={bucket}>
              <CardHeader>
                <CardTitle>
                  {bucket === 'current'
                    ? 'Current (Not Due)'
                    : bucket === '1-30'
                    ? '1-30 Days Past Due'
                    : bucket === '31-60'
                    ? '31-60 Days Past Due'
                    : bucket === '61-90'
                    ? '61-90 Days Past Due'
                    : '90+ Days Past Due'}
                </CardTitle>
                <CardDescription>
                  {formatCurrency(data.total)} • {data.invoices.length} invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No invoices in this bucket
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.invoices.slice(0, 5).map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {invoice.customer.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.balance)}</p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.daysPastDue > 0
                              ? `${invoice.daysPastDue} days`
                              : 'On time'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {data.invoices.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        +{data.invoices.length - 5} more invoices
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* By Customer */}
      {byCustomer.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outstanding by Customer</CardTitle>
            <CardDescription>Customers with outstanding invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total Outstanding</TableHead>
                    <TableHead className="text-right">Invoice Count</TableHead>
                    <TableHead className="text-right">Oldest Invoice</TableHead>
                    <TableHead className="text-right">Days Past Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byCustomer.map((customer: any) => (
                    <TableRow key={customer.customerId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.customerNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(customer.totalOutstanding)}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.invoiceCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(customer.oldestInvoice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.daysPastDue > 0 ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            {customer.daysPastDue} days
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Current
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/customers/${customer.customerId}`}>
                          <Button variant="ghost" size="sm">
                            View
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

      {isLoading && (
        <div className="text-center py-8">Loading aging report...</div>
      )}

      {!isLoading && !summary && (
        <div className="text-center py-8 text-muted-foreground">
          No outstanding invoices found
        </div>
      )}
    </div>
  );
}

