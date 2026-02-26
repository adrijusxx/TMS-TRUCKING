'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  Building2,
  Clock,
} from 'lucide-react';

interface DashboardData {
  arAging: {
    current: number;
    days30: number;
    days60: number;
    days90plus: number;
    total: number;
  };
  weeklyRevenue: number;
  weeklyProfit: number;
  lastWeeklyRevenue: number;
  revenueChange: number;
  profitMargin: number;
  pendingSettlements: { count: number; totalAmount: number };
  pendingAdvances: { count: number; totalAmount: number };
  pendingInvoicing: number;
  pendingSettlement: number;
  billingHolds: number;
  factoring: {
    submittedCount: number;
    submittedAmount: number;
    fundedCount: number;
    fundedAmount: number;
    reserveHeld: number;
  };
}

function fmt(n: number) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function AccountingDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accounting/dashboard')
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load dashboard data.</p>;

  const changeIcon = data.revenueChange >= 0
    ? <TrendingUp className="h-4 w-4 text-green-500" />
    : <TrendingDown className="h-4 w-4 text-red-500" />;

  return (
    <div className="space-y-6">
      {/* Top metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            {changeIcon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.weeklyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.revenueChange >= 0 ? '+' : ''}{data.revenueChange.toFixed(1)}% vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {fmt(data.weeklyProfit)} profit this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.arAging.total)}</div>
            <p className="text-xs text-muted-foreground">
              {fmt(data.arAging.days90plus)} overdue 90+
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingSettlements.count}</div>
            <p className="text-xs text-muted-foreground">
              {fmt(data.pendingSettlements.totalAmount)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: AR Aging + Action Items */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* AR Aging Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AR Aging Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AgingRow label="Current" amount={data.arAging.current} total={data.arAging.total} color="bg-green-500" />
              <AgingRow label="1-30 Days" amount={data.arAging.days30} total={data.arAging.total} color="bg-yellow-500" />
              <AgingRow label="31-60 Days" amount={data.arAging.days60} total={data.arAging.total} color="bg-orange-500" />
              <AgingRow label="90+ Days" amount={data.arAging.days90plus} total={data.arAging.total} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ActionItem
                icon={<FileText className="h-4 w-4" />}
                label="Loads ready to invoice"
                count={data.pendingInvoicing}
                href="/dashboard/invoices"
              />
              <ActionItem
                icon={<CreditCard className="h-4 w-4" />}
                label="Loads ready for settlement"
                count={data.pendingSettlement}
                href="/dashboard/settlements"
              />
              <ActionItem
                icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                label="Billing holds"
                count={data.billingHolds}
                href="/dashboard/invoices"
              />
              <ActionItem
                icon={<Clock className="h-4 w-4" />}
                label="Advance requests pending"
                count={data.pendingAdvances.count}
                href="/dashboard/settlements"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factoring Summary */}
      {(data.factoring.submittedCount > 0 || data.factoring.fundedCount > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Factoring Overview</CardTitle>
            <Link href="/dashboard/accounting/factoring" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-lg font-semibold">{data.factoring.submittedCount} invoices</p>
                <p className="text-xs text-muted-foreground">{fmt(data.factoring.submittedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funded</p>
                <p className="text-lg font-semibold">{data.factoring.fundedCount} invoices</p>
                <p className="text-xs text-muted-foreground">{fmt(data.factoring.fundedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserve Held</p>
                <p className="text-lg font-semibold">{fmt(data.factoring.reserveHeld)}</p>
                <p className="text-xs text-muted-foreground">pending release</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AgingRow({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
      <span className="w-24 text-right text-sm font-medium">{fmt(amount)}</span>
    </div>
  );
}

function ActionItem({ icon, label, count, href }: { icon: React.ReactNode; label: string; count: number; href: string }) {
  if (count === 0) return null;
  return (
    <Link href={href} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <Badge variant="secondary">{count}</Badge>
    </Link>
  );
}
