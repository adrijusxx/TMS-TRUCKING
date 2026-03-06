'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, Hash, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface Channel {
    id: string;
    name: string;
    displayName: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount?: number;
}

interface Message {
    id: string;
    channelId: string;
    senderName: string;
    senderUsername: string;
    message: string;
    createdAt: string;
    isBot?: boolean;
}

async function fetchChannels(): Promise<{ data: Channel[] }> {
    const res = await fetch(apiUrl('/api/mattermost/channels'));
    if (!res.ok) throw new Error('Failed to fetch channels');
    return res.json();
}

async function fetchMessages(channelId: string): Promise<{ data: Message[] }> {
    const res = await fetch(apiUrl(`/api/mattermost/messages/${channelId}`));
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MattermostFullWidget() {
    const queryClient = useQueryClient();
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: channelsData, isLoading: channelsLoading } = useQuery({
        queryKey: ['mattermost-channels'],
        queryFn: fetchChannels,
        refetchInterval: 15000,
    });

    const { data: messagesData, isLoading: messagesLoading } = useQuery({
        queryKey: ['mattermost-messages', selectedChannelId],
        queryFn: () => fetchMessages(selectedChannelId!),
        enabled: !!selectedChannelId,
        refetchInterval: 5000,
    });

    const sendMutation = useMutation({
        mutationFn: async ({ channelId, message }: { channelId: string; message: string }) => {
            const res = await fetch(apiUrl(`/api/mattermost/messages/${channelId}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['mattermost-messages', selectedChannelId] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const channels = channelsData?.data || [];
    const messages = messagesData?.data || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = () => {
        if (!messageInput.trim() || !selectedChannelId) return;
        sendMutation.mutate({ channelId: selectedChannelId, message: messageInput.trim() });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-[calc(100vh-220px)] border rounded-lg overflow-hidden bg-background">
            {/* Channel List */}
            <div className="w-72 border-r flex flex-col">
                <div className="p-3 border-b">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />Channels
                    </h3>
                </div>
                <ScrollArea className="flex-1">
                    {channelsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : channels.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3">No channels found</p>
                    ) : (
                        <div className="p-1">
                            {channels.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => setSelectedChannelId(channel.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        selectedChannelId === channel.id
                                            ? 'bg-accent text-accent-foreground'
                                            : 'hover:bg-muted'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-xs truncate">
                                            {channel.displayName || channel.name}
                                        </span>
                                        {(channel.unreadCount ?? 0) > 0 && (
                                            <Badge variant="default" size="xs">{channel.unreadCount}</Badge>
                                        )}
                                    </div>
                                    {channel.lastMessage && (
                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                            {channel.lastMessage}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Messages Panel */}
            <div className="flex-1 flex flex-col">
                {selectedChannelId ? (
                    <>
                        <div className="p-3 border-b">
                            <h3 className="text-sm font-semibold">
                                {channels.find(c => c.id === selectedChannelId)?.displayName || 'Channel'}
                            </h3>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                            {messagesLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">No messages yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map(msg => (
                                        <MessageBubble key={msg.id} message={msg} />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>
                        <Separator />
                        <div className="p-3 flex gap-2">
                            <Input
                                value={messageInput}
                                onChange={e => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="h-9 text-sm"
                                disabled={sendMutation.isPending}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!messageInput.trim() || sendMutation.isPending}
                                size="sm"
                                className="h-9 px-3"
                            >
                                {sendMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Select a channel to view messages</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    return (
        <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{message.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
                    {message.isBot && <Badge variant="secondary" size="xs">Bot</Badge>}
                </div>
                <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap break-words">
                    {message.message}
                </p>
            </div>
        </div>
    );
}
