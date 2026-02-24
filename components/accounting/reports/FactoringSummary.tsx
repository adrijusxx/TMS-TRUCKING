'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FactoringData {
  submittedCount: number;
  submittedAmount: number;
  fundedCount: number;
  fundedAmount: number;
  reserveHeld: number;
  reserveReleased: number;
  totalFeesPaid: number;
  netAfterFactoring: number;
}

export function FactoringSummary() {
  const [data, setData] = useState<FactoringData | null>(null);
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
        `/api/accounting/reports/factoring?start=${startDate}&end=${endDate}`
      );
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error('Factoring fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Count', 'Amount'],
      ['Submitted', String(data.submittedCount), data.submittedAmount.toFixed(2)],
      ['Funded', String(data.fundedCount), data.fundedAmount.toFixed(2)],
      ['Reserve Held', '', data.reserveHeld.toFixed(2)],
      ['Reserve Released', '', data.reserveReleased.toFixed(2)],
      ['Total Fees Paid', '', data.totalFeesPaid.toFixed(2)],
      ['Net After Factoring', '', data.netAfterFactoring.toFixed(2)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factoring-summary-${startDate}-${endDate}.csv`;
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Submissions & Funding</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <MetricRow label="Invoices Submitted" value={`${data.submittedCount} (${formatCurrency(data.submittedAmount)})`} />
              <MetricRow label="Invoices Funded" value={`${data.fundedCount} (${formatCurrency(data.fundedAmount)})`} />
              <MetricRow label="Net After Factoring" value={formatCurrency(data.netAfterFactoring)} bold />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Reserves & Fees</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <MetricRow label="Reserve Held" value={formatCurrency(data.reserveHeld)} />
              <MetricRow label="Reserve Released" value={formatCurrency(data.reserveReleased)} />
              <MetricRow label="Total Fees Paid" value={formatCurrency(data.totalFeesPaid)} red />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : ''} ${red ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  );
}
