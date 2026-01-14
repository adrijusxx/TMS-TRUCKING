'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    MessageSquare,
    Search,
    User,
    Users,
    Radio,
    Loader2,
    Settings,
} from 'lucide-react';
import TelegramChat from '@/components/telegram/TelegramChat';
import { toast } from 'sonner';
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
    const response = await fetch(apiUrl('/api/telegram/dialogs'));
    if (!response.ok) throw new Error('Failed to fetch dialogs');
    return response.json();
}

export default function TelegramPage() {
    const queryClient = useQueryClient();
    const [selectedChat, setSelectedChat] = useState<Dialog | null>(null);
    // Fetch dialogs
    const { data: dialogsData, isLoading: dialogsLoading, error: dialogsError } = useQuery({
        queryKey: ['telegram-dialogs'],
        queryFn: fetchDialogs,
        refetchInterval: 10000,
    });

    const [searchQuery, setSearchQuery] = useState('');

    const dialogs: Dialog[] = dialogsData?.data || [];
    const filteredDialogs = dialogs.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter messages by search query


    const getDialogIcon = (dialog: Dialog) => {
        if (dialog.isChannel) return <Radio className="h-4 w-4" />;
        if (dialog.isGroup) return <Users className="h-4 w-4" />;
        return <User className="h-4 w-4" />;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };



    if (dialogsError) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Telegram Not Connected</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Connect your Telegram account to view and send messages.
                </p>
                <Link href="/dashboard/settings/integrations/telegram">
                    <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Connect Telegram
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-120px)]">
            {/* Sidebar - Conversation List */}
            <div className={`w-80 border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Telegram
                        </h1>
                        <Link href="/dashboard/settings/integrations/telegram">
                            <Button variant="ghost" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {dialogsLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredDialogs.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            No conversations found
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredDialogs.map((dialog) => (
                                <button
                                    key={dialog.id}
                                    onClick={() => setSelectedChat(dialog)}
                                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${selectedChat?.id === dialog.id ? 'bg-muted' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary/10">
                                                {getInitials(dialog.title)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate flex items-center gap-2">
                                                    {getDialogIcon(dialog)}
                                                    {dialog.title}
                                                </span>
                                                {dialog.unreadCount > 0 && (
                                                    <Badge className="bg-primary ml-2">
                                                        {dialog.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate mt-1">
                                                {dialog.lastMessage || 'No messages'}
                                            </p>
                                            {dialog.lastMessageDate && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(dialog.lastMessageDate), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Chat View */}
            <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <TelegramChat
                        chat={selectedChat}
                        onBack={() => setSelectedChat(null)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
