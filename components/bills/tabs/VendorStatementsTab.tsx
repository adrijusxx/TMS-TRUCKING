'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';

export default function VendorStatementsTab() {
  const [vendorId, setVendorId] = React.useState<string>('');
  const [startDate, setStartDate] = React.useState(() =>
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = React.useState(() =>
    format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  );

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendors?limit=200'));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: statementData, isLoading } = useQuery({
    queryKey: ['vendor-statement', vendorId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        vendorId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      const res = await fetch(apiUrl(`/api/vendor-bills/statements?${params}`));
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!vendorId,
  });

  const vendors = vendorsData?.data?.vendors || [];
  const statement = statementData?.data;
  const selectedVendor = vendors.find((v: any) => v.id === vendorId);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="grid gap-2 min-w-[200px]">
          <Label>Vendor</Label>
          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
            <SelectContent>
              {vendors.map((v: any) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>From Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>To Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="mb-0.5">
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      {!vendorId && (
        <div className="text-center py-12 text-muted-foreground">
          Select a vendor to view their statement
        </div>
      )}

      {vendorId && isLoading && (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      )}

      {statement && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statement.totalBilled)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(statement.totalPaid)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(statement.balance)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Statement header */}
          <div className="text-sm text-muted-foreground">
            <strong>{selectedVendor?.name}</strong> &middot; Period: {format(new Date(startDate), 'MMM d, yyyy')} — {format(new Date(endDate), 'MMM d, yyyy')}
          </div>

          {/* Bills table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.bills.map((bill: any) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{format(new Date(bill.billDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(bill.dueDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{bill.description || '-'}</TableCell>
                    <TableCell>{bill.load?.loadNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={bill.status === 'PAID' ? 'default' : 'secondary'}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(bill.amount)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(bill.amountPaid)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(bill.balance)}</TableCell>
                  </TableRow>
                ))}
                {statement.bills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No bills found for this period</TableCell>
                  </TableRow>
                )}
                {/* Totals row */}
                {statement.bills.length > 0 && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={6}>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(statement.totalBilled)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(statement.totalPaid)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(statement.balance)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
