'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    MessageSquare,
    Send,
    Search,
    User,
    Users,
    Radio,
    Loader2,
    ArrowLeft,
    Paperclip,
    Image,
    File,
    CheckCheck,
    X,
    Bot,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import Link from 'next/link';

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

interface Message {
    id: number;
    text: string;
    date: string | null;
    out: boolean;
    senderId: string;
    replyToMsgId: number | null;
    media: {
        type: string;
    } | null;
}

interface TelegramChatProps {
    chat: Dialog;
    onBack: () => void;
}

async function fetchMessages(chatId: string) {
    const response = await fetch(apiUrl(`/api/telegram/messages/${chatId}`));
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
}

async function sendMessage(chatId: string, text: string) {
    const response = await fetch(apiUrl(`/api/telegram/messages/${chatId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
}

async function uploadFile(chatId: string, file: File, caption?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    if (caption) formData.append('caption', caption);

    const response = await fetch(apiUrl('/api/telegram/upload'), {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
}

async function updateDriverAutoReply(telegramId: string, enabled: boolean) {
    const response = await fetch(apiUrl('/api/telegram/driver-settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, aiAutoReply: enabled }),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
}

async function fetchDriverSettings(telegramId: string) {
    const response = await fetch(apiUrl(`/api/telegram/driver-settings?telegramId=${telegramId}`)); // Assuming GET endpoint
    if (!response.ok) return { aiAutoReply: false }; // Default to false if fail or not found
    return response.json();
}

export default function TelegramChat({ chat, onBack }: TelegramChatProps) {
    const queryClient = useQueryClient();
    const [messageInput, setMessageInput] = useState('');
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch messages
    const { data: messagesData, isLoading: messagesLoading } = useQuery({
        queryKey: ['telegram-messages', chat.id],
        queryFn: () => fetchMessages(chat.id),
        refetchInterval: 5000,
    });

    // Fetch driver settings (for AI toggle)
    const { data: driverSettings, isLoading: settingsLoading } = useQuery({
        queryKey: ['telegram-driver-settings', chat.id],
        queryFn: () => fetchDriverSettings(chat.id),
        enabled: chat.isUser, // Only fetch for direct driver chats
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: ({ chatId, text }: { chatId: string; text: string }) =>
            sendMessage(chatId, text),
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['telegram-messages', chat.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send message');
        },
    });

    // Upload file mutation
    const uploadMutation = useMutation({
        mutationFn: ({ chatId, file, caption }: { chatId: string; file: File; caption?: string }) =>
            uploadFile(chatId, file, caption),
        onSuccess: () => {
            setSelectedFile(null);
            setFilePreview(null);
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['telegram-messages', chat.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
            toast.success('File sent successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send file');
        },
    });

    // Toggle AI Auto-Reply Mutation
    const toggleAiMutation = useMutation({
        mutationFn: (enabled: boolean) => updateDriverAutoReply(chat.id, enabled),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['telegram-driver-settings', chat.id] });
            toast.success('AI Auto-Reply updated');
        },
        onError: () => toast.error('Failed to update AI settings'),
    });

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setFilePreview(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleSend = () => {
        if (selectedFile) {
            uploadMutation.mutate({
                chatId: chat.id,
                file: selectedFile,
                caption: messageInput || undefined
            });
        } else if (messageInput.trim()) {
            sendMutation.mutate({ chatId: chat.id, text: messageInput });
        }
    };

    const cancelFileSelection = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const getDialogIcon = (dialog: Dialog) => {
        if (dialog.isChannel) return <Radio className="h-4 w-4" />;
        if (dialog.isGroup) return <Users className="h-4 w-4" />;
        return <User className="h-4 w-4" />;
    };

    const getMediaIcon = (media: Message['media']) => {
        if (!media) return null;
        const type = media.type.toLowerCase();
        if (type.includes('photo') || type.includes('image')) return <Image className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    const messages: Message[] = messagesData?.data || [];
    const filteredMessages = messageSearchQuery
        ? messages.filter((m) => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()))
        : messages;

    return (
        <>
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
            />

            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar>
                        <AvatarFallback className="bg-primary/10">
                            {getInitials(chat.title)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold flex items-center gap-2">
                            {getDialogIcon(chat)}
                            {chat.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {chat.isChannel ? 'Channel' : chat.isGroup ? 'Group' : 'Private Chat'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* AI Toggle for Private Chats */}
                    {chat.isUser && (
                        <div className="flex items-center gap-2 mr-2 border-r pr-4">
                            <Label htmlFor="ai-toggle" className="text-xs font-medium flex items-center gap-1">
                                <Bot className="h-3 w-3" />
                                Auto-Reply
                            </Label>
                            <Switch
                                id="ai-toggle"
                                checked={driverSettings?.aiAutoReply || false}
                                onCheckedChange={(checked) => toggleAiMutation.mutate(checked)}
                                disabled={settingsLoading || toggleAiMutation.isPending}
                            />
                        </div>
                    )}

                    <Button variant="ghost" size="icon" onClick={() => setShowMessageSearch(!showMessageSearch)}>
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Message Search Bar */}
            {showMessageSearch && (
                <div className="p-2 border-b bg-muted/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search in conversation..."
                            value={messageSearchQuery}
                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        {messageSearchQuery ? 'No messages found' : 'No messages yet. Start a conversation!'}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[...filteredMessages].reverse().map((msg) => (
                            <div key={msg.id} className={`flex ${msg.out ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.out ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {/* Media indicator */}
                                    {msg.media && (
                                        <div className={`flex items-center gap-2 mb-1 ${msg.out ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                            {getMediaIcon(msg.media)}
                                            <span className="text-xs">{msg.media.type}</span>
                                        </div>
                                    )}

                                    {/* Message text */}
                                    {msg.text && <p className="break-words">{msg.text}</p>}

                                    {/* Timestamp and status */}
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.out ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                        {msg.date && (
                                            <span className="text-xs">
                                                {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        {msg.out && <CheckCheck className="h-3 w-3 text-blue-400" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ScrollArea>

            {/* File Preview */}
            {selectedFile && (
                <div className="p-3 border-t bg-muted/50">
                    <div className="flex items-center gap-3 p-2 bg-background rounded-lg">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                        ) : (
                            <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                                <File className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={cancelFileSelection}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending || sendMutation.isPending}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                        placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={sendMutation.isPending || uploadMutation.isPending}
                    />
                    <Button onClick={handleSend} disabled={(!messageInput.trim() && !selectedFile) || sendMutation.isPending || uploadMutation.isPending}>
                        {sendMutation.isPending || uploadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
