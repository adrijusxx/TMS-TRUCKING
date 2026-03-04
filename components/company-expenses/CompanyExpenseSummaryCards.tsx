'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Clock, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { apiUrl, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryData {
  thisMonth: number;
  lastMonth: number;
  pendingApprovalCount: number;
  missingReceiptCount: number;
  byDepartment: Array<{ department: string; total: number; count: number }>;
  byInstrument: Array<{ instrument: { id: string; name: string; color: string | null; lastFour: string | null } | null; total: number }>;
  monthlyTrend: Array<{ month: string; total: number }>;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  OPERATIONS: 'Operations',
  FLEET: 'Fleet',
  RECRUITING: 'Recruiting',
  DISPATCH: 'Dispatch',
  SAFETY: 'Safety',
  ACCOUNTING: 'Accounting',
  ADMIN: 'Admin',
  OTHER: 'Other',
};

export function CompanyExpenseSummaryCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['company-expenses-summary'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/company-expenses/summary'));
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data as SummaryData;
    },
    staleTime: 60_000,
  });

  const momChange = data
    ? data.lastMonth > 0
      ? ((data.thisMonth - data.lastMonth) / data.lastMonth) * 100
      : null
    : null;

  const maxDept = data?.byDepartment[0]?.total ?? 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* This Month */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{formatCurrency(data?.thisMonth ?? 0)}</div>
          {momChange !== null && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${momChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {momChange > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(momChange).toFixed(1)}% vs last month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Month */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Last Month
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{formatCurrency(data?.lastMonth ?? 0)}</div>
        </CardContent>
      </Card>

      {/* Pending Approval */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{data?.pendingApprovalCount ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">expenses awaiting review</div>
        </CardContent>
      </Card>

      {/* Missing Receipts */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Missing Receipts
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className={`text-2xl font-bold ${(data?.missingReceiptCount ?? 0) > 0 ? 'text-amber-600' : ''}`}>
            {data?.missingReceiptCount ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">48+ hours old</div>
        </CardContent>
      </Card>

      {/* Department breakdown — inline with summary cards on xl screens */}
      {data && data.byDepartment.length > 0 && (
        <Card className="col-span-2 md:col-span-4 xl:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">By Department</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-1.5">
              {data.byDepartment.slice(0, 4).map((dept) => (
                <div key={dept.department} className="flex justify-between items-center text-xs gap-2">
                  <span className="font-medium truncate">{DEPARTMENT_LABELS[dept.department] ?? dept.department}</span>
                  <span className="text-muted-foreground whitespace-nowrap tabular-nums">{formatCurrency(dept.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
