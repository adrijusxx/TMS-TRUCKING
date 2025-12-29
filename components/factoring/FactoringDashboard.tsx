'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { FactoringStatusBadge } from '@/components/invoices/FactoringStatusBadge';
import { FactoringStatus } from '@prisma/client';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FactoringStats {
  submitted: number;
  funded: number;
  reserveReleased: number;
  totalSubmittedAmount: number;
  totalFundedAmount: number;
  totalReserveHeld: number;
  totalFeesPaid: number;
  invoicesDueForRelease: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    reserveAmount: number | null;
    fundedAt: Date | null;
    reserveReleaseDate: Date | null;
    customer: { name: string };
    factoringCompany: { name: string } | null;
  }>;
  submittedInvoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    balance: number;
    submittedToFactorAt: Date | null;
    customer: { name: string };
    factoringCompany: { name: string } | null;
  }>;
  fundedInvoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    advanceAmount: number | null;
    reserveAmount: number | null;
    fundedAt: Date | null;
    reserveReleaseDate: Date | null;
    customer: { name: string };
    factoringCompany: { name: string } | null;
  }>;
  reserveReleaseInvoices: Array<{
    id: string;
    invoiceNumber: string;
    reserveAmount: number | null;
    reserveReleaseDate: Date | null;
    customer: { name: string };
  }>;
}

async function fetchFactoringStats() {
  const response = await fetch(apiUrl('/api/factoring/stats'));
  if (!response.ok) throw new Error('Failed to fetch factoring stats');
  return response.json();
}

export default function FactoringDashboard() {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: FactoringStats }>({
    queryKey: ['factoring-stats'],
    queryFn: fetchFactoringStats,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load factoring statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data.data;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted to Factor</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalSubmittedAmount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funded</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.funded}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalFundedAmount)} advanced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserve Held</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalReserveHeld)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.invoicesDueForRelease.length} due for release
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalFeesPaid)}</div>
            <p className="text-xs text-muted-foreground">Total factoring fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Release Alerts */}
      {stats.invoicesDueForRelease.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Invoices Due for Reserve Release
            </CardTitle>
            <CardDescription>
              {stats.invoicesDueForRelease.length} invoice(s) are ready for reserve release
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.invoicesDueForRelease.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div>
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {invoice.customer.name} • Reserve: {formatCurrency(invoice.reserveAmount || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {invoice.reserveReleaseDate
                        ? formatDate(invoice.reserveReleaseDate.toString())
                        : 'N/A'}
                    </p>
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        Release
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {stats.invoicesDueForRelease.length > 5 && (
                <Link href="/dashboard/invoices?factoringStatus=FUNDED">
                  <Button variant="link" className="w-full">
                    View all {stats.invoicesDueForRelease.length} invoices
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitted Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recently Submitted</CardTitle>
              <CardDescription>Invoices submitted to factoring companies</CardDescription>
            </div>
            <Link href="/dashboard/invoices?factoringStatus=SUBMITTED_TO_FACTOR">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.submittedInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No invoices submitted to factor
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Factoring Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.submittedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell>{invoice.factoringCompany?.name || '-'}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      {invoice.submittedToFactorAt
                        ? formatDate(invoice.submittedToFactorAt.toString())
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <FactoringStatusBadge status={FactoringStatus.SUBMITTED_TO_FACTOR} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Funded Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recently Funded</CardTitle>
              <CardDescription>Invoices funded by factoring companies</CardDescription>
            </div>
            <Link href="/dashboard/invoices?factoringStatus=FUNDED">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.fundedInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No invoices funded yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Factoring Company</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Reserve</TableHead>
                  <TableHead>Funded</TableHead>
                  <TableHead>Release Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.fundedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell>{invoice.factoringCompany?.name || '-'}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(invoice.advanceAmount || 0)}
                    </TableCell>
                    <TableCell className="text-orange-600">
                      {formatCurrency(invoice.reserveAmount || 0)}
                    </TableCell>
                    <TableCell>
                      {invoice.fundedAt ? formatDate(invoice.fundedAt.toString()) : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.reserveReleaseDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.reserveReleaseDate.toString())}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reserve Released */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reserve Released</CardTitle>
              <CardDescription>Recently released reserves</CardDescription>
            </div>
            <Link href="/dashboard/invoices?factoringStatus=RESERVE_RELEASED">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.reserveReleaseInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No reserves released yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reserve Amount</TableHead>
                  <TableHead>Released Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.reserveReleaseInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {formatCurrency(invoice.reserveAmount || 0)}
                    </TableCell>
                    <TableCell>
                      {invoice.reserveReleaseDate
                        ? formatDate(invoice.reserveReleaseDate.toString())
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

