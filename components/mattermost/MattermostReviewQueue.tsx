'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Check, X, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface ReviewItem {
    id: string;
    senderName: string;
    senderUsername: string;
    messagePreview: string;
    aiCategory: string;
    confidence: number;
    urgency: string;
    status: 'PENDING' | 'APPROVED' | 'DISMISSED';
    createdAt: string;
    channelName?: string;
}

interface ReviewResponse {
    data: ReviewItem[];
    total: number;
    page: number;
    pageSize: number;
}

const PAGE_SIZE = 10;

async function fetchReviewItems(status: string, page: number, search: string): Promise<ReviewResponse> {
    const params = new URLSearchParams({ status, page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set('search', search);
    const res = await fetch(apiUrl(`/api/mattermost/review-queue?${params}`));
    if (!res.ok) throw new Error('Failed to fetch review queue');
    return res.json();
}

function getUrgencyVariant(urgency: string) {
    switch (urgency) {
        case 'CRITICAL': return 'error' as const;
        case 'HIGH': return 'warning' as const;
        case 'MEDIUM': return 'info' as const;
        default: return 'neutral' as const;
    }
}

function getCategoryVariant(category: string) {
    switch (category) {
        case 'BREAKDOWN': return 'error-outline' as const;
        case 'SAFETY': return 'warning-outline' as const;
        case 'MAINTENANCE': return 'info-outline' as const;
        default: return 'neutral-outline' as const;
    }
}

export default function MattermostReviewQueue() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('PENDING');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['mattermost-review', tab, page, search],
        queryFn: () => fetchReviewItems(tab, page, search),
        refetchInterval: tab === 'PENDING' ? 10000 : undefined,
    });

    const pendingCountQuery = useQuery({
        queryKey: ['mattermost-review-count'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/mattermost/review-queue?status=PENDING&pageSize=1'));
            if (!res.ok) return { total: 0 };
            return res.json();
        },
        refetchInterval: 10000,
    });

    const actionMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'dismiss' | 'ignore' }) => {
            const res = await fetch(apiUrl(`/api/mattermost/review-queue/${id}/${action}`), { method: 'POST' });
            if (!res.ok) throw new Error(`Failed to ${action} item`);
            return res.json();
        },
        onSuccess: (_, { action }) => {
            const label = action === 'approve' ? 'Approved' : action === 'dismiss' ? 'Dismissed' : 'Ignored';
            toast.success(`Review item ${label.toLowerCase()}`);
            queryClient.invalidateQueries({ queryKey: ['mattermost-review'] });
            queryClient.invalidateQueries({ queryKey: ['mattermost-review-count'] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const items = data?.data || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const pendingCount = pendingCountQuery.data?.total || 0;

    const handleTabChange = (value: string) => {
        setTab(value);
        setPage(1);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search messages..."
                        className="h-8 text-xs pl-8"
                    />
                </div>
            </div>

            <Tabs value={tab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="PENDING" className="gap-1.5 text-xs">
                        Pending
                        {pendingCount > 0 && (
                            <Badge variant="error" size="xs" className="ml-1">{pendingCount}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="APPROVED" className="text-xs">Approved</TabsTrigger>
                    <TabsTrigger value="DISMISSED" className="text-xs">Dismissed</TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-3">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-sm">No {tab.toLowerCase()} items</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {items.map(item => (
                                <ReviewItemCard
                                    key={item.id}
                                    item={item}
                                    onAction={(action) => actionMutation.mutate({ id: item.id, action })}
                                    isPending={actionMutation.isPending}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages} ({total} items)
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReviewItemCard({ item, onAction, isPending }: {
    item: ReviewItem;
    onAction: (action: 'approve' | 'dismiss' | 'ignore') => void;
    isPending: boolean;
}) {
    return (
        <Card>
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold">{item.senderName}</span>
                            {item.channelName && (
                                <span className="text-[10px] text-muted-foreground">in #{item.channelName}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2">{item.messagePreview}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant={getCategoryVariant(item.aiCategory)} size="xs">
                                {item.aiCategory}
                            </Badge>
                            <Badge variant={getUrgencyVariant(item.urgency)} size="xs">
                                {item.urgency}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                                {Math.round(item.confidence * 100)}% confidence
                            </span>
                        </div>
                    </div>
                    {item.status === 'PENDING' && (
                        <div className="flex gap-1 shrink-0">
                            <Button
                                size="sm" variant="outline"
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => onAction('approve')}
                                disabled={isPending}
                            >
                                <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm" variant="outline"
                                className="h-7 px-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                onClick={() => onAction('dismiss')}
                                disabled={isPending}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm" variant="outline"
                                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onAction('ignore')}
                                disabled={isPending}
                            >
                                <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
