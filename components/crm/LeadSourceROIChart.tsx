'use client';

/**
 * LeadSourceROIChart
 *
 * Visual chart showing lead source performance: total leads, conversion rates,
 * average time to convert, and revenue per source. Uses horizontal bar layout
 * for easy comparison across sources.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

interface SourceROIEntry {
  source: string;
  totalLeads: number;
  hiredCount: number;
  conversionRate: number;
  avgDaysToConvert: number;
  revenueGenerated: number;
}

export default function LeadSourceROIChart() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery<{ success: boolean; data: SourceROIEntry[] }>({
    queryKey: ['crm-source-roi', from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const res = await fetch(`/api/crm/analytics/source-roi?${params}`);
      if (!res.ok) throw new Error('Failed to fetch source ROI');
      return res.json();
    },
  });

  const rows = data?.data ?? [];
  const totalLeads = rows.reduce((s, r) => s + r.totalLeads, 0);
  const totalHired = rows.reduce((s, r) => s + r.hiredCount, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenueGenerated, 0);
  const overallConversion = totalLeads > 0
    ? Math.round((totalHired / totalLeads) * 1000) / 10
    : 0;

  const maxLeads = Math.max(...rows.map((r) => r.totalLeads), 1);

  return (
    <div className="space-y-4">
      {/* Date filters */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-sm w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-sm w-40"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Users} label="Total Leads" value={totalLeads.toLocaleString()} />
        <SummaryCard icon={TrendingUp} label="Conversion Rate" value={`${overallConversion}%`} />
        <SummaryCard icon={Clock} label="Total Hired" value={totalHired.toLocaleString()} />
        <SummaryCard
          icon={DollarSign}
          label="Revenue Generated"
          value={`$${totalRevenue.toLocaleString()}`}
        />
      </div>

      {/* Chart table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No lead data yet</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Source Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-[200px]">Volume</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Hired</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">Avg Days</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell>
                      <Badge variant="outline">{row.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <BarCell value={row.totalLeads} max={maxLeads} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.totalLeads}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {row.hiredCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConversionBadge rate={row.conversionRate} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.avgDaysToConvert > 0 ? `${row.avgDaysToConvert}d` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.revenueGenerated > 0
                        ? `$${row.revenueGenerated.toLocaleString()}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-md">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarCell({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ConversionBadge({ rate }: { rate: number }) {
  const color = rate >= 20
    ? 'text-green-600'
    : rate >= 10
      ? 'text-yellow-600'
      : 'text-red-600';
  return <span className={`font-medium ${color}`}>{rate}%</span>;
}
