'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Shield, Wrench, MapPin, Truck, User } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface ActiveCase {
    id: string;
    caseNumber: string;
    type: 'BREAKDOWN' | 'SAFETY' | 'MAINTENANCE';
    status: string;
    priority: string;
    driverName: string;
    truckNumber?: string;
    location?: string;
    createdAt: string;
    description?: string;
}

async function fetchActiveCases(): Promise<{ data: ActiveCase[] }> {
    const res = await fetch(apiUrl('/api/mattermost/active-cases'));
    if (!res.ok) throw new Error('Failed to fetch active cases');
    return res.json();
}

function getCaseIcon(type: string) {
    switch (type) {
        case 'BREAKDOWN': return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case 'SAFETY': return <Shield className="h-4 w-4 text-yellow-500" />;
        case 'MAINTENANCE': return <Wrench className="h-4 w-4 text-blue-500" />;
        default: return <AlertTriangle className="h-4 w-4" />;
    }
}

function getTypeVariant(type: string) {
    switch (type) {
        case 'BREAKDOWN': return 'error' as const;
        case 'SAFETY': return 'warning' as const;
        case 'MAINTENANCE': return 'info' as const;
        default: return 'neutral' as const;
    }
}

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'CRITICAL': return 'error' as const;
        case 'HIGH': return 'warning' as const;
        case 'MEDIUM': return 'info' as const;
        default: return 'neutral' as const;
    }
}

function getCaseDetailUrl(c: ActiveCase) {
    switch (c.type) {
        case 'BREAKDOWN': return `/dashboard/breakdowns/${c.caseNumber}`;
        case 'SAFETY': return `/dashboard/safety/${c.caseNumber}`;
        case 'MAINTENANCE': return `/dashboard/maintenance/${c.caseNumber}`;
        default: return '#';
    }
}

export default function MattermostActiveCases() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['mattermost-active-cases'],
        queryFn: fetchActiveCases,
        refetchInterval: 30000,
    });

    const cases = data?.data || [];

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Failed to load active cases</p>
            </div>
        );
    }

    if (cases.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active cases</p>
                <p className="text-xs mt-1">Cases created from Mattermost messages will appear here</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {cases.map(c => (
                <Link key={c.id} href={getCaseDetailUrl(c)}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                                    {getCaseIcon(c.type)}
                                    {c.caseNumber}
                                </CardTitle>
                                <Badge variant={getTypeVariant(c.type)} size="xs">{c.type}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant={getPriorityVariant(c.priority)} size="xs">{c.priority}</Badge>
                                <Badge variant="outline" size="xs">{c.status}</Badge>
                            </div>
                            {c.description && (
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{c.description}</p>
                            )}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <User className="h-2.5 w-2.5" />
                                    {c.driverName}
                                </div>
                                {c.truckNumber && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Truck className="h-2.5 w-2.5" />
                                        {c.truckNumber}
                                    </div>
                                )}
                                {c.location && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <MapPin className="h-2.5 w-2.5" />
                                        {c.location}
                                    </div>
                                )}
                            </div>
                            <p className="text-[9px] text-muted-foreground">
                                {new Date(c.createdAt).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
