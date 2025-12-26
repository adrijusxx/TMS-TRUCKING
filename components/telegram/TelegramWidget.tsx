'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, User, Users, Radio, Loader2, Settings, ExternalLink } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Dialog {
    id: string;
    title: string;
    unreadCount: number;
    lastMessage: string;
    lastMessageDate: string | null;
    isUser: boolean;
    isGroup: boolean;
    isChannel: boolean;
}

async function fetchDialogs() {
    const response = await fetch(apiUrl('/api/telegram/dialogs?limit=10'));
    if (!response.ok) {
        const data = await response.json();
        if (data.needsConnection) {
            throw new Error('NOT_CONNECTED');
        }
        throw new Error('Failed to fetch dialogs');
    }
    return response.json();
}

export default function TelegramWidget() {
    const { data: dialogsData, isLoading, error } = useQuery({
        queryKey: ['telegram-dialogs-widget'],
        queryFn: fetchDialogs,
        refetchInterval: 30000, // Refresh every 30 seconds
        retry: false,
    });

    const dialogs: Dialog[] = dialogsData?.data || [];

    const getDialogIcon = (dialog: Dialog) => {
        if (dialog.isChannel) return <Radio className="h-3 w-3" />;
        if (dialog.isGroup) return <Users className="h-3 w-3" />;
        return <User className="h-3 w-3" />;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Not connected state
    if (error?.message === 'NOT_CONNECTED') {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Telegram Messages
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground mb-3">
                            Connect Telegram to view messages
                        </p>
                        <Link href="/dashboard/settings/integrations/telegram">
                            <Button size="sm" variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Connect
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Telegram Messages
                    </CardTitle>
                    <Link href="/dashboard/telegram">
                        <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : dialogs.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No recent conversations
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                            {dialogs.slice(0, 5).map((dialog) => (
                                <Link
                                    key={dialog.id}
                                    href="/dashboard/telegram"
                                    className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs bg-primary/10">
                                            {getInitials(dialog.title)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium truncate flex items-center gap-1">
                                                {getDialogIcon(dialog)}
                                                {dialog.title}
                                            </span>
                                            {dialog.unreadCount > 0 && (
                                                <Badge className="bg-primary text-xs h-5 min-w-5 flex items-center justify-center">
                                                    {dialog.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {dialog.lastMessage || 'No messages'}
                                        </p>
                                        {dialog.lastMessageDate && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatDistanceToNow(new Date(dialog.lastMessageDate), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </ScrollArea>
                )}
                <div className="p-2 border-t">
                    <Link href="/dashboard/telegram" className="block">
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                            View All Messages
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
