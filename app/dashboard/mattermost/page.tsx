'use client';

import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ClipboardCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import MattermostFullWidget from '@/components/mattermost/MattermostFullWidget';
import MattermostReviewQueue from '@/components/mattermost/MattermostReviewQueue';
import MattermostActiveCases from '@/components/mattermost/MattermostActiveCases';

async function fetchCounts(): Promise<{ data: { pendingReview: number; activeCases: number } }> {
    const res = await fetch(apiUrl('/api/mattermost/counts'));
    if (!res.ok) throw new Error('Failed to fetch counts');
    return res.json();
}

export default function MattermostDashboardPage() {
    const { data: countsData } = useQuery({
        queryKey: ['mattermost-counts'],
        queryFn: fetchCounts,
        refetchInterval: 15000,
    });

    const counts = countsData?.data;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Mattermost
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Messaging hub for driver communications and case management
                </p>
            </div>

            <Tabs defaultValue="messages">
                <TabsList>
                    <TabsTrigger value="messages" className="gap-1.5 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" />Messages
                    </TabsTrigger>
                    <TabsTrigger value="review" className="gap-1.5 text-xs">
                        <ClipboardCheck className="h-3.5 w-3.5" />Review Queue
                        {(counts?.pendingReview ?? 0) > 0 && (
                            <Badge variant="error" size="xs" className="ml-1">
                                {counts!.pendingReview}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="cases" className="gap-1.5 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />Active Cases
                        {(counts?.activeCases ?? 0) > 0 && (
                            <Badge variant="warning" size="xs" className="ml-1">
                                {counts!.activeCases}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="mt-3">
                    <MattermostFullWidget />
                </TabsContent>

                <TabsContent value="review" className="mt-3">
                    <MattermostReviewQueue />
                </TabsContent>

                <TabsContent value="cases" className="mt-3">
                    <MattermostActiveCases />
                </TabsContent>
            </Tabs>
        </div>
    );
}
