'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle2, XCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface ConnectionStatus {
    isConnected: boolean;
    lastConnected: Date | null;
    error: string | null;
}

export default function TelegramConnectionCard({ status }: { status?: ConnectionStatus }) {
    const queryClient = useQueryClient();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);

    const handleConnect = async () => {
        if (!phoneNumber) { toast.error('Please enter your phone number'); return; }
        setIsConnecting(true);
        try {
            const res = await fetch(apiUrl('/api/telegram/session'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to connect');
            if (data.data?.needsVerification) {
                setNeedsVerification(true);
                toast.success('Verification code sent to your Telegram app');
            } else {
                toast.success('Connected successfully!');
                queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
                setPhoneNumber('');
            }
        } catch (error: any) { toast.error(error.message); }
        finally { setIsConnecting(false); }
    };

    const handleVerify = async () => {
        if (!verificationCode) { toast.error('Please enter the verification code'); return; }
        setIsConnecting(true);
        try {
            const res = await fetch(apiUrl('/api/telegram/session/verify'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verificationCode, phoneNumber }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to verify');
            toast.success('Connected successfully!');
            queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
            setNeedsVerification(false); setPhoneNumber(''); setVerificationCode('');
        } catch (error: any) { toast.error(error.message); }
        finally { setIsConnecting(false); }
    };

    const handleDisconnect = async () => {
        try {
            const res = await fetch(apiUrl('/api/telegram/session'), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to disconnect');
            toast.success('Disconnected');
            queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
        } catch (error: any) { toast.error(error.message); }
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
                        <CardDescription className="text-xs">Connect your Telegram account</CardDescription>
                    </div>
                    {status?.isConnected ? (
                        <Badge className="bg-green-500 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
                    ) : (
                        <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Disconnected</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {status?.isConnected ? (
                    <>
                        {status.lastConnected && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Last connected: {new Date(status.lastConnected).toLocaleString()}
                            </div>
                        )}
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-xs text-green-800 dark:text-green-200">
                                Your Telegram account is connected and ready to receive messages.
                            </p>
                        </div>
                        <Button onClick={handleDisconnect} variant="destructive" size="sm">Disconnect</Button>
                    </>
                ) : (
                    <>
                        {status?.error && (
                            <div className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3" />{status.error}
                            </div>
                        )}
                        {!needsVerification ? (
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Phone Number</Label>
                                    <Input type="tel" placeholder="+1234567890" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} disabled={isConnecting} className="h-8 text-sm" />
                                    <p className="text-[10px] text-muted-foreground">Include country code (e.g., +1 for US)</p>
                                </div>
                                <Button onClick={handleConnect} disabled={isConnecting || !phoneNumber} size="sm">
                                    {isConnecting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Connecting...</> : 'Connect Telegram'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <p className="text-xs text-blue-800 dark:text-blue-200">Check your Telegram app for the verification code.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Verification Code</Label>
                                    <Input type="text" placeholder="12345" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} disabled={isConnecting} className="h-8 text-sm" />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleVerify} disabled={isConnecting || !verificationCode} size="sm">
                                        {isConnecting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Verifying...</> : 'Verify Code'}
                                    </Button>
                                    <Button onClick={() => { setNeedsVerification(false); setVerificationCode(''); }} variant="outline" size="sm">Cancel</Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
