'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BalanceData {
  advanceBalance: number;
  advanceLimit: number;
  availableCredit: number;
  pendingAdvances: number;
  lastSettlementAmount: number;
  lastSettlementDate: string;
}

export function DriverBalanceCard({ driverId }: { driverId: string }) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, [driverId]);

  const fetchBalance = async () => {
    try {
      const response = await fetch(`/api/advances/driver/${driverId}`);
      const data = await response.json();

      if (data.success) {
        setBalance({
          advanceBalance: data.data.outstandingBalance,
          advanceLimit: data.data.advanceLimit,
          availableCredit: data.data.availableCredit,
          pendingAdvances: 0, // TODO: Get from API
          lastSettlementAmount: 0, // TODO: Get from API
          lastSettlementDate: '', // TODO: Get from API
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Advances</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ${balance?.advanceBalance.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">To be deducted from next settlement</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${balance?.availableCredit.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Limit: ${balance?.advanceLimit.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Settlement</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${balance?.lastSettlementAmount.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {balance?.lastSettlementDate
              ? new Date(balance.lastSettlementDate).toLocaleDateString()
              : 'No settlements yet'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{balance?.pendingAdvances || 0}</div>
          <p className="text-xs text-muted-foreground">Advance requests pending approval</p>
        </CardContent>
      </Card>
    </div>
  );
}





