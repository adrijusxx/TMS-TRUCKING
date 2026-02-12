'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import {
    AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
    Lightbulb, Target, Flame, DollarSign, Truck, Route,
    Gauge, Activity, ArrowUpRight,
} from 'lucide-react';

interface CostAdvice {
    category: string;
    severity: 'critical' | 'warning' | 'good' | 'excellent';
    title: string;
    detail: string;
    impact?: string;
}

interface KPIs {
    grossMargin: number;
    operatingRatio: number;
    rpm: number;
    emptyMilePercent: number;
    driverPayPercent: number;
    avgRevenuePerLoad: number;
    avgDriverPayPerLoad: number;
    revenuePerTruck: number;
    revenuePerDriver: number;
    loadsPerTruck: number;
    loadsPerDriver: number;
}

interface MonthlyData {
    revenue: number;
    profit: number;
    loads: number;
    revenuePerTruck: number;
    loadsPerTruck: number;
}

interface CostOptimizationProps {
    kpis: KPIs;
    monthly: MonthlyData;
    costInsights: CostAdvice[];
    totalTrucks: number;
    totalDrivers: number;
}

const SEVERITY_CONFIG = {
    critical: { icon: Flame, color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20', label: 'Critical' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Warning' },
    good: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Good' },
    excellent: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20', label: 'Excellent' },
};

function KPIGauge({ label, value, suffix, benchmark, icon: Icon, invertColors }: {
    label: string; value: number; suffix: string; benchmark: number; icon: any; invertColors?: boolean;
}) {
    const isGood = invertColors ? value <= benchmark : value >= benchmark;
    return (
        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className={cn("p-2 rounded-lg flex-shrink-0", isGood ? "bg-green-500/10" : "bg-red-500/10")}>
                <Icon className={cn("h-4 w-4", isGood ? "text-green-600" : "text-red-600")} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-lg font-bold", isGood ? "text-green-600" : "text-red-600")}>
                    {typeof value === 'number' ? value.toFixed(1) : value}{suffix}
                </p>
                <p className="text-xs text-muted-foreground">Benchmark: {benchmark}{suffix}</p>
            </div>
        </div>
    );
}

