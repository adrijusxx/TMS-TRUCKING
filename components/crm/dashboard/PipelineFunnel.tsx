'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PipelineItem {
    status: string;
    count: number;
    percentage: number;
}

interface PipelineFunnelProps {
    pipeline: PipelineItem[];
    isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-500',
    CONTACTED: 'bg-yellow-500',
    QUALIFIED: 'bg-green-500',
    DOCUMENTS_PENDING: 'bg-orange-500',
    DOCUMENTS_COLLECTED: 'bg-teal-500',
    INTERVIEW: 'bg-purple-500',
    OFFER: 'bg-pink-500',
    HIRED: 'bg-emerald-600',
    REJECTED: 'bg-red-500',
};

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

export default function PipelineFunnel({ pipeline, isLoading }: PipelineFunnelProps) {
    const maxCount = Math.max(...pipeline.map((p) => p.count), 1);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Pipeline Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Exclude REJECTED from funnel view — show it separately
    const funnelItems = pipeline.filter((p) => p.status !== 'REJECTED');
    const rejected = pipeline.find((p) => p.status === 'REJECTED');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pipeline Funnel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {funnelItems.map((item) => (
                        <div key={item.status} className="flex items-center gap-3">
                            <div className="w-28 text-sm font-medium text-muted-foreground truncate">
                                {STATUS_LABELS[item.status] || item.status}
                            </div>
                            <div className="flex-1">
                                <div className="relative h-7 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[item.status] || 'bg-gray-400'}`}
                                        style={{ width: `${Math.max((item.count / maxCount) * 100, 2)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="w-12 text-right">
                                <Badge variant="secondary" className="text-xs">
                                    {item.count}
                                </Badge>
                            </div>
                            <div className="w-10 text-right text-xs text-muted-foreground">
                                {item.percentage}%
                            </div>
                        </div>
                    ))}

                    {rejected && rejected.count > 0 && (
                        <div className="mt-2 pt-2 border-t flex items-center gap-3">
                            <div className="w-28 text-sm font-medium text-red-600 truncate">
                                Rejected
                            </div>
                            <div className="flex-1">
                                <div className="relative h-7 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                                        style={{ width: `${Math.max((rejected.count / maxCount) * 100, 2)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="w-12 text-right">
                                <Badge variant="destructive" className="text-xs">
                                    {rejected.count}
                                </Badge>
                            </div>
                            <div className="w-10 text-right text-xs text-muted-foreground">
                                {rejected.percentage}%
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
