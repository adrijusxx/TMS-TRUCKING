'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Truck,
    MapPin,
    DollarSign,
    TrendingUp,
    Fuel,
    Wrench,
    Briefcase,
    Activity,
    Percent,
    Wallet,
    ArrowRight
} from 'lucide-react';
import { formatCurrency, apiUrl, cn } from '@/lib/utils';

// Reuse interface from LoadStatisticsCard
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

async function fetchLoadStatistics(): Promise<LoadStatistics> {
    const response = await fetch(apiUrl('/api/loads/statistics'));
    if (!response.ok) throw new Error('Failed to fetch load statistics');
    const result = await response.json();
    return result.data;
}

function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className
}: {
    title: string;
    value: string | number;
    icon: any;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function ComprehensiveProfitAnalytics() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['load-statistics-comprehensive'],
        queryFn: fetchLoadStatistics,
        refetchInterval: 60000,
    });

    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>;
    }

    if (error || !stats) {
        return (
            <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-6">
                    <p className="text-destructive">Failed to load profitability statistics.</p>
                </CardContent>
            </Card>
        );
    }

    const rpm = stats.rpmTotalMiles ?? (stats.totalMiles > 0 ? stats.totalRevenue / stats.totalMiles : 0);
    const rpmColor = rpm >= 3 ? "text-green-600" : rpm >= 2 ? "text-amber-600" : "text-red-600";
    const profitColor = stats.totalProfit >= 0 ? "text-green-600" : "text-red-600";
    const hasProjected = stats.projected?.metricsConfigured;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Core Financials */}
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={DollarSign}
                    description={`${stats.totalLoads} total loads`}
                />
                <StatCard
                    title="Gross Profit"
                    value={formatCurrency(stats.totalProfit)}
                    icon={TrendingUp}
                    className={stats.totalProfit >= 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}
                    description="Revenue - Expenses - Driver Pay"
                />
                <StatCard
                    title="Total Miles"
                    value={stats.totalMiles.toLocaleString()}
                    icon={MapPin}
                    description={`${stats.utilizationRate.toFixed(1)}% Utilization (Loaded)`}
                />
                <StatCard
                    title="RPM (Total)"
                    value={`$${rpm.toFixed(2)}`}
                    icon={Activity}
                    className={cn("border-l-4", rpm >= 2.5 ? "border-l-green-500" : rpm >= 1.8 ? "border-l-amber-500" : "border-l-red-500")}
                    description={stats.rpmLoadedMiles ? `$${stats.rpmLoadedMiles.toFixed(2)} Loaded RPM` : undefined}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Cost Breakdown */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Cost Breakdown</CardTitle>
                        <CardDescription>Where the money goes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Driver Pay</span>
                            </div>
                            <span className="font-bold">{formatCurrency(stats.totalDriverPay)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium">Load Expenses</span>
                            </div>
                            <span className="font-bold">{formatCurrency(stats.totalLoadExpenses)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-muted-foreground">Total Direct Costs</span>
                            <span className="font-bold text-red-500">{formatCurrency(stats.totalDriverPay + stats.totalLoadExpenses)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Operational Performance */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Operational Efficiency</CardTitle>
                        <CardDescription>Per-load performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Avg Revenue / Load</span>
                            <span className="font-medium">{formatCurrency(stats.averageRevenuePerLoad)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Avg Profit / Load</span>
                            <span className={cn("font-medium", stats.averageProfitPerLoad >= 0 ? "text-green-600" : "text-red-600")}>
                                {formatCurrency(stats.averageProfitPerLoad)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Avg Miles / Load</span>
                            <span className="font-medium">{Math.round(stats.averageMilesPerLoad)} mi</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 mt-2">
                            <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${stats.utilizationRate}%` }}
                                title="Utilization Rate"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Loaded: {stats.loadedMiles.toLocaleString()}</span>
                            <span>Empty: {stats.emptyMiles.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Projected Costs (if available) */}
                {hasProjected && stats.projected && (
                    <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle>Projected Net Profit</CardTitle>
                            <CardDescription>Including estimated overhead</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Fuel className="h-3 w-3" /> Est. Fuel
                                    </span>
                                    <p className="font-medium">{formatCurrency(stats.projected.fuelCost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Wrench className="h-3 w-3" /> Est. Maint
                                    </span>
                                    <p className="font-medium">{formatCurrency(stats.projected.maintenanceCost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Fixed Costs</span>
                                    <p className="font-medium">{formatCurrency(stats.projected.fixedCosts)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Total Op Costs</span>
                                    <p className="font-medium text-red-500">{formatCurrency(stats.projected.totalOpCost)}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-primary/20">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold">Net Profit</span>
                                    <span className={cn("text-xl font-bold", stats.projected.netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                                        {formatCurrency(stats.projected.netProfit)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
