'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Truck, AlertTriangle, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import SparklineChart from './SparklineChart';

interface StatProps {
    label: string;
    value: string | number;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: React.ElementType;
    alert?: boolean;
    sparklineData?: number[];
}

function StatCard({ label, value, subtext, trend, trendValue, icon: Icon, alert, sparklineData }: StatProps) {
    return (
        <Card className={alert ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10" : ""}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <Icon className={`h-4 w-4 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className={`text-2xl font-bold ${alert ? "text-destructive" : ""}`}>{value}</div>
                            {trend && (
                                <div className={`flex items-center text-xs ${trend === 'down' ? 'text-green-500' :
                                    trend === 'up' ? 'text-red-500' : 'text-muted-foreground'
                                }`}>
                                    {trend === 'down' ? <TrendingDown className="mr-1 h-3 w-3" /> :
                                        trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : null}
                                    {trendValue}
                                </div>
                            )}
                        </div>
                        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    </div>
                    {sparklineData && sparklineData.length >= 2 && (
                        <SparklineChart
                            data={sparklineData}
                            color={alert ? '#ef4444' : '#6b7280'}
                            showDots
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export interface SafetyStatsData {
    openDefects: number;
    openDefectsTrend?: string;
    accidentsThisMonth: number;
    accidentsTrend?: string;
    hardExpirations: number;
    csaScore: number;
    csaTrend?: string;
    previousPeriod?: {
        openDefects: number;
        accidentsThisMonth: number;
        hardExpirations: number;
        csaScore: number;
    };
    sparklines?: {
        defects?: number[];
        accidents?: number[];
        expirations?: number[];
        csa?: number[];
    };
}

function getPeriodChange(current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; label: string } {
    if (previous === 0 && current === 0) return { trend: 'neutral', label: 'No change' };
    if (previous === 0) return { trend: 'up', label: 'New' };
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return { trend: 'neutral', label: 'No change' };
    return { trend: pct > 0 ? 'up' : 'down', label: `${Math.abs(pct)}% vs prev` };
}

export default function SafetyStats({ data }: { data: SafetyStatsData }) {
    const prev = data.previousPeriod;
    const sparks = data.sparklines;

    const defectChange = prev ? getPeriodChange(data.openDefects, prev.openDefects) : null;
    const accidentChange = prev ? getPeriodChange(data.accidentsThisMonth, prev.accidentsThisMonth) : null;
    const csaChange = prev ? getPeriodChange(data.csaScore, prev.csaScore) : null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="Hard Expirations"
                value={data.hardExpirations}
                icon={Users}
                alert={data.hardExpirations > 0}
                subtext="CDL, Med Cards, etc."
                sparklineData={sparks?.expirations}
            />
            <StatCard
                label="Open Defects"
                value={data.openDefects}
                icon={Truck}
                alert={data.openDefects > 0}
                trend={defectChange?.trend ?? (data.openDefects > 5 ? 'up' : 'down')}
                trendValue={defectChange?.label ?? data.openDefectsTrend}
                sparklineData={sparks?.defects}
            />
            <StatCard
                label="Accidents (30d)"
                value={data.accidentsThisMonth}
                icon={AlertTriangle}
                alert={data.accidentsThisMonth > 0}
                trend={accidentChange?.trend}
                trendValue={accidentChange?.label}
                subtext="Rolling 30 days"
                sparklineData={sparks?.accidents}
            />
            <StatCard
                label="CSA Score"
                value={data.csaScore}
                icon={Activity}
                trend={csaChange?.trend ?? (data.csaScore > 50 ? 'up' : 'down')}
                trendValue={csaChange?.label ?? data.csaTrend ?? 'Stable'}
                subtext="Composite Score"
                sparklineData={sparks?.csa}
            />
        </div>
    );
}
