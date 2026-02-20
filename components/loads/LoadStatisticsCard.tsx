'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp, Truck, MapPin, DollarSign, TrendingUp, Fuel, Wrench } from 'lucide-react';
import { apiUrl, formatCurrency, cn } from '@/lib/utils';
import { convertFiltersToQueryParams } from '@/lib/utils/filter-converter';
import type { ColumnFiltersState } from '@tanstack/react-table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProjectedCosts {
  fuelCost: number;
  maintenanceCost: number;
  fixedCosts: number;
  totalOpCost: number;
  netProfit: number;
  avgProfitPerLoad: number;
  metricsConfigured: boolean;
}

interface LoadStatistics {
  totalLoads: number;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  totalRevenue: number;
  totalDriverPay: number;
  totalProfit: number;
  totalFuelAdvance: number;
  totalLoadExpenses: number;
  averageMilesPerLoad: number;
  averageRevenuePerLoad: number;
  averageProfitPerLoad: number;
  utilizationRate: number;
  rpmLoadedMiles?: number | null;
  rpmEmptyMiles?: number | null;
  rpmTotalMiles?: number | null;
  projected?: ProjectedCosts;
}

interface LoadStatisticsCardProps {
  filters?: ColumnFiltersState;
}

export default function LoadStatisticsCard({ filters }: LoadStatisticsCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Build query string from active table filters
  const filterQueryString = React.useMemo(() => {
    if (!filters || filters.length === 0) return '';
    const params = convertFiltersToQueryParams(filters);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [filters]);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['load-statistics', filterQueryString],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/loads/statistics${filterQueryString}`));
      if (!response.ok) throw new Error('Failed to fetch load statistics');
      const result = await response.json();
      return result.data as LoadStatistics;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md border text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">Loading statistics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-md border border-destructive/20 text-xs">
        <span className="text-destructive">Failed to load statistics</span>
      </div>
    );
  }

  const rpm = stats.rpmTotalMiles ?? (stats.totalMiles > 0 ? stats.totalRevenue / stats.totalMiles : 0);
  const hasProjected = stats.projected?.metricsConfigured;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-muted/30 rounded-md border">
        {/* Compact Header Row - Always Visible */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto py-1.5 px-3 flex items-center justify-between hover:bg-muted/50"
          >
            <div className="flex items-center gap-4 flex-wrap text-xs">
              {/* Total Loads */}
              <div className="flex items-center gap-1.5">
                <Truck className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Loads:</span>
                <span className="font-semibold">{stats.totalLoads.toLocaleString()}</span>
              </div>

              {/* Total Miles */}
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Miles:</span>
                <span className="font-semibold">{stats.totalMiles.toLocaleString()}</span>
              </div>

              {/* Revenue */}
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-semibold">{formatCurrency(stats.totalRevenue)}</span>
              </div>

              {/* Profit (Actual) */}
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Profit:</span>
                <span className={cn(
                  "font-semibold",
                  stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(stats.totalProfit)}
                </span>
              </div>

              {/* Projected Net Profit (if configured) */}
              {hasProjected && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Proj:</span>
                  <span className={cn(
                    "font-semibold",
                    (stats.projected?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(stats.projected?.netProfit || 0)}
                  </span>
                </div>
              )}

              {/* RPM */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">RPM:</span>
                <span className={cn(
                  "font-semibold",
                  rpm >= 3 ? "text-green-600" : rpm >= 2 ? "text-amber-600" : "text-red-600"
                )}>
                  ${typeof rpm === 'number' ? rpm.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground ml-2">
              <span className="text-[10px]">{isOpen ? 'Less' : 'More'}</span>
              {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </Button>
        </CollapsibleTrigger>

        {/* Expanded Details */}
        <CollapsibleContent>
          <div className="px-3 pb-2 pt-1 border-t space-y-2">
            {/* Row 1: Miles & Utilization */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-muted-foreground">Loaded Miles:</span>
                <span className="font-medium ml-1">{stats.loadedMiles.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Empty Miles:</span>
                <span className="font-medium ml-1">{stats.emptyMiles.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Utilization:</span>
                <span className="font-medium ml-1">{stats.utilizationRate.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Miles:</span>
                <span className="font-medium ml-1">{stats.averageMilesPerLoad.toLocaleString()}/load</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Revenue:</span>
                <span className="font-medium ml-1">{formatCurrency(stats.averageRevenuePerLoad)}/load</span>
              </div>
              <div>
                <span className="text-muted-foreground">Driver Pay:</span>
                <span className="font-medium ml-1">{formatCurrency(stats.totalDriverPay)}</span>
              </div>
              {stats.rpmLoadedMiles !== null && stats.rpmLoadedMiles !== undefined && (
                <div>
                  <span className="text-muted-foreground">RPM Loaded:</span>
                  <span className="font-medium ml-1">${stats.rpmLoadedMiles.toFixed(2)}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Avg Profit:</span>
                <span className={cn(
                  "font-medium ml-1",
                  stats.averageProfitPerLoad >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(stats.averageProfitPerLoad)}/load
                </span>
              </div>
            </div>

            {/* Row 2: Projected Costs (if configured) */}
            {hasProjected && stats.projected && (
              <div className="border-t pt-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Projected Op Costs (from Settings)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Fuel className="h-3 w-3 text-amber-500" />
                    <span className="text-muted-foreground">Fuel:</span>
                    <span className="font-medium">{formatCurrency(stats.projected.fuelCost)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-blue-500" />
                    <span className="text-muted-foreground">Maint:</span>
                    <span className="font-medium">{formatCurrency(stats.projected.maintenanceCost)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fixed:</span>
                    <span className="font-medium ml-1">{formatCurrency(stats.projected.fixedCosts)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Op Cost:</span>
                    <span className="font-medium ml-1 text-red-500">{formatCurrency(stats.projected.totalOpCost)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proj Net:</span>
                    <span className={cn(
                      "font-medium ml-1",
                      stats.projected.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(stats.projected.netProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proj Avg:</span>
                    <span className={cn(
                      "font-medium ml-1",
                      stats.projected.avgProfitPerLoad >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(stats.projected.avgProfitPerLoad)}/load
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
