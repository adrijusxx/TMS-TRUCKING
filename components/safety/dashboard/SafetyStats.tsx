'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, AlertTriangle, TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface StatProps {
    label: string;
    value: string | number;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: React.ElementType;
    alert?: boolean;
}

function StatCard({ label, value, subtext, trend, trendValue, icon: Icon, alert }: StatProps) {
    return (
        <Card className={alert ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10" : ""}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <Icon className={`h-4 w-4 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
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
}

export default function SafetyStats({ data }: { data: SafetyStatsData }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="Hard Expirations"
                value={data.hardExpirations}
                icon={Users}
                alert={data.hardExpirations > 0}
                subtext="CDL, Med Cards, etc."
            />
            <StatCard
                label="Open Defects"
                value={data.openDefects}
                icon={Truck}
                alert={data.openDefects > 0}
                trend={data.openDefects > 5 ? 'up' : 'down'}
                trendValue={data.openDefectsTrend}
            />
            <StatCard
                label="Accidents (30d)"
                value={data.accidentsThisMonth}
                icon={AlertTriangle}
                alert={data.accidentsThisMonth > 0}
                subtext="Rolling 30 days"
            />
            <StatCard
                label="CSA Score"
                value={data.csaScore}
                icon={Activity}
                trend={data.csaScore > 50 ? 'up' : 'down'}
                trendValue={data.csaTrend || "Stable"}
                subtext="Composite Score"
            />
        </div>
    );
}
