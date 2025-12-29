'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CashFlowData {
  upcomingPayments: {
    settlements: number;
    advances: number;
    total: number;
  };
  expectedRevenue: {
    invoiced: number;
    delivered: number;
    total: number;
  };
  netCashFlow: number;
}

export function CashFlowProjection() {
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const fetchCashFlow = async () => {
    try {
      // TODO: Implement cash flow projection API
      // For now, using mock data
      setCashFlow({
        upcomingPayments: {
          settlements: 45000,
          advances: 8500,
          total: 53500,
        },
        expectedRevenue: {
          invoiced: 75000,
          delivered: 32000,
          total: 107000,
        },
        netCashFlow: 53500,
      });
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Projection</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Projection</CardTitle>
        <CardDescription>Next 7 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upcoming Payments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Upcoming Payments</h3>
            </div>
            <span className="text-2xl font-bold text-red-600">
              -${(cashFlow?.upcomingPayments?.total ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="grid gap-2 pl-7">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending Settlements</span>
              <span className="font-medium">
                ${(cashFlow?.upcomingPayments?.settlements ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approved Advances</span>
              <span className="font-medium">
                ${(cashFlow?.upcomingPayments?.advances ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-6" />

        {/* Expected Revenue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Expected Revenue</h3>
            </div>
            <span className="text-2xl font-bold text-green-600">
              +${(cashFlow?.expectedRevenue?.total ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="grid gap-2 pl-7">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoiced (Unpaid)</span>
              <span className="font-medium">
                ${(cashFlow?.expectedRevenue?.invoiced ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivered (Not Invoiced)</span>
              <span className="font-medium">
                ${(cashFlow?.expectedRevenue?.delivered ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-6" />

        {/* Net Cash Flow */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Net Cash Flow</h3>
            </div>
            <span
              className={`text-2xl font-bold ${
                (cashFlow?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(cashFlow?.netCashFlow || 0) >= 0 ? '+' : ''}$
              {(cashFlow?.netCashFlow ?? 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            Projected cash position for the next 7 days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}



