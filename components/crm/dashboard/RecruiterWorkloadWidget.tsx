'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecruiterWorkload {
    name: string;
    activeLeads: number;
    overdueFollowUps: number;
    maxCapacity: number | null;
}

export default function RecruiterWorkloadWidget() {
    const { data, isLoading } = useQuery({
        queryKey: ['recruiter-workload'],
        queryFn: async () => {
            const res = await fetch('/api/crm/recruiter-workload');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        staleTime: 60_000,
    });

    const recruiters: RecruiterWorkload[] = data?.recruiters || [];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Recruiter Workload
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : recruiters.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recruiters assigned</p>
                ) : (
                    <div className="space-y-3">
                        {recruiters.map((r) => {
                            const cap = r.maxCapacity || 50;
                            const pct = Math.min(Math.round((r.activeLeads / cap) * 100), 100);
                            const overloaded = pct >= 90;
                            return (
                                <div key={r.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium truncate">{r.name}</span>
                                        <div className="flex items-center gap-2">
                                            {r.overdueFollowUps > 0 && (
                                                <Badge variant="destructive" className="text-[10px] h-5 gap-0.5">
                                                    <AlertCircle className="h-2.5 w-2.5" />
                                                    {r.overdueFollowUps}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {r.activeLeads}{r.maxCapacity ? `/${r.maxCapacity}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-300',
                                                overloaded ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                            )}
                                            style={{ width: `${Math.max(pct, 3)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
