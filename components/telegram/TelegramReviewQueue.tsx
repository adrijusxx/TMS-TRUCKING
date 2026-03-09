'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ClipboardCheck, Loader2, AlertTriangle, Clock,
    XCircle, Search, Ban, Archive, Zap,
} from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import ReviewItemRow from './ReviewItemRow';
import type { ReviewItem } from './ReviewItemRow';
import DismissedAdminControls from './DismissedAdminControls';
import TelegramIgnoredContacts from './TelegramIgnoredContacts';

interface ReviewData {
    items: ReviewItem[];
    counts: { pending: number; approved: number; dismissed: number; ignored: number; caseApproval: number; driverLinkNeeded: number };
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'pending',
    APPROVED: 'processed',
    DISMISSED: 'dismissed',
    IGNORED: 'ignored',
};

export default function TelegramReviewQueue() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes((session?.user as any)?.role);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { data, isLoading } = useQuery<ReviewData>({
        queryKey: ['telegram-review-queue', statusFilter, page, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams({ status: statusFilter, page: String(page), pageSize: '20' });
            if (debouncedSearch) params.set('search', debouncedSearch);
            const res = await fetch(apiUrl(`/api/telegram/review-queue?${params}`));
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            return json.data;
        },
        refetchInterval: 15000,
    });

    const { data: dialogsData } = useQuery<{ success: boolean; data: { id: string; title: string; firstName?: string | null; lastName?: string | null }[] }>({
        queryKey: ['telegram-dialogs-full'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/dialogs'));
            if (!res.ok) return { success: false, data: [] };
            return res.json();
        },
        staleTime: 60_000,
    });

    // Auto-approve toggle state
    const { data: telegramSettings } = useQuery({
        queryKey: ['telegram-settings'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/settings'));
            if (!res.ok) return null;
            return (await res.json()).data;
        },
        enabled: isAdmin,
        staleTime: 30_000,
    });

    const requiresApproval = telegramSettings?.requireStaffApproval ?? true;

    const toggleApprovalMutation = useMutation({
        mutationFn: async (requireStaffApproval: boolean) => {
            const res = await fetch(apiUrl('/api/telegram/settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...telegramSettings, requireStaffApproval }),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: (_, requireStaffApproval) => {
            queryClient.invalidateQueries({ queryKey: ['telegram-settings'] });
            toast.success(requireStaffApproval ? 'Manual review enabled' : 'Auto-approve enabled — cases will create without review');
        },
        onError: () => toast.error('Failed to update setting'),
    });

    const chatNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const d of dialogsData?.data || []) {
            const parts = [d.firstName, d.lastName].filter(Boolean);
            map[d.id] = parts.length > 0 ? parts.join(' ') : d.title;
        }
        return map;
    }, [dialogsData]);

    const items = data?.items || [];
    const counts = data?.counts || { pending: 0, approved: 0, dismissed: 0, ignored: 0 };
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
                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={!requiresApproval}
                                onCheckedChange={(checked) => toggleApprovalMutation.mutate(!checked)}
                                disabled={toggleApprovalMutation.isPending}
                                className="data-[state=checked]:bg-amber-500"
                            />
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Auto-approve
                                {!requiresApproval && (
                                    <Badge variant="outline" className="ml-1 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                                        ON
                                    </Badge>
                                )}
                            </span>
                        </div>
                    )}
                </div>
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search names, messages, notes..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="h-8 pl-8 text-xs"
                    />
                </div>
                <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); setSearchQuery(''); }}>
                    <TabsList className="grid w-full grid-cols-4 max-w-lg">
                        <TabsTrigger value="PENDING" className="gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Pending
                            {counts.pending > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{counts.pending}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="APPROVED" className="gap-1.5">
                            <Archive className="h-3.5 w-3.5" /> Processed
                            {counts.approved > 0 && <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{counts.approved}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="DISMISSED" className="gap-1.5">
                            <XCircle className="h-3.5 w-3.5" /> Dismissed
                            {counts.dismissed > 0 && <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{counts.dismissed}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="IGNORED" className="gap-1.5">
                            <Ban className="h-3.5 w-3.5" /> Ignored
                            {counts.ignored > 0 && <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{counts.ignored}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>

            <CardContent className="p-0">
                {statusFilter === 'IGNORED' ? (
                    <TelegramIgnoredContacts />
                ) : (
                    <>
                        {statusFilter === 'DISMISSED' && (
                            <DismissedAdminControls
                                dismissedCount={counts.dismissed}
                                onDeleted={() => queryClient.invalidateQueries({ queryKey: ['telegram-review-queue'] })}
                            />
                        )}

                        {/* Auto-approve warning banner */}
                        {statusFilter === 'PENDING' && !requiresApproval && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span>Auto-approve is ON. High-confidence messages create cases automatically without staff review.</span>
                            </div>
                        )}

                        {/* Processed tab description */}
                        {statusFilter === 'APPROVED' && (
                            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/20 text-xs text-muted-foreground">
                                <Archive className="h-3.5 w-3.5 shrink-0" />
                                <span>History of handled messages — cases were created or items were manually approved.</span>
                            </div>
                        )}

                        <ScrollArea className="h-[500px]">
                            {items.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No {STATUS_LABELS[statusFilter] || statusFilter.toLowerCase()} items</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {items.map(item => (
                                        <ReviewItemRow key={item.id} item={item} isPending={statusFilter === 'PENDING'} chatNameMap={chatNameMap} />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

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
                    </>
                )}
            </CardContent>
        </Card>
    );
}
