'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Users, Radio, Loader2, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TelegramDialog, getDisplayName, getSubtitle, getInitials } from '@/lib/types/telegram';

interface TelegramConversationListProps {
    dialogs: TelegramDialog[];
    isLoading: boolean;
    selectedChatId?: string;
    onSelectChat: (dialog: TelegramDialog) => void;
    className?: string;
}

function DialogIcon({ dialog }: { dialog: TelegramDialog }) {
    if (dialog.isChannel) return <Radio className="h-3.5 w-3.5 text-muted-foreground" />;
    if (dialog.isGroup) return <Users className="h-3.5 w-3.5 text-muted-foreground" />;
    return <User className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function TelegramConversationList({
    dialogs,
    isLoading,
    selectedChatId,
    onSelectChat,
    className,
}: TelegramConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = dialogs.filter(d => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        const displayName = getDisplayName(d).toLowerCase();
        const username = (d.username || '').toLowerCase();
        const phone = (d.phone || '').toLowerCase();
        return displayName.includes(q) || username.includes(q) || phone.includes(q);
    });

    return (
        <div className={className}>
            {/* Search */}
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                    />
                </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs">
                        No conversations found
                    </div>
                ) : (
                    <div className="divide-y">
                        {filtered.map(dialog => {
                            const name = getDisplayName(dialog);
                            const subtitle = getSubtitle(dialog);
                            const isSelected = selectedChatId === dialog.id;

                            return (
                                <button
                                    key={dialog.id}
                                    onClick={() => onSelectChat(dialog)}
                                    className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted' : ''}`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="relative">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="text-[10px] bg-primary/10 font-medium">
                                                    {getInitials(name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {dialog.aiAutoReply && (
                                                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                                                    <Bot className="h-2.5 w-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <DialogIcon dialog={dialog} />
                                                    <span className="text-sm font-medium truncate">{name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {dialog.unreadCount > 0 && (
                                                        <Badge className="bg-primary text-[10px] h-4 min-w-4 px-1">
                                                            {dialog.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {subtitle && (
                                                <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {dialog.lastMessage || 'No messages'}
                                            </p>
                                            {dialog.lastMessageDate && (
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {formatDistanceToNow(new Date(dialog.lastMessageDate), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
