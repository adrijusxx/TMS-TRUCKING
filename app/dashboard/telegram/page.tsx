'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare, ClipboardCheck, AlertTriangle, Settings, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';
import TelegramFullWidget from '@/components/telegram/TelegramFullWidget';
import TelegramReviewQueue from '@/components/telegram/TelegramReviewQueue';
import TelegramActiveCases from '@/components/telegram/TelegramActiveCases';

export default function TelegramPage() {
    const [activeTab, setActiveTab] = useState('messages');

    // Fetch review queue count for badge
    const { data: reviewData } = useQuery({
        queryKey: ['telegram-review-queue', 'PENDING', 1, ''],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/review-queue?status=PENDING&pageSize=1'));
            if (!res.ok) return null;
            const json = await res.json();
            return json.data;
        },
        refetchInterval: 15000,
    });

    const pendingCount = reviewData?.counts?.pending || 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-6 w-6" />
                        Telegram
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Messages, review queue, and active cases
                    </p>
                </div>
                <Link href="/dashboard/settings/integrations/telegram">
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1.5" />
                        Settings
                    </Button>
                </Link>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="messages" className="gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Messages
                    </TabsTrigger>
                    <TabsTrigger value="review" className="gap-1.5">
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Review Queue
                        {pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                                {pendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="cases" className="gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Active Cases
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="mt-3">
                    <TelegramFullWidget />
                </TabsContent>

                <TabsContent value="review" className="mt-3">
                    <TelegramReviewQueue />
                </TabsContent>

                <TabsContent value="cases" className="mt-3">
                    <TelegramActiveCases />
                </TabsContent>
            </Tabs>
        </div>
    );
}
