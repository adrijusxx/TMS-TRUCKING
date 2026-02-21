'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ClipboardCheck, Loader2, MessageSquare, AlertTriangle, Wrench,
    ShieldAlert, UserX, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/utils';
import ReviewItemActions from './ReviewItemActions';

interface ReviewItem {
    id: string;
    type: string;
    status: string;
    telegramChatId: string;
    chatTitle?: string;
    senderName?: string;
    messageContent: string;
    messageDate: string;
    aiCategory?: string;
    aiConfidence?: number;
    aiUrgency?: string;
    aiAnalysis?: any;
    driverId?: string;
    driver?: {
        id: string;
        user: { firstName: string; lastName: string };
        currentTruck?: { id: string; truckNumber: string };
    };
    breakdown?: { id: string; breakdownNumber: string; status: string };
    resolvedBy?: { firstName: string; lastName: string };
    resolvedNote?: string;
    resolvedAt?: string;
    createdAt: string;
}

interface ReviewData {
    items: ReviewItem[];
    counts: { pending: number; approved: number; dismissed: number; caseApproval: number; driverLinkNeeded: number };
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const URGENCY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
};

const CATEGORY_ICONS: Record<string, typeof MessageSquare> = {
    BREAKDOWN: AlertTriangle,
    MAINTENANCE: Wrench,
    SAFETY: ShieldAlert,
};

export default function TelegramReviewQueue() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery<ReviewData>({
        queryKey: ['telegram-review-queue', statusFilter, page],
        queryFn: async () => {
            const res = await fetch(apiUrl(`/api/telegram/review-queue?status=${statusFilter}&page=${page}&pageSize=20`));
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            return json.data;
        },
        refetchInterval: 15000,
    });

    const items = data?.items || [];
    const counts = data?.counts || { pending: 0, approved: 0, dismissed: 0 };
    const pagination = data?.pagination;

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ClipboardCheck className="h-5 w-5" />
                        Telegram Review Queue
                    </CardTitle>
                </div>
                <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="PENDING" className="gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Pending
                            {counts.pending > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{counts.pending}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="APPROVED" className="gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                            {counts.approved > 0 && <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{counts.approved}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="DISMISSED" className="gap-1.5">
                            <XCircle className="h-3.5 w-3.5" /> Dismissed
                            {counts.dismissed > 0 && <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{counts.dismissed}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No {statusFilter.toLowerCase()} items</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map(item => (
                                <ReviewItemRow key={item.id} item={item} isPending={statusFilter === 'PENDING'} />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t">
                        <span className="text-xs text-muted-foreground">
                            {pagination.total} items — Page {pagination.page}/{pagination.totalPages}
                        </span>
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                                disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                                disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ReviewItemRow({ item, isPending }: { item: ReviewItem; isPending: boolean }) {
    const queryClient = useQueryClient();
    const CategoryIcon = CATEGORY_ICONS[item.aiCategory || ''] || MessageSquare;
    const urgencyClass = URGENCY_COLORS[item.aiUrgency || ''] || URGENCY_COLORS.LOW;

    return (
        <div className="p-4 hover:bg-muted/30 transition-colors">
            {/* Top row: type badge, sender, time */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={item.type === 'DRIVER_LINK_NEEDED' ? 'destructive' : 'default'} className="text-[10px] shrink-0">
                        {item.type === 'DRIVER_LINK_NEEDED' ? (
                            <><UserX className="h-3 w-3 mr-0.5" /> No Driver</>
                        ) : (
                            <><ClipboardCheck className="h-3 w-3 mr-0.5" /> Needs Approval</>
                        )}
                    </Badge>
                    <span className="font-medium text-sm truncate">
                        {item.senderName || item.chatTitle || `Chat ${item.telegramChatId}`}
                    </span>
                    {item.driver && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                            {item.driver.user.firstName} {item.driver.user.lastName}
                        </Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
            </div>

            {/* Message preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.messageContent}</p>

            {/* AI badges */}
            <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-[10px] gap-1">
                    <CategoryIcon className="h-3 w-3" />
                    {item.aiCategory || 'Unknown'}
                </Badge>
                {item.aiUrgency && (
                    <Badge className={`text-[10px] border ${urgencyClass}`}>
                        {item.aiUrgency}
                    </Badge>
                )}
                {item.aiConfidence != null && (
                    <span className="text-[10px] text-muted-foreground">
                        {Math.round(item.aiConfidence * 100)}% confidence
                    </span>
                )}
            </div>

            {/* Actions or resolution info */}
            {isPending ? (
                <ReviewItemActions
                    item={item}
                    onResolved={() => queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] })}
                />
            ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.status === 'APPROVED' && item.breakdown && (
                        <Badge variant="secondary" className="text-[10px]">
                            Case {item.breakdown.breakdownNumber}
                        </Badge>
                    )}
                    {item.resolvedBy && (
                        <span>by {item.resolvedBy.firstName} {item.resolvedBy.lastName}</span>
                    )}
                    {item.resolvedAt && (
                        <span>{formatDistanceToNow(new Date(item.resolvedAt), { addSuffix: true })}</span>
                    )}
                    {item.resolvedNote && (
                        <span className="italic">— {item.resolvedNote}</span>
                    )}
                </div>
            )}
        </div>
    );
}
