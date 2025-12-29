'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricsData {
  pendingSettlements: {
    count: number;
    totalAmount: number;
  };
  pendingAdvances: {
    count: number;
    totalAmount: number;
  };
  weeklyRevenue: number;
  weeklyProfit: number;
  profitMargin: number;
}

export function AccountingMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const [settlementsRes, advancesRes] = await Promise.all([
        fetch('/api/settlements/pending-approval'),
        fetch('/api/advances?status=PENDING'),
      ]);

      const settlementsData = await settlementsRes.json();
      const advancesData = await advancesRes.json();

      setMetrics({
        pendingSettlements: {
          count: settlementsData.summary?.totalSettlements || 0,
          totalAmount: settlementsData.summary?.totalAmount || 0,
        },
        pendingAdvances: {
          count: advancesData.data?.length || 0,
          totalAmount:
            advancesData.data?.reduce((sum: number, adv: any) => sum + adv.amount, 0) || 0,
        },
        weeklyRevenue: 0, // TODO: Implement weekly revenue calculation
        weeklyProfit: 0, // TODO: Implement weekly profit calculation
        profitMargin: 0, // TODO: Implement profit margin calculation
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.pendingSettlements.count || 0}</div>
          <p className="text-xs text-muted-foreground">
            ${(metrics?.pendingSettlements.totalAmount || 0).toLocaleString()} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Advance Requests</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.pendingAdvances.count || 0}</div>
          <p className="text-xs text-muted-foreground">
            ${(metrics?.pendingAdvances.totalAmount || 0).toLocaleString()} requested
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(metrics?.weeklyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">This week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(metrics?.profitMargin || 0).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            ${(metrics?.weeklyProfit || 0).toLocaleString()} profit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}





