'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIAssistantChatProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

export default function AIAssistantChat({
    isOpen: controlledIsOpen,
    onOpenChange,
    hideTrigger = false
}: AIAssistantChatProps = {}) {
    const { data: session } = useSession();
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Use controlled state if provided, otherwise internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open);
        } else {
            setInternalIsOpen(open);
        }
    };

    const [view, setView] = useState<'menu' | 'chat' | 'help'>('menu');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Reset view when closed
    useEffect(() => {
        if (!isOpen) {
            setView('menu'); // Reset to menu when closed
            setMessages([]); // Clear messages when closed
            setInput(''); // Clear input when closed
            setIsLoading(false); // Reset loading state
        }
    }, [isOpen]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (view === 'chat' && lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, view]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Create placeholder for assistant message
        const assistantMessage: Message = {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        try {
            const response = await fetch('/api/ai/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) throw new Error('Failed to get response');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullText = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: !done });

                // Handle OpenAI stream chunks (approximate parsing for speed)
                const lines = chunkValue.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const content = data.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullText += content;
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    const lastMsg = newMessages[newMessages.length - 1];
                                    if (lastMsg.role === 'assistant') {
                                        lastMsg.content = fullText;
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (e) {
                            // Ignore parse errors for partial chunks or malformed data
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast({ title: 'Error', description: 'Failed to get a response.', variant: 'destructive' });
            // Remove the empty message if failed
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    if (!session?.user) return null;

    const renderContent = () => {
        switch (view) {
            case 'menu':
                return (
                    <div className="flex flex-col gap-4 p-6 h-full items-center justify-center">
                        <div className="bg-primary/10 p-4 rounded-full mb-2">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-6">How can we help?</h3>

                        <Button
                            variant="outline"
                            className="w-full h-14 justify-start gap-4 text-base border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                            onClick={() => setView('chat')}
                        >
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <Bot className="h-5 w-5 text-indigo-600" />
                            </div>
                            Ask AI Assistant
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full h-14 justify-start gap-4 text-base border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                            onClick={() => setView('help')}
                        >
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Send className="h-5 w-5 text-blue-600" />
                            </div>
                            Contact Support (Telegram)
                        </Button>
                    </div>
                );

            case 'help':
                return (
                    <div className="flex flex-col gap-4 p-6 h-full items-center justify-center text-center">
                        <div className="bg-blue-100 p-4 rounded-full mb-4">
                            <Send className="h-12 w-12 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold">Contact Support</h3>
                        <p className="text-muted-foreground text-sm max-w-[250px]">
                            Need human help? Reach out to us directly on Telegram for real-time support.
                        </p>
                        <Button
                            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white gap-2"
                            onClick={() => window.open('https://t.me/adrianvia', '_blank')}
                        >
                            <Send className="h-4 w-4" />
                            Open Telegram
                        </Button>
                        <Button variant="ghost" className="mt-2" onClick={() => setView('menu')}>
                            Back to Menu
                        </Button>
                    </div>
                );

            case 'chat':
                return (
                    <>
                        <CardContent className="flex-1 p-0 overflow-hidden bg-background/50">
                            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4 space-y-4">
                                        <div className="bg-primary/5 p-4 rounded-full">
                                            <BrainCircuit className="h-12 w-12 text-primary/50" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground mb-1">AI Assistant</h3>
                                            <p className="text-sm">Ask me about loads, invoices, or documents.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg, index) => (
                                            <div key={index} className={cn("flex w-full mb-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none border")}>
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && !messages[messages.length - 1].content && (
                                            <div className="flex w-full justify-start mb-4">
                                                <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-3 border flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-sm">Thinking...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={lastMessageRef} />
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-3 border-t bg-background shrink-0">
                            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                                <Input
                                    placeholder="Type your message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading && !messages[messages.length - 1].content}
                                    className="flex-1 focus-visible:ring-primary/20"
                                />
                                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className={cn("transition-all", input.trim() ? "bg-primary" : "bg-muted text-muted-foreground")}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </>
                );
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!hideTrigger && (
                <div className={cn(
                    "fixed bottom-6 right-6 z-50 transition-all duration-300",
                    isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
                )}>
                    <Button
                        onClick={() => { setIsOpen(true); setView('menu'); }}
                        size="icon"
                        className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-110 flex items-center justify-center p-0"
                    >
                        <Sparkles className="h-7 w-7 text-white" />
                    </Button>
                </div>
            )}

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-300 transform origin-bottom-right shadow-2xl",
                isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-10 pointer-events-none"
            )}>
                <Card className="border-primary/20 h-[600px] flex flex-col overflow-hidden glass-card">
                    <CardHeader className="bg-primary/5 p-4 flex flex-row items-center justify-between border-b shrink-0">
                        <div className="flex items-center gap-2">
                            {view !== 'menu' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => setView('menu')}>
                                    <span className="text-xs">←</span>
                                </Button>
                            )}
                            <div className="bg-primary/10 p-2 rounded-full">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Help & Support</CardTitle>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    {renderContent()}
                </Card>
            </div>
        </>
    );
}
