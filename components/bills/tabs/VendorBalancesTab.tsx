'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, DollarSign, Users, FileText } from 'lucide-react';
import { apiUrl, formatCurrency } from '@/lib/utils';

interface VendorBalance {
  vendor: { id: string; name: string; vendorNumber: string };
  totalDue: number;
  billCount: number;
}

export default function VendorBalancesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-balances'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/vendor-bills/balances'));
      if (!res.ok) throw new Error('Failed to fetch balances');
      return res.json();
    },
  });

  const balances: VendorBalance[] = data?.data || [];
  const summary = data?.summary;

  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total AP Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendors with Balance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.vendorCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Bills</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBills}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Number</TableHead>
              <TableHead>Vendor Name</TableHead>
              <TableHead className="text-right">Open Bills</TableHead>
              <TableHead className="text-right">Total Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((item) => (
              <TableRow key={item.vendor.id}>
                <TableCell className="font-medium">{item.vendor.vendorNumber}</TableCell>
                <TableCell>{item.vendor.name}</TableCell>
                <TableCell className="text-right">{item.billCount}</TableCell>
                <TableCell className="text-right font-bold text-red-600">{formatCurrency(item.totalDue)}</TableCell>
                <TableCell>
                  {item.totalDue > 0 ? (
                    <Badge variant="destructive">Outstanding</Badge>
                  ) : (
                    <Badge className="bg-green-600">Settled</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {balances.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No outstanding vendor balances</TableCell>
              </TableRow>
            )}
            {/* Totals */}
            {balances.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{balances.reduce((s, b) => s + b.billCount, 0)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(balances.reduce((s, b) => s + b.totalDue, 0))}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
