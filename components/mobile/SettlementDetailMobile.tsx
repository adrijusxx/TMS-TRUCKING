'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface SettlementLine {
  description: string;
  amount: number;
  type: 'earning' | 'deduction' | 'addition';
}

interface SettlementDetail {
  id: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  totalAdditions: number;
  loads: Array<{
    loadNumber: string;
    pickup: string;
    delivery: string;
    miles: number;
    driverPay: number;
  }>;
  deductions: SettlementLine[];
  additions: SettlementLine[];
}

interface SettlementDetailMobileProps {
  settlementId: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
};

export default function SettlementDetailMobile({ settlementId }: SettlementDetailMobileProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['settlement-detail', settlementId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/mobile/driver/settlements/${settlementId}`));
      if (!response.ok) throw new Error('Failed to fetch settlement');
      const result = await response.json();
      return result.data as SettlementDetail;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 dark:border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link href="/driver/settlements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Pay Statement</h1>
            {data && (
              <p className="text-sm text-muted-foreground">
                #{data.settlementNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error || !data ? (
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">
                {error ? 'Error loading statement' : 'Statement not found'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
                </div>
                <Badge className={statusColors[data.status] || 'bg-gray-100'}>
                  {data.status.charAt(0) + data.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground">Net Pay</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.netPay)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loads */}
          {data.loads.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Loads ({data.loads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.loads.map((load, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <div>
                      <span className="font-medium">#{load.loadNumber}</span>
                      <p className="text-xs text-muted-foreground">
                        {load.pickup} → {load.delivery}
                      </p>
                    </div>
                    <span className="font-medium">{formatCurrency(load.driverPay)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Gross Pay</span>
                  <span>{formatCurrency(data.grossPay)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additions */}
          {data.additions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  Additions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.additions.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{item.description}</span>
                    <span className="text-green-600">+{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Total Additions</span>
                  <span className="text-green-600">+{formatCurrency(data.totalAdditions)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deductions */}
          {data.deductions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1 text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.deductions.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{item.description}</span>
                    <span className="text-red-600">-{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-{formatCurrency(data.totalDeductions)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Breakdown */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross Pay</span>
                <span>{formatCurrency(data.grossPay)}</span>
              </div>
              {data.totalAdditions > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">+ Additions</span>
                  <span className="text-green-600">+{formatCurrency(data.totalAdditions)}</span>
                </div>
              )}
              {data.totalDeductions > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">- Deductions</span>
                  <span className="text-red-600">-{formatCurrency(data.totalDeductions)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Net Pay</span>
                <span className="text-green-600">{formatCurrency(data.netPay)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
