'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PLData {
  revenue: number;
  driverPay: number;
  totalExpenses: number;
  grossProfit: number;
  factoringFees: number;
  netProfit: number;
  loadCount: number;
  revenuePerMile: number;
}

export function ProfitLossReport() {
  const [data, setData] = useState<PLData | null>(null);
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
        `/api/accounting/reports/profit-loss?start=${startDate}&end=${endDate}`
      );
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error('P&L fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Amount'],
      ['Revenue', data.revenue.toFixed(2)],
      ['Driver Pay', data.driverPay.toFixed(2)],
      ['Expenses', data.totalExpenses.toFixed(2)],
      ['Gross Profit', data.grossProfit.toFixed(2)],
      ['Factoring Fees', data.factoringFees.toFixed(2)],
      ['Net Profit', data.netProfit.toFixed(2)],
      ['Loads', String(data.loadCount)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pl-report-${startDate}-${endDate}.csv`;
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
        <Button variant="outline" onClick={exportCSV} disabled={!data}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {loading && <Skeleton className="h-64 w-full" />}

      {data && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss — {startDate} to {endDate}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <PLRow label="Revenue" value={data.revenue} bold />
                <PLRow label="Driver Pay" value={-data.driverPay} indent />
                <PLRow label="Load Expenses" value={-data.totalExpenses} indent />
                <tr><td colSpan={2}><hr className="my-2" /></td></tr>
                <PLRow label="Gross Profit" value={data.grossProfit} bold />
                <PLRow label="Factoring Fees" value={-data.factoringFees} indent />
                <tr><td colSpan={2}><hr className="my-2" /></td></tr>
                <PLRow label="Net Profit" value={data.netProfit} bold highlight />
                <tr><td colSpan={2} className="pt-4" /></tr>
                <PLRow label="Loads" value={data.loadCount} raw />
                <PLRow label="Avg Revenue/Mile" value={data.revenuePerMile} currency />
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PLRow({ label, value, bold, indent, highlight, raw, currency }: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
  highlight?: boolean;
  raw?: boolean;
  currency?: boolean;
}) {
  const formatted = raw
    ? String(value)
    : currency
    ? formatCurrency(value)
    : (value < 0 ? '(' + formatCurrency(Math.abs(value)) + ')' : formatCurrency(value));

  return (
    <tr className={highlight ? 'bg-primary/5' : ''}>
      <td className={`py-1 ${indent ? 'pl-6' : ''} ${bold ? 'font-semibold' : ''}`}>{label}</td>
      <td className={`py-1 text-right ${bold ? 'font-semibold' : ''} ${value < 0 ? 'text-red-600' : ''}`}>
        {formatted}
      </td>
    </tr>
  );
}
