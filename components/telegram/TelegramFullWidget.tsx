'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Settings } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import Link from 'next/link';
import { TelegramDialog } from '@/lib/types/telegram';
import TelegramConversationList from './TelegramConversationList';
import TelegramChatView from './TelegramChatView';
import CreateCaseModal from '@/components/fleet/CreateCaseModal';

async function fetchDialogs() {
    const res = await fetch(apiUrl('/api/telegram/dialogs'));
    if (!res.ok) {
        const data = await res.json();
        if (data.needsConnection) throw new Error('NOT_CONNECTED');
        throw new Error('Failed to fetch dialogs');
    }
    return res.json();
}

export default function TelegramFullWidget() {
    const [selectedChat, setSelectedChat] = useState<TelegramDialog | null>(null);
    const [createCaseOpen, setCreateCaseOpen] = useState(false);
    const [createCaseDefaults, setCreateCaseDefaults] = useState<{ description?: string }>({});

    const { data: dialogsData, isLoading, error } = useQuery({
        queryKey: ['telegram-dialogs'],
        queryFn: fetchDialogs,
        refetchInterval: 30000,
        retry: false,
    });

    const dialogs: TelegramDialog[] = dialogsData?.data || [];

    if (error?.message === 'NOT_CONNECTED') {
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
        <>
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="h-5 w-5" />
                            Messages
                        </CardTitle>
                        <Link href="/dashboard/settings/integrations/telegram">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex h-[600px] border-t">
                        {/* Sidebar */}
                        <TelegramConversationList
                            dialogs={dialogs}
                            isLoading={isLoading}
                            selectedChatId={selectedChat?.id}
                            onSelectChat={setSelectedChat}
                            className={`w-72 border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}
                        />

                        {/* Chat */}
                        <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                            {selectedChat ? (
                                <TelegramChatView
                                    chat={selectedChat}
                                    onBack={() => setSelectedChat(null)}
                                    onCreateCase={(text) => {
                                        setCreateCaseDefaults({ description: text });
                                        setCreateCaseOpen(true);
                                    }}
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Select a conversation</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <CreateCaseModal
                open={createCaseOpen}
                onOpenChange={setCreateCaseOpen}
                defaultValues={createCaseDefaults}
            />
        </>
    );
}
