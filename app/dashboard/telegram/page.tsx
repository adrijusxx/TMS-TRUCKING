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
    Send,
    Search,
    User,
    Users,
    Radio,
    Loader2,
    ArrowLeft,
    Settings,
    Paperclip,
    Image,
    File,
    Check,
    CheckCheck,
    X,
    Smile,
} from 'lucide-react';
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

async function fetchDialogs() {
    const response = await fetch(apiUrl('/api/telegram/dialogs'));
    if (!response.ok) throw new Error('Failed to fetch dialogs');
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

export default function TelegramPage() {
    const queryClient = useQueryClient();
    const [selectedChat, setSelectedChat] = useState<Dialog | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch dialogs
    const { data: dialogsData, isLoading: dialogsLoading, error: dialogsError } = useQuery({
        queryKey: ['telegram-dialogs'],
        queryFn: fetchDialogs,
        refetchInterval: 10000,
    });

    // Fetch messages for selected chat
    const { data: messagesData, isLoading: messagesLoading } = useQuery({
        queryKey: ['telegram-messages', selectedChat?.id],
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
            queryClient.invalidateQueries({ queryKey: ['telegram-messages', selectedChat?.id] });
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
            queryClient.invalidateQueries({ queryKey: ['telegram-messages', selectedChat?.id] });
            queryClient.invalidateQueries({ queryKey: ['telegram-dialogs'] });
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

    const filteredDialogs = dialogs.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter messages by search query
    const filteredMessages = messageSearchQuery
        ? messages.filter((m) => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()))
        : messages;

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
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getMediaIcon = (media: Message['media']) => {
        if (!media) return null;
        const type = media.type.toLowerCase();
        if (type.includes('photo') || type.includes('image')) {
            return <Image className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
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
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
            />

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
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    onClick={() => setSelectedChat(null)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Avatar>
                                    <AvatarFallback className="bg-primary/10">
                                        {getInitials(selectedChat.title)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold flex items-center gap-2">
                                        {getDialogIcon(selectedChat)}
                                        {selectedChat.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedChat.isChannel
                                            ? 'Channel'
                                            : selectedChat.isGroup
                                                ? 'Group'
                                                : 'Private Chat'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowMessageSearch(!showMessageSearch)}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
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
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.out ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.out
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                    }`}
                                            >
                                                {/* Media indicator */}
                                                {msg.media && (
                                                    <div className={`flex items-center gap-2 mb-1 ${msg.out ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                                        }`}>
                                                        {getMediaIcon(msg.media)}
                                                        <span className="text-xs">{msg.media.type}</span>
                                                    </div>
                                                )}

                                                {/* Message text */}
                                                {msg.text && <p className="break-words">{msg.text}</p>}

                                                {/* Timestamp and status */}
                                                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.out
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-muted-foreground'
                                                    }`}>
                                                    {msg.date && (
                                                        <span className="text-xs">
                                                            {new Date(msg.date).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    )}
                                                    {/* Message status indicator */}
                                                    {msg.out && (
                                                        <CheckCheck className="h-3 w-3 text-blue-400" />
                                                    )}
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
                                        <img
                                            src={filePreview}
                                            alt="Preview"
                                            className="h-16 w-16 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                                            <File className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{selectedFile.name}</p>
                                        <p className="text-sm text-muted-foreground">
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
                        <div className="p-4 border-t">
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
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
