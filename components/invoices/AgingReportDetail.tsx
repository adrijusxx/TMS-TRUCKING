'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { apiUrl, formatCurrency, formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

interface AgingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
  subStatus: string | null;
  reconciliationStatus: string;
  mcNumber: string | null;
  invoiceNote: string | null;
  paymentNote: string | null;
  loadId: string | null;
  agingDays: number;
  isOverdue: boolean;
  customer: { id: string; name: string };
  load: { loadNumber: string } | null;
}

const RECONCILIATION_COLORS: Record<string, string> = {
  NOT_RECONCILED: 'bg-gray-100 text-gray-700 border-gray-200',
  PARTIALLY_RECONCILED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FULLY_RECONCILED: 'bg-green-100 text-green-800 border-green-200',
};

function getAgingBadge(days: number) {
  if (days <= 0) return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Current</Badge>;
  if (days <= 30) return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">{days}d</Badge>;
  if (days <= 60) return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">{days}d</Badge>;
  if (days <= 90) return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">{days}d</Badge>;
  return <Badge variant="outline" className="bg-red-200 text-red-900 border-red-400">{days}d</Badge>;
}

export default function AgingReportDetail() {
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = React.useState(() =>
    format(startOfMonth(subMonths(new Date(), 3)), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = React.useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );

  const { data, isLoading } = useQuery({
    queryKey: ['aging-report-detail', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({ view: 'detail' });
      if (fromDate) params.set('fromDate', new Date(fromDate).toISOString());
      if (toDate) params.set('toDate', new Date(toDate).toISOString());
      const res = await fetch(apiUrl(`/api/invoices/aging?${params}`));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const invoices: AgingInvoice[] = data?.data?.invoices || [];
  const totals = data?.data?.totals;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="grid gap-1.5">
          <Label className="text-xs">From Date</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-[150px]" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">To Date</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-[150px]" />
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['aging-report-detail'] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Load #</TableHead>
              <TableHead>MC Number</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sub Status</TableHead>
              <TableHead className="text-center">Aging</TableHead>
              <TableHead>Aging Status</TableHead>
              <TableHead className="text-right">Accrual</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Reconciliation</TableHead>
              <TableHead>Invoice Note</TableHead>
              <TableHead>Payment Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(15)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : invoices.length > 0 ? (
              <>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/50">
                    <TableCell>{inv.customer.name}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/invoices/${inv.invoiceNumber || inv.id}`} className="text-primary hover:underline font-medium">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.load?.loadNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.mcNumber || '-'}</TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.subStatus || '-'}</TableCell>
                    <TableCell className="text-center">{getAgingBadge(inv.agingDays)}</TableCell>
                    <TableCell>
                      {inv.isOverdue ? (
                        <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">ON TIME</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(inv.amountPaid)}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{formatCurrency(inv.balance)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={RECONCILIATION_COLORS[inv.reconciliationStatus] || ''}>
                        {inv.reconciliationStatus.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-muted-foreground">{inv.invoiceNote || '-'}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-muted-foreground">{inv.paymentNote || '-'}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-semibold border-t-2">
                  <TableCell colSpan={9}>Totals ({invoices.length} invoices)</TableCell>
                  <TableCell className="text-right">{totals ? formatCurrency(totals.total) : '-'}</TableCell>
                  <TableCell className="text-right text-green-600">{totals ? formatCurrency(totals.amountPaid) : '-'}</TableCell>
                  <TableCell className="text-right text-red-600 font-bold">{totals ? formatCurrency(totals.balance) : '-'}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                  No outstanding invoices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
