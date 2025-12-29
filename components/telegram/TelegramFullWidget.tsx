'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    MessageSquare,
    Send,
    User,
    Users,
    Radio,
    Loader2,
    Settings,
    Paperclip,
    Image,
    File,
    X,
    CheckCheck,
    ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import MessageMedia from './MessageMedia';

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
        messageId: number;
        chatId: string;
        isPhoto?: boolean;
        photoId?: string;
        isDocument?: boolean;
        fileName?: string;
        mimeType?: string;
        size?: number;
        isVoice?: boolean;
        duration?: number;
    } | null;
}

async function fetchDialogs() {
    const response = await fetch(apiUrl('/api/telegram/dialogs'));
    if (!response.ok) {
        const data = await response.json();
        if (data.needsConnection) {
            throw new Error('NOT_CONNECTED');
        }
        throw new Error('Failed to fetch dialogs');
    }
    return response.json();
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

export default function TelegramFullWidget() {
    const queryClient = useQueryClient();
    const [selectedChat, setSelectedChat] = useState<Dialog | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch dialogs
    const { data: dialogsData, isLoading: dialogsLoading, error: dialogsError } = useQuery({
        queryKey: ['telegram-dialogs-full'],
        queryFn: fetchDialogs,
        refetchInterval: 30000,
        retry: false,
    });

    // Fetch messages for selected chat
    const { data: messagesData, isLoading: messagesLoading } = useQuery({
        queryKey: ['telegram-messages-full', selectedChat?.id],
        queryFn: () => fetchMessages(selectedChat!.id),
        enabled: !!selectedChat,
        refetchInterval: 5000,
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: ({ chatId, text }: { chatId: string; text: string }) =>
            sendMessage(chatId, text),
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['telegram-messages-full', selectedChat?.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs-full'] });
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
            queryClient.invalidateQueries({ queryKey: ['telegram-messages-full', selectedChat?.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs-full'] });
            toast.success('File sent successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send file');
        },
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData]);

    // Handle file selection
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

    const dialogs: Dialog[] = dialogsData?.data || [];
    const messages: Message[] = messagesData?.data || [];

    const handleSend = () => {
        if (!selectedChat) return;

        if (selectedFile) {
            uploadMutation.mutate({
                chatId: selectedChat.id,
                file: selectedFile,
                caption: messageInput || undefined
            });
        } else if (messageInput.trim()) {
            sendMutation.mutate({ chatId: selectedChat.id, text: messageInput });
        }
    };

    const cancelFileSelection = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getDialogIcon = (dialog: Dialog) => {
        if (dialog.isChannel) return <Radio className="h-4 w-4" />;
        if (dialog.isGroup) return <Users className="h-4 w-4" />;
        return <User className="h-4 w-4" />;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getMediaIcon = (media: Message['media']) => {
        if (!media) return null;
        const type = media.type.toLowerCase();
        if (type.includes('photo') || type.includes('image')) {
            return <Image className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
    };

    // Not connected state
    if (dialogsError?.message === 'NOT_CONNECTED') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Telegram Messages
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground mb-4">
                            Connect Telegram to view and send messages
                        </p>
                        <Link href="/dashboard/settings/integrations/telegram">
                            <Button>
                                <Settings className="h-4 w-4 mr-2" />
                                Connect Telegram
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
            />

            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Telegram Messages
                    </CardTitle>
                    <Link href="/dashboard/settings/integrations/telegram">
                        <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="flex h-[600px]">
                    {/* Conversations List */}
                    <div className={`w-80 border-r ${selectedChat ? 'hidden md:block' : 'block'}`}>
                        <ScrollArea className="h-full">
                            {dialogsLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : dialogs.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    No conversations found
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {dialogs.map((dialog) => (
                                        <button
                                            key={dialog.id}
                                            onClick={() => setSelectedChat(dialog)}
                                            className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${selectedChat?.id === dialog.id ? 'bg-muted' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <Avatar className="h-10 w-10">
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
                                                            <Badge className="bg-primary text-xs h-5 min-w-5">
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
                            <>
                                {/* Chat Header */}
                                <div className="p-3 border-b flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setSelectedChat(null)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs bg-primary/10">
                                            {getInitials(selectedChat.title)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-sm flex items-center gap-1">
                                            {getDialogIcon(selectedChat)}
                                            {selectedChat.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedChat.isChannel ? 'Channel' : selectedChat.isGroup ? 'Group' : 'Private Chat'}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <ScrollArea className="flex-1 p-3">
                                    {messagesLoading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            No messages yet
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {[...messages].reverse().map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.out ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.out
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                            }`}
                                                    >
                                                        {msg.media && (
                                                            <MessageMedia media={msg.media} out={msg.out} />
                                                        )}
                                                        {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.out ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                            }`}>
                                                            {msg.date && (
                                                                <span className="text-xs">
                                                                    {new Date(msg.date).toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
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
                                    <div className="p-2 border-t bg-muted/50">
                                        <div className="flex items-center gap-2 p-2 bg-background rounded">
                                            {filePreview ? (
                                                <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                                            ) : (
                                                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                                                    <File className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={cancelFileSelection}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Message Input */}
                                <div className="p-3 border-t">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadMutation.isPending || sendMutation.isPending}
                                        >
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
                                        <Button
                                            onClick={handleSend}
                                            disabled={
                                                (!messageInput.trim() && !selectedFile) ||
                                                sendMutation.isPending ||
                                                uploadMutation.isPending
                                            }
                                        >
                                            {sendMutation.isPending || uploadMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Select a conversation to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