export default function CostOptimizationInsights({ kpis, monthly, costInsights, totalTrucks, totalDrivers }: CostOptimizationProps) {
    const criticalCount = costInsights.filter(c => c.severity === 'critical').length;
    const warningCount = costInsights.filter(c => c.severity === 'warning').length;
    const excellentCount = costInsights.filter(c => c.severity === 'excellent').length;

    // Health score: simple 0-100 based on insights
    const healthScore = Math.round(
        ((excellentCount * 20) + (costInsights.filter(c => c.severity === 'good').length * 15) +
            (warningCount * 5) + (criticalCount * 0)) / Math.max(costInsights.length, 1) * 5
    );

    return (
        <div className="space-y-6">
            {/* Health Score + KPI Grid */}
            <div className="grid gap-4 lg:grid-cols-4">
                {/* Health Score */}
                <Card className="lg:row-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Operations Health Score</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className={cn(
                            "relative w-28 h-28 rounded-full flex items-center justify-center border-4",
                            healthScore >= 75 ? "border-green-500 bg-green-500/5" :
                                healthScore >= 50 ? "border-amber-500 bg-amber-500/5" :
                                    "border-red-500 bg-red-500/5"
                        )}>
                            <span className={cn(
                                "text-3xl font-black",
                                healthScore >= 75 ? "text-green-600" : healthScore >= 50 ? "text-amber-600" : "text-red-600"
                            )}>
                                {healthScore}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            {healthScore >= 75 ? 'Strong operations' : healthScore >= 50 ? 'Room for improvement' : 'Needs attention'}
                        </p>
                        <div className="flex gap-3 mt-4 text-xs">
                            {criticalCount > 0 && <span className="text-red-600 font-medium">{criticalCount} Critical</span>}
                            {warningCount > 0 && <span className="text-amber-600 font-medium">{warningCount} Warning</span>}
                            {excellentCount > 0 && <span className="text-green-600 font-medium">{excellentCount} Excellent</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Gauges */}
                <KPIGauge label="Gross Margin" value={kpis.grossMargin} suffix="%" benchmark={20} icon={TrendingUp} />
                <KPIGauge label="Operating Ratio" value={kpis.operatingRatio} suffix="%" benchmark={92} icon={Gauge} invertColors />
                <KPIGauge label="Revenue Per Mile" value={kpis.rpm} suffix="" benchmark={2.50} icon={DollarSign} />
                <KPIGauge label="Empty Mile %" value={kpis.emptyMilePercent} suffix="%" benchmark={12} icon={Route} invertColors />
                <KPIGauge label="Driver Pay %" value={kpis.driverPayPercent} suffix="%" benchmark={35} icon={Activity} invertColors />
                <KPIGauge label="Rev/Truck/Mo" value={monthly.revenuePerTruck} suffix="" benchmark={15000} icon={Truck} />
            </div>

            {/* Detailed Per-Unit Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Per-Unit Performance Metrics
                    </CardTitle>
                    <CardDescription>How each asset is performing</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricTile label="Avg Revenue / Load" value={formatCurrency(kpis.avgRevenuePerLoad)} />
                        <MetricTile label="Avg Driver Pay / Load" value={formatCurrency(kpis.avgDriverPayPerLoad)} />
                        <MetricTile label="Loads / Truck (Total)" value={kpis.loadsPerTruck.toFixed(1)} />
                        <MetricTile label="Loads / Driver (Total)" value={kpis.loadsPerDriver.toFixed(1)} />
                        <MetricTile label="Revenue / Truck (Total)" value={formatCurrency(kpis.revenuePerTruck)} />
                        <MetricTile label="Revenue / Driver (Total)" value={formatCurrency(kpis.revenuePerDriver)} />
                        <MetricTile label="Monthly Loads/Truck" value={monthly.loadsPerTruck.toFixed(1)} />
                        <MetricTile label="Monthly Revenue" value={formatCurrency(monthly.revenue)} />
                    </div>
                </CardContent>
            </Card>

            {/* Actionable Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        Actionable Cost & Revenue Insights
                    </CardTitle>
                    <CardDescription>
                        AI-generated analysis based on your operational data vs. industry benchmarks
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {costInsights.map((insight, idx) => {
                        const config = SEVERITY_CONFIG[insight.severity];
                        const Icon = config.icon;
                        return (
                            <div key={idx} className={cn("p-4 rounded-lg border", config.bg)}>
                                <div className="flex items-start gap-3">
                                    <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.color)} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("text-sm font-semibold", config.color)}>{insight.title}</span>
                                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{insight.category}</span>
                                        </div>
                                        <p className="text-sm text-foreground/80">{insight.detail}</p>
                                        {insight.impact && (
                                            <p className="text-sm font-medium mt-2 flex items-center gap-1">
                                                <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-green-700 dark:text-green-400">{insight.impact}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Strategic Recommendations (always shown) */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Strategic Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                        <RecommendationTile
                            title="Negotiate Better Rates"
                            detail="Focus on lanes where your RPM is below $2.00. Use historical data to show brokers your reliability and push for 5-10% rate increases on repeat lanes."
                        />
                        <RecommendationTile
                            title="Reduce Deadhead Miles"
                            detail="Use DAT/Truckstop load boards to find backhauls. Target delivery locations near high-demand pickup areas. Consider dedicated lanes with shippers."
                        />
                        <RecommendationTile
                            title="Optimize Driver Pay Structure"
                            detail="Switch from percentage-based pay to per-mile pay for long-haul. This caps your labor cost on high-revenue loads and makes your margins more predictable."
                        />
                        <RecommendationTile
                            title="Preventive Maintenance Schedule"
                            detail="Implement a strict PM schedule every 15,000 miles. Carriers with PM programs average 30% fewer breakdowns and $0.05/mile lower maintenance costs."
                        />
                        <RecommendationTile
                            title="Technology Automation"
                            detail="Automate invoicing, settlement generation, and compliance tracking. Carriers with full TMS automation save 20-40 hours/week in admin time."
                        />
                        <RecommendationTile
                            title="Fuel Card & Discount Programs"
                            detail="Negotiate fleet fuel discounts (3-8 cents/gallon). Use fuel optimization routing to direct drivers to cheapest stations along their route."
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 bg-muted/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
        </div>
    );
}

function RecommendationTile({ title, detail }: { title: string; detail: string }) {
    return (
        <div className="p-3 bg-background rounded-lg border">
            <p className="text-sm font-semibold mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
        </div>
    );
}
