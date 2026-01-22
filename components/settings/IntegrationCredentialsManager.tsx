'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, Radio, MessageSquare, DollarSign, RefreshCw, Key, Shield, Camera, Activity, Route } from 'lucide-react';

interface McNumber {
    id: string;
    number: string;
    name?: string;
}

interface ConnectionStatus {
    connected: boolean;
    message: string;
    testedAt?: string;
    details?: Record<string, any>;
    isLoading?: boolean;
}

interface IntegrationCredentialsManagerProps {
    mcNumbers?: McNumber[];
}

const PROVIDERS = [
    { id: 'SAMSARA', name: 'Samsara', icon: Radio, scope: 'MC', description: 'GPS & Telematics' },
    { id: 'TELEGRAM', name: 'Telegram', icon: MessageSquare, scope: 'COMPANY', description: 'Communications' },
    { id: 'QUICKBOOKS', name: 'QuickBooks', icon: DollarSign, scope: 'COMPANY', description: 'Accounting' },
] as const;

export function IntegrationCredentialsManager({ mcNumbers = [] }: IntegrationCredentialsManagerProps) {
    const { toast } = useToast();
    const [activeProvider, setActiveProvider] = useState<string>('SAMSARA');
    const [selectedMcId, setSelectedMcId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [initialCheckDone, setInitialCheckDone] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({});

    // Form states for each provider
    const [samsaraToken, setSamsaraToken] = useState('');
    const [samsaraWebhookUrl, setSamsaraWebhookUrl] = useState('');
    const [samsaraStatsEnabled, setSamsaraStatsEnabled] = useState(true);
    const [samsaraCameraEnabled, setSamsaraCameraEnabled] = useState(false);
    const [samsaraCameraTypes, setSamsaraCameraTypes] = useState('forwardFacing,driverFacing');
    const [samsaraTripsEnabled, setSamsaraTripsEnabled] = useState(true);
    const [samsaraTripsLimit, setSamsaraTripsLimit] = useState(3);

    const [telegramApiId, setTelegramApiId] = useState('');
    const [telegramApiHash, setTelegramApiHash] = useState('');

    const testConnection = useCallback(async (provider: string, silent = false) => {
        const key = provider === 'SAMSARA' && selectedMcId ? `${provider}_${selectedMcId}` : provider;

        if (!silent) setIsTesting(true);
        setConnectionStatus(prev => ({
            ...prev,
            [key]: { ...prev[key], isLoading: true, connected: false, message: 'Testing...' },
        }));

        try {
            const response = await fetch('/api/settings/integrations/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    mcNumberId: provider === 'SAMSARA' ? selectedMcId : undefined,
                }),
            });
            const result = await response.json();

            setConnectionStatus(prev => ({
                ...prev,
                [key]: {
                    connected: result.connected ?? false,
                    message: result.message,
                    testedAt: new Date().toISOString(),
                    details: result.details,
                    isLoading: false,
                },
            }));

            if (!silent) {
                toast({
                    title: result.connected ? 'Connection successful' : 'Connection failed',
                    description: result.message,
                    variant: result.connected ? 'default' : 'destructive',
                });
            }
        } catch (error: any) {
            setConnectionStatus(prev => ({
                ...prev,
                [key]: { connected: false, message: error.message, isLoading: false },
            }));
            if (!silent) {
                toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
            }
        } finally {
            if (!silent) setIsTesting(false);
        }
    }, [selectedMcId, toast]);

    // Auto-test all providers on mount to show initial status
    useEffect(() => {
        if (!initialCheckDone) {
            const checkAll = async () => {
                // Test all providers silently
                await Promise.all([
                    testConnection('SAMSARA', true),
                    testConnection('TELEGRAM', true),
                    testConnection('QUICKBOOKS', true),
                ]);
                setInitialCheckDone(true);
            };
            checkAll();
        }
    }, [initialCheckDone, testConnection]);

    const saveCredentials = async (provider: string) => {
        setIsLoading(true);
        try {
            const credentials: Array<{ configKey: string; configValue: string }> = [];
            const scope = PROVIDERS.find(p => p.id === provider)?.scope || 'COMPANY';

            if (provider === 'SAMSARA' && samsaraToken && !/^[•]+$/.test(samsaraToken)) {
                credentials.push({ configKey: 'API_TOKEN', configValue: samsaraToken });
            }
            if (provider === 'TELEGRAM') {
                if (telegramApiId && !/^[•]+$/.test(telegramApiId)) {
                    credentials.push({ configKey: 'API_ID', configValue: telegramApiId });
                }
                if (telegramApiHash && !/^[•]+$/.test(telegramApiHash)) {
                    credentials.push({ configKey: 'API_HASH', configValue: telegramApiHash });
                }
            }

            for (const cred of credentials) {
                await fetch('/api/settings/integrations/credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider,
                        ...cred,
                        scope,
                        mcNumberId: scope === 'MC' ? selectedMcId : undefined,
                    }),
                });
            }

            toast({ title: 'Credentials saved', description: `${provider} credentials updated successfully.` });

            // Test connection after save
            await testConnection(provider);
        } catch (error: any) {
            toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusKey = (provider: string) => {
        return provider === 'SAMSARA' && selectedMcId ? `${provider}_${selectedMcId}` : provider;
    };

    const getStatusBadge = (provider: string) => {
        const status = connectionStatus[getStatusKey(provider)];
        if (!status) return <Badge variant="outline"><Key className="h-3 w-3 mr-1" />Checking...</Badge>;
        if (status.isLoading) return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Testing...</Badge>;
        return status.connected
            ? <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
            : <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not Configured</Badge>;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">API Credentials</h3>
                    <p className="text-sm text-muted-foreground">Manage integration API keys and test connections</p>
                </div>
                <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Encrypted Storage</Badge>
            </div>

            <Tabs value={activeProvider} onValueChange={setActiveProvider}>
                <TabsList className="grid w-full grid-cols-3">
                    {PROVIDERS.map(p => (
                        <TabsTrigger key={p.id} value={p.id} className="gap-2">
                            <p.icon className="h-4 w-4" />
                            {p.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Samsara - Per MC */}
                <TabsContent value="SAMSARA">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Samsara API Token</CardTitle>
                                    <CardDescription>Per Motor Carrier - Each MC can have its own Samsara account</CardDescription>
                                </div>
                                {getStatusBadge('SAMSARA')}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mcNumbers.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Motor Carrier</Label>
                                    <Select value={selectedMcId} onValueChange={setSelectedMcId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select MC..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Company Default</SelectItem>
                                            {mcNumbers.map(mc => (
                                                <SelectItem key={mc.id} value={mc.id}>
                                                    MC# {mc.number} {mc.name && `- ${mc.name}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>API Token</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter Samsara API Token"
                                    value={samsaraToken}
                                    onChange={(e) => setSamsaraToken(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Generate in Samsara Dashboard → Settings → API Tokens
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Webhook URL (Optional)</Label>
                                <Input
                                    placeholder="https://your-domain.com/api/webhooks/samsara"
                                    value={samsaraWebhookUrl}
                                    onChange={(e) => setSamsaraWebhookUrl(e.target.value)}
                                />
                            </div>

                            {/* Feature Toggles */}
                            <div className="pt-3 border-t">
                                <h4 className="text-sm font-medium mb-3">Feature Settings</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="stats" className="text-sm cursor-pointer">Vehicle Stats</Label>
                                        </div>
                                        <Switch id="stats" checked={samsaraStatsEnabled} onCheckedChange={setSamsaraStatsEnabled} />
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Route className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="trips" className="text-sm cursor-pointer">Trips Data</Label>
                                        </div>
                                        <Switch id="trips" checked={samsaraTripsEnabled} onCheckedChange={setSamsaraTripsEnabled} />
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Camera className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="camera" className="text-sm cursor-pointer">Camera Media</Label>
                                        </div>
                                        <Switch id="camera" checked={samsaraCameraEnabled} onCheckedChange={setSamsaraCameraEnabled} />
                                    </div>
                                    {samsaraTripsEnabled && (
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                            <Label htmlFor="tripsLimit" className="text-sm">Trips Limit</Label>
                                            <Input
                                                id="tripsLimit"
                                                type="number"
                                                min={1}
                                                max={100}
                                                className="w-16 h-7 text-center"
                                                value={samsaraTripsLimit}
                                                onChange={(e) => setSamsaraTripsLimit(parseInt(e.target.value) || 3)}
                                            />
                                        </div>
                                    )}
                                </div>
                                {samsaraCameraEnabled && (
                                    <div className="mt-2">
                                        <Label className="text-xs text-muted-foreground">Camera Types</Label>
                                        <Input
                                            placeholder="forwardFacing,driverFacing"
                                            value={samsaraCameraTypes}
                                            onChange={(e) => setSamsaraCameraTypes(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveCredentials('SAMSARA')} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                                <Button variant="outline" onClick={() => testConnection('SAMSARA')} disabled={isTesting}>
                                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Test Connection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Telegram - Per Company */}
                <TabsContent value="TELEGRAM">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Telegram API Credentials</CardTitle>
                                    <CardDescription>Company-wide - Shared across all Motor Carriers</CardDescription>
                                </div>
                                {getStatusBadge('TELEGRAM')}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>API ID</Label>
                                    <Input
                                        placeholder="API ID"
                                        value={telegramApiId}
                                        onChange={(e) => setTelegramApiId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Hash</Label>
                                    <Input
                                        type="password"
                                        placeholder="API Hash"
                                        value={telegramApiHash}
                                        onChange={(e) => setTelegramApiHash(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Get credentials from <a href="https://my.telegram.org" target="_blank" rel="noopener" className="underline">my.telegram.org</a>
                            </p>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveCredentials('TELEGRAM')} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                                <Button variant="outline" onClick={() => testConnection('TELEGRAM')} disabled={isTesting}>
                                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Test Connection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* QuickBooks - Per Company */}
                <TabsContent value="QUICKBOOKS">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">QuickBooks Connection</CardTitle>
                                    <CardDescription>Company-wide - Uses OAuth authentication</CardDescription>
                                </div>
                                {getStatusBadge('QUICKBOOKS')}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                QuickBooks uses OAuth for secure authentication. Click below to connect.
                            </p>
                            <div className="flex gap-2">
                                <Button asChild>
                                    <a href="/api/integrations/quickbooks/auth">
                                        Connect to QuickBooks
                                    </a>
                                </Button>
                                <Button variant="outline" onClick={() => testConnection('QUICKBOOKS')} disabled={isTesting}>
                                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Test Connection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
