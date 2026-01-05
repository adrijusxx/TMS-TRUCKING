'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { samsaraSettingsSchema, type SamsaraSettingsInput } from '@/lib/validations/integrations';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

export function SamsaraSettingsForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const form = useForm<SamsaraSettingsInput>({
        resolver: zodResolver(samsaraSettingsSchema) as any,
        defaultValues: {
            apiToken: '',
            autoSyncDrivers: false,
            autoSyncVehicles: false,
            syncIntervalMinutes: 60,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch('/api/settings/integrations/samsara');
                const data = await response.json();

                if (data.success && data.data) {
                    form.reset({
                        apiToken: data.data.apiToken || '',
                        autoSyncDrivers: data.data.autoSyncDrivers,
                        autoSyncVehicles: data.data.autoSyncVehicles,
                        syncIntervalMinutes: data.data.syncIntervalMinutes,
                    });
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load Samsara settings',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadSettings();
    }, [form, toast]);

    async function onSubmit(data: SamsaraSettingsInput) {
        setIsSaving(true);
        try {
            const response = await fetch('/api/settings/integrations/samsara', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!result.success) {
                console.error('Save failed:', result.error);
                throw new Error(result.error?.message || 'Failed to save settings');
            }

            toast({
                title: 'Settings saved',
                description: 'Samsara integration settings have been updated.',
            });

            // Reload to ensure we have the correct state (e.g. masked token)
            const freshStart = await fetch('/api/settings/integrations/samsara');
            const freshData = await freshStart.json();
            if (freshData.success) {
                form.reset({
                    apiToken: freshData.data.apiToken || '',
                    autoSyncDrivers: freshData.data.autoSyncDrivers,
                    autoSyncVehicles: freshData.data.autoSyncVehicles,
                    syncIntervalMinutes: freshData.data.syncIntervalMinutes,
                });
            }

        } catch (error: any) {
            console.error('Submit error:', error);
            toast({
                title: 'Error saving settings',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleTestConnection() {
        setIsTesting(true);
        try {
            // Use current form values
            const values = form.getValues();

            // If token is masked, we can't test unless it's already saved (handled by backend fallback)
            // But checking here helps UX
            const isMasked = values.apiToken && /^[•]+$/.test(values.apiToken);

            const response = await fetch('/api/settings/integrations/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'SAMSARA',
                    // Pass token if not masked, allowing test before save
                    apiToken: !isMasked ? values.apiToken : undefined,
                }),
            });

            const result = await response.json();

            if (!result.success || !result.connected) {
                throw new Error(result.message || 'Connection test failed');
            }

            toast({
                title: 'Connection Successful',
                description: `Successfully connected to Samsara. Found ${result.details?.vehiclesFound || 0} vehicles.`,
                variant: 'default',
            });
        } catch (error: any) {
            toast({
                title: 'Connection Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsTesting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>API Configuration</CardTitle>
                        <CardDescription>
                            Enter your Samsara API token to enable connection.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="apiToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>API Token</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter Samsara API Token" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Generate this in your Samsara Dashboard under Settings &gt; API Tokens.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Synchronization Settings</CardTitle>
                        <CardDescription>
                            Configure what data should be automatically synced from Samsara.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="autoSyncDrivers"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Sync Drivers</FormLabel>
                                        <FormDescription>
                                            Automatically import and update driver profiles from Samsara.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="autoSyncVehicles"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Sync Vehicles</FormLabel>
                                        <FormDescription>
                                            Import trucks and trailers, including odometer and engine hours.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="syncIntervalMinutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sync Interval (Minutes)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        How often to pull new data (minimum 15 minutes).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || isLoading}
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            'Test Connection'
                        )}
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>

                <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> Integrations may take 1-2 minutes to fully propagate. If the map doesn't update immediately, please wait a moment and reload the page.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}
