'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitabilityBadgeProps {
  revenue: number;
  driverPay: number;
  totalExpenses?: number;
  className?: string;
}

/**
 * Calculates profit margin and shows a warning badge if margin < 15%.
 * Critical highlight when margin < 0%.
 */
export default function ProfitabilityBadge({
  revenue,
  driverPay,
  totalExpenses = 0,
  className,
}: ProfitabilityBadgeProps) {
  if (!revenue || revenue <= 0) return null;

  const totalCosts = (driverPay || 0) + totalExpenses;
  const profit = revenue - totalCosts;
  const margin = (profit / revenue) * 100;

  // Only show badge for low margins
  if (margin >= 15) return null;

  const isCritical = margin < 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isCritical ? 'destructive' : 'outline'}
            className={cn(
              'text-[10px] h-4 gap-0.5',
              isCritical
                ? 'animate-pulse'
                : 'border-yellow-400 bg-yellow-50 text-yellow-700',
              className
            )}
          >
            {isCritical ? (
              <TrendingDown className="h-2.5 w-2.5" />
            ) : (
              <AlertTriangle className="h-2.5 w-2.5" />
            )}
            {margin.toFixed(0)}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {isCritical ? 'Negative Margin' : 'Low Margin Warning'}
            </p>
            <p>Margin: {margin.toFixed(1)}%</p>
            <p>Revenue: ${revenue.toLocaleString()}</p>
            <p>Driver Pay: ${(driverPay || 0).toLocaleString()}</p>
            {totalExpenses > 0 && <p>Expenses: ${totalExpenses.toLocaleString()}</p>}
            <p>Net Profit: ${profit.toLocaleString()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
