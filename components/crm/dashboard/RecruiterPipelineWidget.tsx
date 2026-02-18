'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Calendar, Phone, TrendingUp, UserCheck, Users } from 'lucide-react';

interface PipelineData {
    pipeline: Array<{ status: string; count: number }>;
    overdueFollowUps: number;
    todayFollowUps: Array<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        status: string;
        nextFollowUpDate: string;
        nextFollowUpNote?: string;
    }>;
    recentActivityCount: number;
    myHiresThisMonth: number;
    totalAssigned: number;
}

const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    DOCUMENTS_PENDING: 'Docs Pending',
    DOCUMENTS_COLLECTED: 'Docs Collected',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
};

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    CONTACTED: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
    QUALIFIED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    DOCUMENTS_PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    DOCUMENTS_COLLECTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    INTERVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    OFFER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export default function RecruiterPipelineWidget() {
    const { data, isLoading } = useQuery<PipelineData>({
        queryKey: ['my-pipeline'],
        queryFn: async () => {
            const res = await fetch('/api/crm/dashboard/my-pipeline');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        staleTime: 30_000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const orderedStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_COLLECTED', 'INTERVIEW', 'OFFER'];
    const pipelineMap = Object.fromEntries(data.pipeline.map((p) => [p.status, p.count]));

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Pipeline
                </CardTitle>
                <CardDescription>Your assigned leads and follow-ups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Quick stats row */}
                <div className="grid grid-cols-4 gap-3">
                    <StatBox icon={<Users className="h-4 w-4" />} label="Assigned" value={data.totalAssigned} />
                    <StatBox icon={<UserCheck className="h-4 w-4" />} label="Hired (mo)" value={data.myHiresThisMonth} />
                    <StatBox icon={<TrendingUp className="h-4 w-4" />} label="Activities (7d)" value={data.recentActivityCount} />
                    <StatBox
                        icon={<AlertTriangle className="h-4 w-4" />}
                        label="Overdue"
                        value={data.overdueFollowUps}
                        highlight={data.overdueFollowUps > 0}
                    />
                </div>

                {/* Pipeline breakdown */}
                <div className="flex flex-wrap gap-1.5">
                    {orderedStatuses.map((status) => {
                        const count = pipelineMap[status] || 0;
                        if (count === 0) return null;
                        return (
                            <Badge key={status} className={`text-xs ${STATUS_COLORS[status] || ''}`}>
                                {STATUS_LABELS[status] || status}: {count}
                            </Badge>
                        );
                    })}
                </div>

                {/* Today's follow-ups */}
                {data.todayFollowUps.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Calendar className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">Today&apos;s Follow-ups</span>
                        </div>
                        <div className="space-y-1.5">
                            {data.todayFollowUps.map((lead) => (
                                <div key={lead.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                                    <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span className="text-xs">{lead.phone}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatBox({ icon, label, value, highlight }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    highlight?: boolean;
}) {
    return (
        <div className={`rounded-md border px-3 py-2 text-center ${highlight ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950' : ''}`}>
            <div className="flex items-center justify-center mb-1 text-muted-foreground">{icon}</div>
            <div className={`text-lg font-bold ${highlight ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
    );
}
