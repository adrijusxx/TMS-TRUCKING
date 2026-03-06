'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Bot, MessageSquare, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import MattermostConnectionCard from '@/components/mattermost/MattermostConnectionCard';
import MattermostGeneralSettings from '@/components/mattermost/MattermostGeneralSettings';
import MattermostAISettings from '@/components/mattermost/MattermostAISettings';
import MattermostTemplateSettings from '@/components/mattermost/MattermostTemplateSettings';
import MattermostChannelSettings from '@/components/mattermost/MattermostChannelSettings';

async function fetchSettings() {
    const res = await fetch(apiUrl('/api/mattermost/settings'));
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
}

async function fetchConnectionStatus() {
    const res = await fetch(apiUrl('/api/mattermost/connection'));
    if (!res.ok) throw new Error('Failed to fetch connection status');
    return res.json();
}

export default function MattermostIntegrationPage() {
    const queryClient = useQueryClient();

    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ['mattermost-settings'],
        queryFn: fetchSettings,
    });

    const { data: statusData, isLoading: statusLoading } = useQuery({
        queryKey: ['mattermost-status'],
        queryFn: fetchConnectionStatus,
        refetchInterval: 10000,
    });

    const settings = settingsData?.data;
    const status = statusData?.data;

    const updateMutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            const res = await fetch(apiUrl('/api/mattermost/settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update settings');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mattermost-settings'] });
            toast.success('Settings updated');
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const handleToggle = (field: string, value: boolean) => updateMutation.mutate({ [field]: value });
    const handleUpdate = (data: Record<string, any>) => updateMutation.mutate(data);
    const handleSaveTemplate = (field: string, value: string) => updateMutation.mutate({ [field]: value });

    if (settingsLoading || statusLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Mattermost Integration
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Connection, automation, and message settings
                </p>
            </div>

            <MattermostConnectionCard status={status} />

            {settings && (
                <Tabs defaultValue="general">
                    <TabsList>
                        <TabsTrigger value="general" className="gap-1.5 text-xs">
                            <Settings className="h-3.5 w-3.5" />General
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="gap-1.5 text-xs">
                            <Bot className="h-3.5 w-3.5" />AI
                        </TabsTrigger>
                        <TabsTrigger value="channels" className="gap-1.5 text-xs">
                            <Hash className="h-3.5 w-3.5" />Channels
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-1.5 text-xs">
                            <MessageSquare className="h-3.5 w-3.5" />Templates
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-3">
                        <MattermostGeneralSettings
                            settings={settings}
                            onToggle={handleToggle}
                            onUpdate={handleUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="ai" className="mt-3">
                        <MattermostAISettings
                            confidenceThreshold={settings.confidenceThreshold}
                            emergencyKeywords={settings.emergencyKeywords}
                            aiProvider={settings.aiProvider}
                            onUpdate={handleUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="channels" className="mt-3">
                        <MattermostChannelSettings
                            settings={settings}
                            onUpdate={handleUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="templates" className="mt-3">
                        <MattermostTemplateSettings
                            autoAckMessage={settings.autoAckMessage}
                            caseCreatedMessage={settings.caseCreatedMessage}
                            afterHoursMessage={settings.afterHoursMessage}
                            emergencyContactNumber={settings.emergencyContactNumber}
                            onSave={handleSaveTemplate}
                        />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
