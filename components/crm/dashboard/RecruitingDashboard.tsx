'use client';

import { useQuery } from '@tanstack/react-query';
import RecruitingStats from './RecruitingStats';
import PipelineFunnel from './PipelineFunnel';
import RecentLeadsWidget from './RecentLeadsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DashboardData {
    stats: {
        totalLeads: number;
        openLeads: number;
        hiredThisMonth: number;
        avgTimeToHire: number;
    };
    pipeline: Array<{ status: string; count: number; percentage: number }>;
    sourceBreakdown: Array<{ source: string; count: number }>;
    hiringVelocity: Array<{ week: string; hires: number }>;
    recentLeads: Array<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        status: string;
        priority: string;
        source: string;
        createdAt: string;
        assignedTo?: { firstName: string; lastName: string } | null;
    }>;
}

const SOURCE_COLORS: Record<string, string> = {
    FACEBOOK: 'bg-blue-500',
    REFERRAL: 'bg-green-500',
    DIRECT: 'bg-purple-500',
    WEBSITE: 'bg-orange-500',
    OTHER: 'bg-gray-400',
};

async function fetchDashboard(): Promise<DashboardData> {
    const res = await fetch('/api/crm/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
}

export default function RecruitingDashboard() {
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['crm-dashboard'],
        queryFn: fetchDashboard,
        staleTime: 30_000,
    });

    const defaultStats = { totalLeads: 0, openLeads: 0, hiredThisMonth: 0, avgTimeToHire: 0 };

    return (
        <div className="space-y-6">
            {/* Refresh button */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* KPI Stats */}
            <RecruitingStats
                stats={data?.stats ?? defaultStats}
                isLoading={isLoading}
            />

            {/* Two-column layout: Funnel + Source Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
                <PipelineFunnel
                    pipeline={data?.pipeline ?? []}
                    isLoading={isLoading}
                />

                {/* Source Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lead Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                                ))}
                            </div>
                        ) : !data?.sourceBreakdown?.length ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                        ) : (
                            <div className="space-y-3">
                                {data.sourceBreakdown
                                    .sort((a, b) => b.count - a.count)
                                    .map((source) => {
                                        const total = data.stats.totalLeads || 1;
                                        const pct = Math.round((source.count / total) * 100);
                                        return (
                                            <div key={source.source} className="flex items-center gap-3">
                                                <div className="w-20 text-sm font-medium text-muted-foreground capitalize">
                                                    {source.source.toLowerCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="relative h-6 w-full rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${SOURCE_COLORS[source.source] || 'bg-gray-400'}`}
                                                            style={{ width: `${Math.max(pct, 3)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {source.count}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground w-8 text-right">
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Hiring Velocity */}
            {data?.hiringVelocity && data.hiringVelocity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Hiring Velocity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-32">
                            {data.hiringVelocity.map((week) => {
                                const maxHires = Math.max(...data.hiringVelocity.map((w) => w.hires), 1);
                                const height = Math.max((week.hires / maxHires) * 100, 8);
                                return (
                                    <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-xs font-medium">{week.hires}</span>
                                        <div
                                            className="w-full rounded-t bg-emerald-500 transition-all duration-300"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Leads */}
            <RecentLeadsWidget
                leads={data?.recentLeads ?? []}
                isLoading={isLoading}
            />
        </div>
    );
}
