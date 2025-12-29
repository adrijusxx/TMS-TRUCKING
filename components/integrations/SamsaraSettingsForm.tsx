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
                form.reset(freshData.data);
            }

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
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
                    <Button type="button" variant="outline">
                        Test Connection
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}
