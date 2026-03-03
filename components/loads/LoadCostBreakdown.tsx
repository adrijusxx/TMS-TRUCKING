'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ProfitabilityBadge } from './ProfitabilityBadge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Fuel,
  CircleDollarSign,
  Truck,
  ReceiptText,
} from 'lucide-react';

// ----- Types -----

interface LoadExpenseItem {
  expenseType: string;
  amount: number;
}

interface AccessorialItem {
  chargeType: string;
  amount: number;
}

export interface LoadCostBreakdownProps {
  revenue: number;
  fuelSurcharge?: number;
  accessorialCharges?: AccessorialItem[];
  driverPay?: number | null;
  totalExpenses?: number;
  expenses?: LoadExpenseItem[];
  estimatedFuelCost?: number | null;
  totalMiles?: number | null;
  className?: string;
}

// ----- Helpers -----

function getMarginColorClass(marginPercent: number): string {
  if (marginPercent > 15) return 'text-green-600';
  if (marginPercent >= 5) return 'text-yellow-600';
  return 'text-red-600';
}

function getMarginBgClass(marginPercent: number): string {
  if (marginPercent > 15) return 'bg-green-50 border-green-200';
  if (marginPercent >= 5) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

// ----- Component -----

export function LoadCostBreakdown({
  revenue,
  fuelSurcharge = 0,
  accessorialCharges = [],
  driverPay,
  totalExpenses = 0,
  expenses = [],
  estimatedFuelCost,
  totalMiles,
  className,
}: LoadCostBreakdownProps) {
  const breakdown = useMemo(() => {
    const accessorialTotal = accessorialCharges.reduce((sum, a) => sum + a.amount, 0);
    const totalRevenue = revenue + fuelSurcharge + accessorialTotal;

    const effectiveDriverPay = driverPay ?? 0;
    const driverPayPercent = totalRevenue > 0
      ? (effectiveDriverPay / totalRevenue) * 100
      : 0;

    // Break down expenses by type
    const tollExpenses = expenses
      .filter((e) => e.expenseType === 'TOLL')
      .reduce((sum, e) => sum + e.amount, 0);
    const fuelExpenses = estimatedFuelCost ?? expenses
      .filter((e) => e.expenseType === 'FUEL_ADDITIVE' || e.expenseType === 'DEF')
      .reduce((sum, e) => sum + e.amount, 0);
    const otherExpenses = totalExpenses - tollExpenses - fuelExpenses;

    const totalCosts = effectiveDriverPay + totalExpenses;
    const netMargin = totalRevenue - totalCosts;
    const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;
    const revenuePerMile = totalMiles && totalMiles > 0 ? totalRevenue / totalMiles : null;

    return {
      totalRevenue,
      lineHaul: revenue,
      fuelSurcharge,
      accessorialTotal,
      effectiveDriverPay,
      driverPayPercent,
      tollExpenses,
      fuelExpenses,
      otherExpenses: Math.max(0, otherExpenses),
      totalCosts,
      netMargin,
      marginPercent,
      revenuePerMile,
    };
  }, [revenue, fuelSurcharge, accessorialCharges, driverPay, totalExpenses, expenses, estimatedFuelCost, totalMiles]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Cost Breakdown</CardTitle>
          <ProfitabilityBadge marginPercent={breakdown.marginPercent} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Section */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Revenue
          </h4>
          <CostRow
            icon={<DollarSign className="h-3.5 w-3.5" />}
            label="Line Haul"
            amount={breakdown.lineHaul}
          />
          {breakdown.fuelSurcharge > 0 && (
            <CostRow
              icon={<Fuel className="h-3.5 w-3.5" />}
              label="Fuel Surcharge"
              amount={breakdown.fuelSurcharge}
            />
          )}
          {breakdown.accessorialTotal > 0 && (
            <CostRow
              icon={<ReceiptText className="h-3.5 w-3.5" />}
              label="Accessorials"
              amount={breakdown.accessorialTotal}
            />
          )}
          <div className="flex justify-between border-t pt-1.5 font-medium text-sm">
            <span>Total Revenue</span>
            <span>{formatCurrency(breakdown.totalRevenue)}</span>
          </div>
        </div>

        {/* Costs Section */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Costs
          </h4>
          <CostRow
            icon={<Truck className="h-3.5 w-3.5" />}
            label={`Driver Pay (${breakdown.driverPayPercent.toFixed(0)}%)`}
            amount={breakdown.effectiveDriverPay}
            negative
          />
          {breakdown.fuelExpenses > 0 && (
            <CostRow
              icon={<Fuel className="h-3.5 w-3.5" />}
              label={estimatedFuelCost != null ? 'Fuel (estimated)' : 'Fuel'}
              amount={breakdown.fuelExpenses}
              negative
            />
          )}
          {breakdown.tollExpenses > 0 && (
            <CostRow
              icon={<CircleDollarSign className="h-3.5 w-3.5" />}
              label="Tolls"
              amount={breakdown.tollExpenses}
              negative
            />
          )}
          {breakdown.otherExpenses > 0 && (
            <CostRow
              icon={<ReceiptText className="h-3.5 w-3.5" />}
              label="Other Expenses"
              amount={breakdown.otherExpenses}
              negative
            />
          )}
          <div className="flex justify-between border-t pt-1.5 font-medium text-sm">
            <span>Total Costs</span>
            <span className="text-red-600">-{formatCurrency(breakdown.totalCosts)}</span>
          </div>
        </div>

        {/* Net Margin */}
        <div
          className={cn(
            'rounded-lg border p-3',
            getMarginBgClass(breakdown.marginPercent)
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {breakdown.netMargin >= 0 ? (
                <TrendingUp className={cn('h-4 w-4', getMarginColorClass(breakdown.marginPercent))} />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">Net Margin</span>
            </div>
            <div className="text-right">
              <div className={cn('text-lg font-bold', getMarginColorClass(breakdown.marginPercent))}>
                {formatCurrency(breakdown.netMargin)}
              </div>
              <div className={cn('text-xs', getMarginColorClass(breakdown.marginPercent))}>
                {breakdown.marginPercent.toFixed(1)}% margin
              </div>
            </div>
          </div>
          {breakdown.revenuePerMile !== null && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              Revenue per mile: {formatCurrency(breakdown.revenuePerMile)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ----- Sub-component -----

function CostRow({
  icon,
  label,
  amount,
  negative = false,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={negative ? 'text-red-600' : ''}>
        {negative ? '-' : ''}{formatCurrency(amount)}
      </span>
    </div>
  );
}
