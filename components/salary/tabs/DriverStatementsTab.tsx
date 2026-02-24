'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface SettlementRow {
  id: string;
  settlementNumber: string;
  status: string;
  grossPay: number;
  deductions: number;
  advances: number;
  netPay: number;
  periodStart: string;
  periodEnd: string;
  paidDate: string | null;
  loadIds: string[];
  driver: {
    id: string;
    driverNumber: string;
    user: { firstName: string; lastName: string };
    mcNumber?: { mcNumber: string } | null;
    assignedTruck?: { truckNumber: string } | null;
  };
  salaryBatch?: { id: string; batchNumber: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

export default function DriverStatementsTab() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [fromDate, setFromDate] = React.useState(() =>
    format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = React.useState(() =>
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['driver-statements', statusFilter, fromDate, toDate, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (fromDate) params.set('fromDate', new Date(fromDate).toISOString());
      if (toDate) params.set('toDate', new Date(toDate).toISOString());

      const res = await fetch(apiUrl(`/api/settlements?${params}`));
      if (!res.ok) throw new Error('Failed to fetch settlements');
      return res.json();
    },
  });

  const settlements: SettlementRow[] = data?.data || [];
  const meta = data?.meta;

  const totals = React.useMemo(() => {
    return settlements.reduce(
      (acc, s) => ({
        grossPay: acc.grossPay + s.grossPay,
        deductions: acc.deductions + s.deductions,
        advances: acc.advances + s.advances,
        netPay: acc.netPay + s.netPay,
        trips: acc.trips + (s.loadIds?.length || 0),
      }),
      { grossPay: 0, deductions: 0, advances: 0, netPay: 0, trips: 0 }
    );
  }, [settlements]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="grid gap-1.5">
          <Label className="text-xs">From Date</Label>
          <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="h-9 w-[150px]" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">To Date</Label>
          <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="h-9 w-[150px]" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="DISPUTED">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['driver-statements'] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Settlement #</TableHead>
              <TableHead>Batch #</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>MC Number</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-center">Trips</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Advances</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead>Paid Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(13)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : settlements.length > 0 ? (
              <>
                {settlements.map((s) => (
                  <TableRow
                    key={s.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/accounting/salary?tab=statements&settlementId=${s.id}`)}
                  >
                    <TableCell className="font-medium text-primary">{s.settlementNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{s.salaryBatch?.batchNumber || '-'}</TableCell>
                    <TableCell>{s.driver.user.firstName} {s.driver.user.lastName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.driver.mcNumber?.mcNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{s.driver.assignedTruck?.truckNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(s.periodStart), 'MMM d')} - {format(new Date(s.periodEnd), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-center">{s.loadIds?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[s.status] || ''}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(s.grossPay)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(s.deductions)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(s.advances)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(s.netPay)}</TableCell>
                    <TableCell>{s.paidDate ? format(new Date(s.paidDate), 'MMM d, yyyy') : '-'}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-semibold border-t-2">
                  <TableCell colSpan={6}>Totals ({settlements.length} settlements)</TableCell>
                  <TableCell className="text-center">{totals.trips}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{formatCurrency(totals.grossPay)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(totals.deductions)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(totals.advances)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totals.netPay)}</TableCell>
                  <TableCell />
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  No settlements found for the selected period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
