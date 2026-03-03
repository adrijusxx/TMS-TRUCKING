'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ClipboardCheck, Loader2, MessageSquare, AlertTriangle, Wrench,
    ShieldAlert, UserX, Clock, CheckCircle2, XCircle, Timer,
    Phone, MapPin, Truck, Search, Ban,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import ReviewItemActions from './ReviewItemActions';
import DismissedAdminControls from './DismissedAdminControls';
import TelegramIgnoredContacts from './TelegramIgnoredContacts';

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
        user: { firstName: string; lastName: string; phone?: string };
        currentTruck?: { id: string; truckNumber: string; currentLocation?: string };
    };
    suggestedDriverId?: string;
    suggestedDriver?: {
        id: string;
        user: { firstName: string; lastName: string; phone?: string };
        currentTruck?: { id: string; truckNumber: string };
    };
    matchConfidence?: number;
    matchMethod?: string;
    breakdown?: { id: string; breakdownNumber: string; status: string };
    resolvedBy?: { firstName: string; lastName: string };
    resolvedNote?: string;
    resolvedAt?: string;
    createdAt: string;
}

interface ReviewData {
    items: ReviewItem[];
    counts: { pending: number; approved: number; dismissed: number; ignored: number; caseApproval: number; driverLinkNeeded: number };
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const URGENCY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
};

const CATEGORY_CONFIG: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
    BREAKDOWN: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
    MAINTENANCE: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
    SAFETY: { icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
};

export default function TelegramReviewQueue() {
    const queryClient = useQueryClient();
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

    // Fetch dialogs to resolve chat names (shares cache with TelegramFullWidget)
    const { data: dialogsData } = useQuery<{ success: boolean; data: { id: string; title: string; firstName?: string | null; lastName?: string | null }[] }>({
        queryKey: ['telegram-dialogs-full'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/dialogs'));
            if (!res.ok) return { success: false, data: [] };
            return res.json();
        },
        staleTime: 60_000,
    });

    // Build chatId → display name lookup from dialogs
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
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
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
                        <ScrollArea className="h-[500px]">
                            {items.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No {statusFilter.toLowerCase()} items</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {items.map(item => (
                                        <ReviewItemRow key={item.id} item={item} isPending={statusFilter === 'PENDING'} chatNameMap={chatNameMap} />
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
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function ExpiryTimer({ createdAt }: { createdAt: string }) {
    const [remaining, setRemaining] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        function update() {
            const expiresAt = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                setRemaining('Expired');
                setIsUrgent(true);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setRemaining(`${hours}h ${minutes}m`);
            setIsUrgent(hours < 4);
        }
        update();
        const interval = setInterval(update, 60_000);
        return () => clearInterval(interval);
    }, [createdAt]);

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] ${isUrgent ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            <Timer className="h-3 w-3" />
            {remaining}
        </span>
    );
}

function ReviewItemRow({ item, isPending, chatNameMap }: { item: ReviewItem; isPending: boolean; chatNameMap: Record<string, string> }) {
    const queryClient = useQueryClient();
    const catConfig = CATEGORY_CONFIG[item.aiCategory || ''];
    const CategoryIcon = catConfig?.icon || MessageSquare;
    const catColor = catConfig?.color || 'text-muted-foreground';
    const catBg = catConfig?.bg || 'bg-muted/50 border-muted-foreground/20';
    const urgencyClass = URGENCY_COLORS[item.aiUrgency || ''] || URGENCY_COLORS.LOW;
    const displayName = item.senderName || item.chatTitle || chatNameMap[item.telegramChatId] || `Chat ${item.telegramChatId}`;
    const isAutoCreated = item.resolvedNote?.startsWith('Auto-created');

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
                        {displayName}
                    </span>
                    {item.driver && (
                        <>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                                {item.driver.user.firstName} {item.driver.user.lastName}
                            </Badge>
                            {item.driver.user.phone && (
                                <a href={`tel:${item.driver.user.phone}`} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary shrink-0">
                                    <Phone className="h-2.5 w-2.5" />
                                    {item.driver.user.phone}
                                </a>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isPending && <ExpiryTimer createdAt={item.createdAt} />}
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                </div>
            </div>

            {/* Message preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.messageContent}</p>

            {/* AI badges + truck info */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className={`text-[10px] gap-1 border ${catBg}`}>
                    <CategoryIcon className={`h-3 w-3 ${catColor}`} />
                    <span className={catColor}>{item.aiCategory || 'Unknown'}</span>
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
                {item.driver?.currentTruck && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Truck className="h-2.5 w-2.5" />
                        {item.driver.currentTruck.truckNumber}
                        {item.driver.currentTruck.currentLocation && (
                            <>
                                <MapPin className="h-2.5 w-2.5 ml-1" />
                                <span className="max-w-[200px] truncate">{item.driver.currentTruck.currentLocation}</span>
                            </>
                        )}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    {item.status === 'APPROVED' && item.breakdown && (
                        <Badge variant="secondary" className="text-[10px]">
                            Case {item.breakdown.breakdownNumber}
                        </Badge>
                    )}
                    {isAutoCreated && (
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30 gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {item.resolvedNote?.includes('emergency') ? 'Emergency Auto-created' : 'Auto-created'}
                        </Badge>
                    )}
                    {item.resolvedBy && !isAutoCreated && (
                        <span>by {item.resolvedBy.firstName} {item.resolvedBy.lastName}</span>
                    )}
                    {item.resolvedAt && (
                        <span>{formatDistanceToNow(new Date(item.resolvedAt), { addSuffix: true })}</span>
                    )}
                    {item.resolvedNote && !isAutoCreated && (
                        <span className="italic">— {item.resolvedNote}</span>
                    )}
                </div>
            )}
        </div>
    );
}
