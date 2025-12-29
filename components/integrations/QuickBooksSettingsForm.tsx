'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quickBooksSettingsSchema, type QuickBooksSettingsInput } from '@/lib/validations/integrations';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export function QuickBooksSettingsForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const form = useForm<QuickBooksSettingsInput>({
        resolver: zodResolver(quickBooksSettingsSchema) as any,
        defaultValues: {
            realmId: '',
            qboEnvironment: 'SANDBOX',
            autoSyncInvoices: false,
            autoSyncCustomers: false,
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch('/api/settings/integrations/quickbooks');
                const data = await response.json();

                if (data.success && data.data) {
                    form.reset({
                        realmId: data.data.realmId || '',
                        qboEnvironment: data.data.qboEnvironment || 'SANDBOX',
                        autoSyncInvoices: data.data.autoSyncInvoices,
                        autoSyncCustomers: data.data.autoSyncCustomers,
                    });
                    setIsConnected(data.data.isConnected);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load QuickBooks settings',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadSettings();
    }, [form, toast]);

    async function onSubmit(data: QuickBooksSettingsInput) {
        setIsSaving(true);
        try {
            const response = await fetch('/api/settings/integrations/quickbooks', {
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
                description: 'QuickBooks integration settings have been updated.',
            });

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
        <div className="space-y-6">
            {/* Connection Status Card */}
            <Card className={isConnected ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    {isConnected ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                    )}
                    <div className="flex-1">
                        <CardTitle className="text-base">
                            {isConnected ? 'Connected to QuickBooks' : 'Not Connected'}
                        </CardTitle>
                        <CardDescription>
                            {isConnected
                                ? 'Your TMS is successfully linked to QuickBooks Online.'
                                : 'Please configure settings and authorize the connection.'}
                        </CardDescription>
                    </div>
                    {!isConnected && (
                        <Button variant="outline" className="ml-auto">
                            Connect Now
                        </Button>
                    )}
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Environment Configuration</CardTitle>
                            <CardDescription>
                                Set up your QuickBooks Online environment details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="qboEnvironment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Environment</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select environment" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SANDBOX">Sandbox (Test)</SelectItem>
                                                <SelectItem value="PRODUCTION">Production (Live)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Use Sandbox for testing before connecting to your live company file.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="realmId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company ID (Realm ID)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your QBO Company ID" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Found in your QuickBooks Company Settings.
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
                                Configure global sync preferences.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="autoSyncCustomers"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Sync Customers</FormLabel>
                                            <FormDescription>
                                                Automatically sync Brokers/Shippers as Customers in QBO.
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
                                name="autoSyncInvoices"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Sync Invoices</FormLabel>
                                            <FormDescription>
                                                Automatically push finalized Invoices to QBO.
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
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Configuration
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
