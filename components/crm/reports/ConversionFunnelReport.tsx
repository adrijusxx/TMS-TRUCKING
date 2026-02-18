'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
    NEW: 'bg-blue-500', CONTACTED: 'bg-yellow-500', QUALIFIED: 'bg-emerald-500',
    DOCUMENTS_PENDING: 'bg-orange-500', DOCUMENTS_COLLECTED: 'bg-teal-500',
    INTERVIEW: 'bg-purple-500', OFFER: 'bg-indigo-500', HIRED: 'bg-green-500', REJECTED: 'bg-red-500',
};

export default function ConversionFunnelReport() {
    const { data, isLoading } = useQuery({
        queryKey: ['crm-report-funnel'],
        queryFn: async () => {
            const res = await fetch('/api/crm/reports?type=funnel');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

    const rows = data?.data || [];
    const total = data?.total || 0;
    const maxCount = Math.max(...rows.map((r: any) => r.count), 1);

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Leads at each pipeline stage ({total} total).
            </p>
            {rows.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No data yet</p>
            ) : (
                <div className="space-y-3">
                    {rows.map((row: any) => (
                        <div key={row.status} className="flex items-center gap-3">
                            <div className="w-36 text-sm text-right shrink-0">
                                {row.status.replace(/_/g, ' ')}
                            </div>
                            <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                                <div
                                    className={`h-full ${statusColors[row.status] || 'bg-gray-400'} rounded-md transition-all duration-500`}
                                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                                />
                            </div>
                            <div className="w-16 text-sm text-right shrink-0">
                                <span className="font-medium">{row.count}</span>
                                <span className="text-muted-foreground ml-1 text-xs">{row.percentage}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
