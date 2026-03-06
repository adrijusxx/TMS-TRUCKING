'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle2, XCircle, Loader2, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface ConnectionStatus {
    isConnected: boolean;
    botUsername?: string;
    serverUrl?: string;
    lastConnected?: Date | null;
    error?: string | null;
}

export default function MattermostConnectionCard({ status }: { status?: ConnectionStatus }) {
    const queryClient = useQueryClient();
    const [serverUrl, setServerUrl] = useState('');
    const [botToken, setBotToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        if (!serverUrl) { toast.error('Please enter the Mattermost server URL'); return; }
        if (!botToken) { toast.error('Please enter the bot token'); return; }
        setIsConnecting(true);
        try {
            const res = await fetch(apiUrl('/api/mattermost/connection'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverUrl, botToken }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to connect');
            toast.success('Connected to Mattermost successfully');
            queryClient.invalidateQueries({ queryKey: ['mattermost-status'] });
            setServerUrl('');
            setBotToken('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            const res = await fetch(apiUrl('/api/mattermost/connection'), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to disconnect');
            toast.success('Disconnected from Mattermost');
            queryClient.invalidateQueries({ queryKey: ['mattermost-status'] });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="h-4 w-4" />
                            Connection
                        </CardTitle>
                        <CardDescription className="text-xs">Connect your Mattermost server</CardDescription>
                    </div>
                    {status?.isConnected ? (
                        <Badge className="bg-green-500 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Connected
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />Disconnected
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {status?.isConnected ? (
                    <>
                        {status.botUsername && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                Bot: @{status.botUsername}
                            </div>
                        )}
                        {status.serverUrl && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                Server: {status.serverUrl}
                            </div>
                        )}
                        {status.lastConnected && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Connected since: {new Date(status.lastConnected).toLocaleString()}
                            </div>
                        )}
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-xs text-green-800 dark:text-green-200">
                                Your Mattermost bot is connected and ready to receive messages.
                            </p>
                        </div>
                        <Button onClick={handleDisconnect} variant="destructive" size="sm">Disconnect</Button>
                    </>
                ) : (
                    <>
                        {status?.error && (
                            <div className="flex items-center gap-1.5 text-xs text-destructive">
                                <XCircle className="h-3 w-3" />{status.error}
                            </div>
                        )}
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Server URL</Label>
                                <Input
                                    type="url"
                                    placeholder="https://mattermost.example.com"
                                    value={serverUrl}
                                    onChange={e => setServerUrl(e.target.value)}
                                    disabled={isConnecting}
                                    className="h-8 text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">Your Mattermost instance URL</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Bot Token</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter bot access token"
                                    value={botToken}
                                    onChange={e => setBotToken(e.target.value)}
                                    disabled={isConnecting}
                                    className="h-8 text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Generate from Mattermost &gt; Integrations &gt; Bot Accounts
                                </p>
                            </div>
                            <Button onClick={handleConnect} disabled={isConnecting || !serverUrl || !botToken} size="sm">
                                {isConnecting ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Connecting...</>
                                ) : 'Connect to Mattermost'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
