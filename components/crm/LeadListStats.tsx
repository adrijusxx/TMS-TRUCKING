'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Users, UserX, AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    DOCUMENTS_PENDING: 'Docs Pending',
    DOCUMENTS_COLLECTED: 'Docs Collected',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
};

export default function LeadListStats() {
    const { data } = useQuery({
        queryKey: ['lead-stats'],
        queryFn: async () => {
            const res = await fetch('/api/crm/leads/stats');
            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 30000,
    });

    if (!data) return null;

    const { total, unassigned, overdueFollowUps, byStatus } = data;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                Total: {total}
            </Badge>
            {Object.entries(byStatus as Record<string, number>)
                .filter(([, count]) => count > 0)
                .sort(([a], [b]) => {
                    const order = Object.keys(STATUS_LABELS);
                    return order.indexOf(a) - order.indexOf(b);
                })
                .map(([status, count]) => (
                    <Badge key={status} variant="secondary" className="text-xs">
                        {STATUS_LABELS[status] || status}: {count}
                    </Badge>
                ))}
            {unassigned > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-orange-600 border-orange-300">
                    <UserX className="h-3 w-3" />
                    Unassigned: {unassigned}
                </Badge>
            )}
            {overdueFollowUps > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-300">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue: {overdueFollowUps}
                </Badge>
            )}
        </div>
    );
}
