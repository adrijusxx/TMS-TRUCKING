'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Settings, Bot, MessageSquare, Shield, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { useMcFilter } from '@/lib/contexts/McFilterContext';
import TelegramConnectionCard from '@/components/telegram/TelegramConnectionCard';
import TelegramGeneralSettings from '@/components/telegram/TelegramGeneralSettings';
import TelegramAISettings from '@/components/telegram/TelegramAISettings';
import TelegramTemplateSettings from '@/components/telegram/TelegramTemplateSettings';
import TelegramScopeSelector from '@/components/telegram/TelegramScopeSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TelegramIntegrationPage() {
    const queryClient = useQueryClient();
    const { selectedMc } = useMcFilter();

    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ['telegram-settings', selectedMc?.id],
        queryFn: async () => {
            const url = selectedMc?.id
                ? apiUrl(`/api/telegram/settings?mcNumberId=${selectedMc.id}`)
                : apiUrl('/api/telegram/settings');
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch settings');
            return res.json();
        },
    });

    const { data: statusData, isLoading: statusLoading } = useQuery({
        queryKey: ['telegram-status'],
        queryFn: async () => {
            const res = await fetch(apiUrl('/api/telegram/session'));
            if (!res.ok) throw new Error('Failed to fetch connection status');
            return res.json();
        },
        refetchInterval: 10000,
    });

    const settings = settingsData?.data;
    const status = statusData?.data;
    const scopeMode = settings?.scopeMode || settings?.telegramScope || 'COMPANY';

    const updateMutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            const res = await fetch(apiUrl('/api/telegram/settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update settings');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['telegram-settings'] });
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

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Failed to load settings</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Telegram Integration
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">Connection, automation, and message settings</p>
            </div>

            <TelegramScopeSelector
                telegramScope={scopeMode}
                isConnected={!!status?.isConnected}
                onScopeChange={(scope) => updateMutation.mutate({ telegramScope: scope })}
            />

            {scopeMode === 'MC' && selectedMc && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        Viewing settings for <strong>{selectedMc.number || selectedMc.companyName}</strong>. Switch MC numbers using the top navigation to manage other connections.
                    </AlertDescription>
                </Alert>
            )}

            <TelegramConnectionCard status={status} />

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general" className="gap-1.5 text-xs">
                        <Settings className="h-3.5 w-3.5" />General
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-1.5 text-xs">
                        <Bot className="h-3.5 w-3.5" />AI
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-1.5 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" />Templates
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-1.5 text-xs">
                        <Shield className="h-3.5 w-3.5" />Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-3">
                    <TelegramGeneralSettings settings={settings} onToggle={handleToggle} onUpdate={handleUpdate} />
                </TabsContent>

                <TabsContent value="ai" className="mt-3">
                    <TelegramAISettings
                        confidenceThreshold={settings.confidenceThreshold}
                        emergencyKeywords={settings.emergencyKeywords}
                        aiProvider={settings.aiProvider}
                        onUpdate={handleUpdate}
                    />
                </TabsContent>

                <TabsContent value="templates" className="mt-3">
                    <TelegramTemplateSettings
                        autoAckMessage={settings.autoAckMessage}
                        caseCreatedMessage={settings.caseCreatedMessage}
                        afterHoursMessage={settings.afterHoursMessage}
                        emergencyContactNumber={settings.emergencyContactNumber}
                        onSave={handleSaveTemplate}
                    />
                </TabsContent>

                <TabsContent value="security" className="mt-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Security & Privacy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs text-muted-foreground">
                            <p>Session encrypted with AES-256-CBC. All messages encrypted in transit. Complete audit trail maintained. Role-based access control enforced.</p>
                            <Separator />
                            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-200">
                                        Using Telegram Client API for automation may violate Telegram's Terms of Service. Use a dedicated business account.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
