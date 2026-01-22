'use client';

import { useState } from 'react';
import { McNumber, CrmIntegration } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CrmSettingsListProps {
    mcNumbers: (McNumber & { crmIntegrations: CrmIntegration[] })[];
}

export default function CrmSettingsList({ mcNumbers }: CrmSettingsListProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [syncing, setSyncing] = useState<string | null>(null);

    // Local state for form values to handle inputs before saving
    // Keyed by mcNumberId
    const [formData, setFormData] = useState<Record<string, { enabled: boolean; sheetId: string }>>(() => {
        const initial: Record<string, any> = {};
        mcNumbers.forEach(mc => {
            const integration = mc.crmIntegrations.find(i => i.type === 'GOOGLE_SHEETS');
            const config = integration?.config as any || {};
            initial[mc.id] = {
                enabled: integration?.enabled ?? false,
                sheetId: config.sheetId || '',
            };
        });
        return initial;
    });

    const handleSave = async (mcId: string) => {
        setLoading(mcId);
        try {
            const data = formData[mcId];

            // Call API to save settings
            // We verify if we need to create a dedicated API route for settings update
            // For now, let's assume we create one or reuse an upsert pattern
            const res = await fetch('/api/crm/integrations/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mcNumberId: mcId,
                    type: 'GOOGLE_SHEETS',
                    enabled: data.enabled,
                    config: {
                        sheetId: data.sheetId
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to save settings');

            toast.success('Settings saved successfully');
            router.refresh();
        } catch (error) {
            toast.error('Error saving settings');
            console.error(error);
        } finally {
            setLoading(null);
        }
    };

    const handleSync = async (integrationId: string | undefined, mcId: string) => {
        if (!integrationId) {
            toast.error('Please save settings first');
            return;
        }

        setSyncing(integrationId);
        try {
            const res = await fetch('/api/crm/integrations/google-sheets/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integrationId })
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Sync failed');

            toast.success(`Sync complete! Created: ${json.data.created}, Duplicates: ${json.data.duplicates}`);
            router.refresh(); // To update last sync time
        } catch (error: any) {
            toast.error(`Sync failed: ${error.message}`);
        } finally {
            setSyncing(null);
        }
    };

    return (
        <div className="grid gap-6">
            {mcNumbers.map((mc) => {
                const integration = mc.crmIntegrations.find(i => i.type === 'GOOGLE_SHEETS');
                const data = formData[mc.id] || { enabled: false, sheetId: '' };

                return (
                    <Card key={mc.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>MC-{mc.number} Integration</span>
                                {integration?.lastSyncAt && (
                                    <span className="text-xs font-normal text-muted-foreground">
                                        Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Configure Google Sheets integration for MC {mc.number}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`enable-${mc.id}`}
                                    checked={data.enabled}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({ ...prev, [mc.id]: { ...prev[mc.id], enabled: checked } }))
                                    }
                                />
                                <Label htmlFor={`enable-${mc.id}`}>Enable Google Sheets Import</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`sheet-${mc.id}`}>Google Sheet ID</Label>
                                <Input
                                    id={`sheet-${mc.id}`}
                                    placeholder="Enter Google Sheet ID"
                                    value={data.sheetId}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, [mc.id]: { ...prev[mc.id], sheetId: e.target.value } }))
                                    }
                                    disabled={!data.enabled}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The ID is the long string in your Google Sheet URL. Ensure the sheet is shared with the service account.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSync(integration?.id, mc.id)}
                                disabled={!integration || !!syncing}
                            >
                                {syncing === integration?.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Sync Now
                                    </>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => handleSave(mc.id)}
                                disabled={!!loading}
                            >
                                {loading === mc.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
