'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useReactTable, getCoreRowModel, getSortedRowModel, type SortingState, type ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, DollarSign, Users, CheckCircle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface DispatcherCommission {
  id: string;
  dispatcherId: string;
  dispatcher: { firstName: string; lastName: string };
  load: { loadNumber: string; revenue: number; deliveredAt: string | null };
  commissionType: string;
  percentage: number | null;
  flatAmount: number | null;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  createdAt: string;
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'PAID': return <Badge className="bg-green-600">Paid</Badge>;
    case 'APPROVED': return <Badge className="bg-blue-600">Approved</Badge>;
    default: return <Badge variant="secondary">Pending</Badge>;
  }
};

export default function DispatcherSalaryTab() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [fromDate, setFromDate] = React.useState(() =>
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = React.useState(() =>
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );

  const { data, isLoading } = useQuery({
    queryKey: ['dispatcher-commissions', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: new Date(fromDate).toISOString(),
        endDate: new Date(toDate).toISOString(),
      });
      const res = await fetch(apiUrl(`/api/dispatcher-commissions?${params}`));
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const commissions: DispatcherCommission[] = data?.data || [];
  const totalAmount = commissions.reduce((s, c) => s + c.amount, 0);
  const pendingCount = commissions.filter((c) => c.status === 'PENDING').length;
  const pendingAmount = commissions
    .filter((c) => c.status === 'PENDING')
    .reduce((s, c) => s + c.amount, 0);

  // Group by dispatcher for summary
  const byDispatcher = React.useMemo(() => {
    const map = new Map<string, { name: string; total: number; loads: number; pending: number }>();
    for (const c of commissions) {
      const key = c.dispatcherId;
      const existing = map.get(key);
      if (existing) {
        existing.total += c.amount;
        existing.loads += 1;
        if (c.status === 'PENDING') existing.pending += c.amount;
      } else {
        map.set(key, {
          name: `${c.dispatcher.firstName} ${c.dispatcher.lastName}`,
          total: c.amount,
          loads: 1,
          pending: c.status === 'PENDING' ? c.amount : 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [commissions]);

  const enrichedCommissions = React.useMemo(() => commissions.map(c => ({
    ...c,
    dispatcherName: `${c.dispatcher.firstName} ${c.dispatcher.lastName}`,
    loadNumber: c.load.loadNumber,
    revenue: c.load.revenue,
  })), [commissions]);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { id: 'select', enableSorting: false },
    { accessorKey: 'dispatcherName', header: 'Dispatcher' },
    { accessorKey: 'loadNumber', header: 'Load' },
    { accessorKey: 'revenue', header: 'Revenue' },
    { accessorKey: 'commissionType', header: 'Commission Type' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'createdAt', header: 'Date' },
  ], []);

  const table = useReactTable({
    data: enrichedCommissions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch(apiUrl('/api/dispatcher-commissions/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${selectedIds.size} commissions approved`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['dispatcher-commissions'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">{commissions.length} loads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispatchers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byDispatcher.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + actions */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="grid gap-1">
          <Label className="text-xs">From Date</Label>
          <Input type="date" className="h-9 w-36" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">To Date</Label>
          <Input type="date" className="h-9 w-36" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex-1" />
        {selectedIds.size > 0 && (
          <Button size="sm" onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-1" /> Approve ({selectedIds.size})
          </Button>
        )}
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      {/* Commissions table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" className="rounded"
                  checked={selectedIds.size === commissions.filter(c => c.status === 'PENDING').length && commissions.some(c => c.status === 'PENDING')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(commissions.filter(c => c.status === 'PENDING').map(c => c.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
              </TableHead>
              <SortableHeader column={table.getColumn('dispatcherName')!}>Dispatcher</SortableHeader>
              <SortableHeader column={table.getColumn('loadNumber')!}>Load</SortableHeader>
              <SortableHeader column={table.getColumn('revenue')!}>Revenue</SortableHeader>
              <SortableHeader column={table.getColumn('commissionType')!}>Commission Type</SortableHeader>
              <SortableHeader column={table.getColumn('amount')!} className="text-right">Amount</SortableHeader>
              <SortableHeader column={table.getColumn('status')!}>Status</SortableHeader>
              <SortableHeader column={table.getColumn('createdAt')!}>Date</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const c = row.original;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.status === 'PENDING' && (
                      <input type="checkbox" className="rounded"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{c.dispatcher.firstName} {c.dispatcher.lastName}</TableCell>
                  <TableCell>{c.load.loadNumber}</TableCell>
                  <TableCell>{formatCurrency(c.load.revenue)}</TableCell>
                  <TableCell>
                    {c.commissionType === 'PERCENTAGE' ? `${c.percentage}%` : formatCurrency(c.flatAmount || 0)}
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(c.amount)}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>{format(new Date(c.createdAt), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              );
            })}
            {commissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No dispatcher commissions found</TableCell>
              </TableRow>
            )}
            {/* Totals */}
            {commissions.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={5}>Total</TableCell>
                <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
