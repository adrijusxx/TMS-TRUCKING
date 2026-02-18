'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Clock, Target } from 'lucide-react';

interface StatsData {
    totalLeads: number;
    openLeads: number;
    hiredThisMonth: number;
    avgTimeToHire: number;
}

interface RecruitingStatsProps {
    stats: StatsData;
    isLoading?: boolean;
}

const statCards = [
    {
        key: 'totalLeads' as const,
        label: 'Total Leads',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        key: 'openLeads' as const,
        label: 'Open Leads',
        icon: Target,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
    },
    {
        key: 'hiredThisMonth' as const,
        label: 'Hired This Month',
        icon: UserCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
    },
    {
        key: 'avgTimeToHire' as const,
        label: 'Avg Time to Hire',
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        suffix: ' days',
    },
];

export default function RecruitingStats({ stats, isLoading }: RecruitingStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
                <Card key={card.key}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`rounded-lg p-3 ${card.bgColor}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.label}
                                </p>
                                {isLoading ? (
                                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                                ) : (
                                    <p className="text-2xl font-bold">
                                        {stats[card.key]}
                                        {card.suffix || ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
