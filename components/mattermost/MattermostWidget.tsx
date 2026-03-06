'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import Link from 'next/link';

interface RecentConversation {
    channelId: string;
    channelName: string;
    displayName: string;
    lastMessage: string;
    lastMessageAt: string;
    senderName: string;
    unreadCount?: number;
}

interface WidgetData {
    isConnected: boolean;
    conversations: RecentConversation[];
    pendingReviewCount: number;
}

async function fetchWidgetData(): Promise<{ data: WidgetData }> {
    const res = await fetch(apiUrl('/api/mattermost/widget'));
    if (!res.ok) throw new Error('Failed to fetch widget data');
    return res.json();
}

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

export default function MattermostWidget() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['mattermost-widget'],
        queryFn: fetchWidgetData,
        refetchInterval: 15000,
    });

    const widget = data?.data;

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        Mattermost
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {widget?.pendingReviewCount ? (
                            <Badge variant="error" size="xs">{widget.pendingReviewCount} pending</Badge>
                        ) : null}
                        {widget?.isConnected ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : error || !widget ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Unable to load</p>
                ) : !widget.isConnected ? (
                    <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">Not connected</p>
                        <Link
                            href="/dashboard/settings/integrations/mattermost"
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                            Configure integration
                        </Link>
                    </div>
                ) : widget.conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No recent conversations</p>
                ) : (
                    <>
                        {widget.conversations.slice(0, 5).map(conv => (
                            <div key={conv.channelId} className="flex items-start gap-2 py-1">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium truncate">
                                            {conv.displayName || conv.channelName}
                                        </span>
                                        {(conv.unreadCount ?? 0) > 0 && (
                                            <Badge variant="default" size="xs">{conv.unreadCount}</Badge>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        <span className="font-medium">{conv.senderName}:</span> {conv.lastMessage}
                                    </p>
                                </div>
                                <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">
                                    {formatRelativeTime(conv.lastMessageAt)}
                                </span>
                            </div>
                        ))}
                        <Link
                            href="/dashboard/mattermost"
                            className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-1"
                        >
                            View All <ArrowRight className="h-3 w-3" />
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
