'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    Send, Loader2, Paperclip, File, X, ArrowLeft, Bot, User, Users, Radio,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { TelegramDialog, TelegramMessage, LinkedCase, getDisplayName, getSubtitle, getInitials } from '@/lib/types/telegram';
import TelegramMessageBubble from './TelegramMessageBubble';
import LinkDriverButton from './LinkDriverButton';

interface TelegramChatViewProps {
    chat: TelegramDialog;
    onBack: () => void;
    onCreateCase?: (description: string) => void;
}

async function fetchMessages(chatId: string) {
    const res = await fetch(apiUrl(`/api/telegram/messages/${chatId}`));
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
}

async function sendMessage(chatId: string, text: string) {
    const res = await fetch(apiUrl(`/api/telegram/messages/${chatId}`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
}

async function uploadFile(chatId: string, file: File, caption?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    if (caption) formData.append('caption', caption);
    const res = await fetch(apiUrl('/api/telegram/upload'), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
}

async function fetchLinkedCases(chatId: string) {
    const res = await fetch(apiUrl(`/api/telegram/messages/${chatId}/cases`));
    if (!res.ok) return { data: {} };
    return res.json();
}

async function updateDriverAutoReply(telegramId: string, enabled: boolean) {
    const res = await fetch(apiUrl('/api/telegram/driver-settings'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, aiAutoReply: enabled }),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
}

function formatDateSeparator(date: Date): string {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
}

export default function TelegramChatView({ chat, onBack, onCreateCase }: TelegramChatViewProps) {
    const queryClient = useQueryClient();
    const [messageInput, setMessageInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: messagesData, isLoading } = useQuery({
        queryKey: ['telegram-messages', chat.id],
        queryFn: () => fetchMessages(chat.id),
        refetchInterval: 5000,
    });

    const { data: linkedCasesData } = useQuery({
        queryKey: ['telegram-linked-cases', chat.id],
        queryFn: () => fetchLinkedCases(chat.id),
        refetchInterval: 30000,
    });
    const linkedCasesMap: Record<string, LinkedCase> = linkedCasesData?.data || {};

    const sendMutation = useMutation({
        mutationFn: ({ chatId, text }: { chatId: string; text: string }) => sendMessage(chatId, text),
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['telegram-messages', chat.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const uploadMutation = useMutation({
        mutationFn: ({ chatId, file, caption }: { chatId: string; file: File; caption?: string }) =>
            uploadFile(chatId, file, caption),
        onSuccess: () => {
            setSelectedFile(null);
            setFilePreview(null);
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['telegram-messages', chat.id] });
            toast.success('File sent');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const toggleAiMutation = useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateDriverAutoReply(id, enabled),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
            toast.success('AI Auto-Reply updated');
        },
        onError: () => toast.error('Failed to update AI settings'),
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData]);

    const messages: TelegramMessage[] = useMemo(() => {
        const msgs = (messagesData?.data || []) as TelegramMessage[];
        return [...msgs].reverse();
    }, [messagesData]);

    const handleSend = () => {
        if (selectedFile) {
            uploadMutation.mutate({ chatId: chat.id, file: selectedFile, caption: messageInput || undefined });
        } else if (messageInput.trim()) {
            sendMutation.mutate({ chatId: chat.id, text: messageInput });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = ev => setFilePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const isBusy = sendMutation.isPending || uploadMutation.isPending;
    const isPrivate = !chat.isChannel && !chat.isGroup;
    const name = getDisplayName(chat);

    return (
        <div className="flex-1 flex flex-col h-full">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" />

            {/* Header */}
            <div className="p-3 border-b flex items-center gap-3 shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9 border border-muted">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate flex items-center gap-1.5">
                        {chat.isChannel ? <Radio className="h-3.5 w-3.5" /> : chat.isGroup ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                        <span className="truncate">{name}</span>
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {chat.username && <span className="font-mono bg-muted px-1 py-0.5 rounded">@{chat.username}</span>}
                        {chat.phone && <span className="font-mono bg-muted px-1 py-0.5 rounded">{chat.phone}</span>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {isPrivate && (
                        <LinkDriverButton chatId={chat.id} chatTitle={chat.title} chatPhone={chat.phone} />
                    )}
                    {isPrivate && (
                        <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-full border border-border/50">
                            <div className="text-right mr-0.5">
                                <span className="text-[10px] font-semibold leading-none text-primary/80 block">AI</span>
                                <span className="text-[9px] leading-none text-muted-foreground">
                                    {chat.aiAutoReply ? 'On' : 'Off'}
                                </span>
                            </div>
                            <Switch
                                checked={chat.aiAutoReply || false}
                                onCheckedChange={checked => toggleAiMutation.mutate({ id: chat.id, enabled: checked })}
                                disabled={toggleAiMutation.isPending}
                                className="scale-[0.65] data-[state=checked]:bg-green-500"
                            />
                            <Bot className={`h-3.5 w-3.5 ${chat.aiAutoReply ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 py-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-12">No messages yet</div>
                ) : (
                    <div className="space-y-1">
                        {messages.map((msg, idx) => {
                            const msgDate = msg.date ? new Date(msg.date) : null;
                            const prevDate = idx > 0 && messages[idx - 1].date ? new Date(messages[idx - 1].date!) : null;
                            const showDateSep = msgDate && (!prevDate || !isSameDay(msgDate, prevDate));

                            return (
                                <div key={msg.id}>
                                    {showDateSep && (
                                        <div className="flex items-center gap-3 my-3">
                                            <div className="flex-1 border-t border-border/50" />
                                            <span className="text-[10px] text-muted-foreground font-medium px-2">
                                                {formatDateSeparator(msgDate!)}
                                            </span>
                                            <div className="flex-1 border-t border-border/50" />
                                        </div>
                                    )}
                                    <TelegramMessageBubble
                                        msg={msg}
                                        linkedCase={linkedCasesMap[msg.id?.toString()]}
                                        onCreateCase={onCreateCase ? text => onCreateCase(text) : undefined}
                                    />
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ScrollArea>

            {/* File Preview */}
            {selectedFile && (
                <div className="px-3 py-2 border-t bg-muted/30">
                    <div className="flex items-center gap-2 p-2 bg-background rounded border">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                        ) : (
                            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                                <File className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t shrink-0">
                <div className="flex gap-2 items-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Textarea
                        placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                        }}
                        disabled={isBusy}
                        rows={1}
                        className="min-h-[32px] max-h-[120px] text-sm resize-none"
                    />
                    <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={(!messageInput.trim() && !selectedFile) || isBusy}>
                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
