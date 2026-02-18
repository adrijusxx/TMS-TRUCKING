'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
    priority: string;
    source: string;
    createdAt: string;
    assignedTo?: { firstName: string; lastName: string } | null;
}

interface RecentLeadsWidgetProps {
    leads: Lead[];
    isLoading?: boolean;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    QUALIFIED: 'bg-green-100 text-green-800',
    DOCUMENTS_PENDING: 'bg-orange-100 text-orange-800',
    DOCUMENTS_COLLECTED: 'bg-teal-100 text-teal-800',
    INTERVIEW: 'bg-purple-100 text-purple-800',
    OFFER: 'bg-pink-100 text-pink-800',
    HIRED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
};

const PRIORITY_BADGE_COLORS: Record<string, string> = {
    HOT: 'bg-red-100 text-red-700',
    WARM: 'bg-orange-100 text-orange-700',
    COLD: 'bg-slate-100 text-slate-700',
};

function formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecentLeadsWidget({ leads, isLoading }: RecentLeadsWidgetProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Leads</CardTitle>
                <Link href="/dashboard/crm/leads">
                    <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No leads yet
                    </p>
                ) : (
                    <div className="space-y-3">
                        {leads.map((lead) => (
                            <div
                                key={lead.id}
                                className="flex items-center justify-between gap-3 rounded-lg border p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {lead.firstName} {lead.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {lead.phone}
                                        {lead.assignedTo && (
                                            <span> &middot; {lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge className={`text-xs ${PRIORITY_BADGE_COLORS[lead.priority] || ''}`} variant="outline">
                                        {lead.priority}
                                    </Badge>
                                    <Badge className={`text-xs ${STATUS_BADGE_COLORS[lead.status] || ''}`} variant="outline">
                                        {formatStatus(lead.status)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
