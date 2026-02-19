'use client';

import { useState, useRef, useEffect, useMemo, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MessageSquare, Send, X, Minimize2, Maximize2, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SmsMessage {
    id: string;
    content: string;
    direction: 'sent' | 'received';
    createdAt: string;
    user?: { firstName: string; lastName: string };
}

interface LeadSmsMessengerProps {
    lead: { leadId: string; leadName: string; leadPhone: string } | null;
    onClose: () => void;
}

export default function LeadSmsMessenger({ lead, onClose }: LeadSmsMessengerProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['lead-sms-history', lead?.leadId],
        queryFn: async () => {
            const res = await fetch(`/api/crm/leads/${lead!.leadId}/sms-history`);
            if (!res.ok) throw new Error('Failed to fetch SMS history');
            return res.json();
        },
        enabled: !!lead?.leadId,
        refetchInterval: 15000,
    });

    const smsMessages: SmsMessage[] = useMemo(() => {
        if (!data?.data) return [];
        return data.data.map((a: any) => ({
            id: a.id,
            content: a.content,
            direction: a.metadata?.sent ? 'sent' as const : 'received' as const,
            createdAt: a.createdAt,
            user: a.user,
        }));
    }, [data]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (!isMinimized) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [smsMessages, isMinimized]);

    // Reset minimized state when lead changes
    useEffect(() => {
        setIsMinimized(false);
        setMessage('');
    }, [lead?.leadId]);

    const handleSend = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !lead || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/crm/leads/${lead.leadId}/send-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim() }),
            });
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || 'Failed to send SMS');

            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['lead-sms-history', lead.leadId] });
            toast.success('SMS sent');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (!lead) return null;

    // Minimized bar
    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[49] w-[300px] shadow-lg">
                <Card className="border-green-500/30">
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <MessageSquare className="h-4 w-4 text-green-600 shrink-0" />
                            <span className="text-sm font-medium truncate">{lead.leadName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                                onClick={() => setIsMinimized(false)}>
                                <Maximize2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                                onClick={onClose}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Expanded messenger
    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-[49] w-[360px] max-w-[calc(100vw-48px)]",
            "transition-all duration-300 shadow-2xl"
        )}>
            <Card className="border-green-500/20 h-[500px] flex flex-col overflow-hidden">
                {/* Header */}
                <CardHeader className="bg-green-50 dark:bg-green-950/20 p-3 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="bg-green-100 dark:bg-green-900/40 p-1.5 rounded-full shrink-0">
                                <MessageSquare className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{lead.leadName}</p>
                                <p className="text-xs text-muted-foreground">{lead.leadPhone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => setIsMinimized(true)}>
                                <Minimize2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={onClose}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Message thread */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-3 space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : smsMessages.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">
                                    No messages yet. Send the first SMS!
                                </p>
                            ) : (
                                smsMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex",
                                            msg.direction === 'sent' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                                            msg.direction === 'sent'
                                                ? "bg-green-600 text-white rounded-br-sm"
                                                : "bg-muted text-foreground rounded-bl-sm border"
                                        )}>
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            <p className={cn(
                                                "text-[10px] mt-1",
                                                msg.direction === 'sent' ? "text-green-200" : "text-muted-foreground"
                                            )}>
                                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                {msg.user && msg.direction === 'sent' && (
                                                    <span> &middot; {msg.user.firstName}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </ScrollArea>
                </CardContent>

                {/* Input footer */}
                <CardFooter className="p-3 border-t shrink-0 flex-col items-stretch gap-1">
                    <form onSubmit={handleSend} className="flex w-full items-center gap-2">
                        <Input
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isSending}
                            maxLength={1600}
                            className="flex-1"
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isSending || !message.trim()}
                            className="bg-green-600 hover:bg-green-700 shrink-0"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                    {message.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                            {message.length}/1600
                            {message.length > 160 && ` (${Math.ceil(message.length / 160)} segments)`}
                        </p>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
