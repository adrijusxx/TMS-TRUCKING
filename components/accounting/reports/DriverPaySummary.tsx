'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DriverPayRow {
  driverId: string;
  driverName: string;
  loadCount: number;
  grossPay: number;
  deductions: number;
  additions: number;
  netPay: number;
}

export function DriverPaySummary() {
  const [rows, setRows] = useState<DriverPayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/accounting/reports/driver-pay?start=${startDate}&end=${endDate}`
      );
      const json = await res.json();
      if (json.success) setRows(json.data);
    } catch (e) {
      console.error('Driver pay fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      loadCount: acc.loadCount + r.loadCount,
      grossPay: acc.grossPay + r.grossPay,
      deductions: acc.deductions + r.deductions,
      additions: acc.additions + r.additions,
      netPay: acc.netPay + r.netPay,
    }),
    { loadCount: 0, grossPay: 0, deductions: 0, additions: 0, netPay: 0 }
  );

  const exportCSV = () => {
    const header = 'Driver,Loads,Gross Pay,Deductions,Additions,Net Pay';
    const csvRows = rows.map((r) =>
      `"${r.driverName}",${r.loadCount},${r.grossPay.toFixed(2)},${r.deductions.toFixed(2)},${r.additions.toFixed(2)},${r.netPay.toFixed(2)}`
    );
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver-pay-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="start">Start Date</Label>
          <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label htmlFor="end">End Date</Label>
          <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div>
        <Button onClick={fetchReport} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Generate
        </Button>
        <Button variant="outline" onClick={exportCSV} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {!loading && rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Driver Pay Summary — {startDate} to {endDate}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Loads</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Additions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.driverId}>
                    <TableCell className="font-medium">{r.driverName}</TableCell>
                    <TableCell className="text-right">{r.loadCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.grossPay)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(r.deductions)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(r.additions)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(r.netPay)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{totals.loadCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.grossPay)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(totals.deductions)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(totals.additions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.netPay)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No settlement data found for this period.</p>
      )}
    </div>
  );
}
