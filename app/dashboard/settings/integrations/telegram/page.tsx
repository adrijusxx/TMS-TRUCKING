'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    Settings,
    Users,
    Zap,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    Clock,
    Bot,
    Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface TelegramSettings {
    id: string;
    companyId: string;
    autoCreateCases: boolean;
    aiAutoResponse: boolean;
    requireStaffApproval: boolean;
    confidenceThreshold: number;
    aiProvider: string;
    businessHoursOnly: boolean;
    businessHoursStart?: string;
    businessHoursEnd?: string;
    timezone: string;
    emergencyKeywords: string[];
    autoAckMessage?: string;
    caseCreatedMessage?: string;
    afterHoursMessage?: string;
    emergencyContactNumber?: string;
}

interface ConnectionStatus {
    isConnected: boolean;
    lastConnected: Date | null;
    error: string | null;
}

async function fetchSettings() {
    const response = await fetch(apiUrl('/api/telegram/settings'));
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
}

async function updateSettings(settings: Partial<TelegramSettings>) {
    const response = await fetch(apiUrl('/api/telegram/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
}

async function fetchConnectionStatus() {
    const response = await fetch(apiUrl('/api/telegram/session'));
    if (!response.ok) throw new Error('Failed to fetch connection status');
    return response.json();
}

export default function TelegramIntegrationPage() {
    const queryClient = useQueryClient();
    const [emergencyKeywordsInput, setEmergencyKeywordsInput] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);

    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ['telegram-settings'],
        queryFn: fetchSettings,
    });

    const { data: statusData, isLoading: statusLoading } = useQuery({
        queryKey: ['telegram-status'],
        queryFn: fetchConnectionStatus,
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    const settings: TelegramSettings | undefined = settingsData?.data;
    const status: ConnectionStatus | undefined = statusData?.data;

    useEffect(() => {
        if (settings?.emergencyKeywords) {
            setEmergencyKeywordsInput(settings.emergencyKeywords.join(', '));
        }
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['telegram-settings'] });
            toast.success('Settings updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update settings');
        },
    });

    const handleConnect = async () => {
        if (!phoneNumber) {
            toast.error('Please enter your phone number');
            return;
        }

        setIsConnecting(true);
        try {
            const response = await fetch(apiUrl('/api/telegram/session'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to connect');
            }

            if (data.data?.needsVerification) {
                setNeedsVerification(true);
                toast.success('Verification code sent to your Telegram app');
            } else {
                toast.success('Connected successfully!');
                queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
                setPhoneNumber('');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to connect');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode) {
            toast.error('Please enter the verification code');
            return;
        }

        setIsConnecting(true);
        try {
            const response = await fetch(apiUrl('/api/telegram/session/verify'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verificationCode, phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify');
            }

            toast.success('Connected successfully!');
            queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
            setNeedsVerification(false);
            setPhoneNumber('');
            setVerificationCode('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to verify code');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            const response = await fetch(apiUrl('/api/telegram/session'), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to disconnect');
            }

            toast.success('Disconnected successfully');
            queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
        } catch (error: any) {
            toast.error(error.message || 'Failed to disconnect');
        }
    };

    const handleToggle = (field: keyof TelegramSettings, value: boolean) => {
        if (!settings) return;
        updateMutation.mutate({ [field]: value });
    };

    const handleConfidenceChange = (value: number[]) => {
        if (!settings) return;
        updateMutation.mutate({ confidenceThreshold: value[0] / 100 });
    };

    const handleSaveKeywords = () => {
        if (!settings) return;
        const keywords = emergencyKeywordsInput
            .split(',')
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
        updateMutation.mutate({ emergencyKeywords: keywords });
    };

    const handleSaveTemplate = (field: keyof TelegramSettings, value: string) => {
        if (!settings) return;
        updateMutation.mutate({ [field]: value });
    };

    const handleBusinessHours = (start: string, end: string) => {
        if (!settings) return;
        updateMutation.mutate({
            businessHoursStart: start,
            businessHoursEnd: end,
        });
    };

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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Telegram Integration</h1>
                <p className="text-muted-foreground mt-2">
                    Configure AI-powered Telegram integration for driver communications
                </p>
            </div>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Connection Status
                            </CardTitle>
                            <CardDescription>Connect your Telegram account</CardDescription>
                        </div>
                        {status?.isConnected ? (
                            <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Disconnected
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status?.isConnected ? (
                        <>
                            {status?.lastConnected && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Last connected: {new Date(status.lastConnected).toLocaleString()}
                                </div>
                            )}
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    ✅ Your Telegram account is connected and ready to receive messages.
                                </p>
                            </div>
                            <Button onClick={handleDisconnect} variant="destructive">
                                Disconnect
                            </Button>
                        </>
                    ) : (
                        <>
                            {status?.error && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    Error: {status.error}
                                </div>
                            )}

                            {!needsVerification ? (
                                <div className="space-y-4">
                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <p className="text-sm font-medium">Connect Your Telegram Account</p>
                                        <p className="text-sm text-muted-foreground">
                                            Enter your phone number (with country code) to connect your Telegram account.
                                            You'll receive a verification code in your Telegram app.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+1234567890"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            disabled={isConnecting}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Include country code (e.g., +1 for US, +44 for UK)
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleConnect}
                                        disabled={isConnecting || !phoneNumber}
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            'Connect Telegram'
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            📱 Check your Telegram app for the verification code and enter it below.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">Verification Code</Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            placeholder="12345"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            disabled={isConnecting}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleVerify}
                                            disabled={isConnecting || !verificationCode}
                                        >
                                            {isConnecting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify Code'
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setNeedsVerification(false);
                                                setVerificationCode('');
                                            }}
                                            variant="outline"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Settings Tabs */}
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">
                        <Settings className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="ai">
                        <Bot className="h-4 w-4 mr-2" />
                        AI Configuration
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Templates
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Toggles</CardTitle>
                            <CardDescription>Enable or disable core features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Auto-Create Cases */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="auto-create">Auto-Create Cases</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically create Breakdown, Safety, and Maintenance cases when AI detects driver issues
                                    </p>
                                </div>
                                <Switch
                                    id="auto-create"
                                    checked={settings.autoCreateCases}
                                    onCheckedChange={(checked) => handleToggle('autoCreateCases', checked)}
                                />
                            </div>

                            <Separator />

                            {/* AI Auto-Response */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="auto-response">AI Auto-Response</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Let AI automatically respond to driver messages
                                    </p>
                                </div>
                                <Switch
                                    id="auto-response"
                                    checked={settings.aiAutoResponse}
                                    onCheckedChange={(checked) => handleToggle('aiAutoResponse', checked)}
                                />
                            </div>

                            <Separator />

                            {/* Require Staff Approval */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="staff-approval">Require Staff Approval</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Staff must approve AI responses before sending
                                    </p>
                                </div>
                                <Switch
                                    id="staff-approval"
                                    checked={settings.requireStaffApproval}
                                    onCheckedChange={(checked) => handleToggle('requireStaffApproval', checked)}
                                    disabled={!settings.aiAutoResponse}
                                />
                            </div>

                            <Separator />

                            {/* Business Hours Only */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="business-hours">Business Hours Only</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Only auto-respond during business hours
                                    </p>
                                </div>
                                <Switch
                                    id="business-hours"
                                    checked={settings.businessHoursOnly}
                                    onCheckedChange={(checked) => handleToggle('businessHoursOnly', checked)}
                                />
                            </div>

                            {settings.businessHoursOnly && (
                                <div className="grid grid-cols-2 gap-4 ml-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-time">Start Time</Label>
                                        <Input
                                            id="start-time"
                                            type="time"
                                            value={settings.businessHoursStart || '09:00'}
                                            onChange={(e) =>
                                                handleBusinessHours(e.target.value, settings.businessHoursEnd || '17:00')
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-time">End Time</Label>
                                        <Input
                                            id="end-time"
                                            type="time"
                                            value={settings.businessHoursEnd || '17:00'}
                                            onChange={(e) =>
                                                handleBusinessHours(settings.businessHoursStart || '09:00', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Configuration */}
                <TabsContent value="ai" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Settings</CardTitle>
                            <CardDescription>Configure AI behavior and thresholds</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Confidence Threshold */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Confidence Threshold</Label>
                                    <span className="text-sm font-medium">
                                        {Math.round(settings.confidenceThreshold * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.confidenceThreshold * 100]}
                                    onValueChange={handleConfidenceChange}
                                    min={50}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Minimum confidence required for AI to auto-create cases or respond
                                </p>
                            </div>

                            <Separator />

                            {/* Emergency Keywords */}
                            <div className="space-y-2">
                                <Label htmlFor="keywords">Emergency Keywords</Label>
                                <Input
                                    id="keywords"
                                    value={emergencyKeywordsInput}
                                    onChange={(e) => setEmergencyKeywordsInput(e.target.value)}
                                    placeholder="accident, injured, fire, police"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Comma-separated keywords that trigger immediate escalation
                                </p>
                                <Button onClick={handleSaveKeywords} size="sm">
                                    Save Keywords
                                </Button>
                            </div>

                            <Separator />

                            {/* AI Provider */}
                            <div className="space-y-2">
                                <Label>AI Provider</Label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{settings.aiProvider}</Badge>
                                    <span className="text-sm text-muted-foreground">
                                        (GPT-4 Turbo for analysis and responses)
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuration Presets */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Presets</CardTitle>
                            <CardDescription>Quick configuration templates</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() =>
                                    updateMutation.mutate({
                                        autoCreateCases: true,
                                        aiAutoResponse: false,
                                        requireStaffApproval: true,
                                        confidenceThreshold: 0.85,
                                    })
                                }
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                Conservative (Recommended for Start)
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() =>
                                    updateMutation.mutate({
                                        autoCreateCases: true,
                                        aiAutoResponse: true,
                                        requireStaffApproval: true,
                                        confidenceThreshold: 0.8,
                                    })
                                }
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Moderate Automation
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() =>
                                    updateMutation.mutate({
                                        autoCreateCases: true,
                                        aiAutoResponse: true,
                                        requireStaffApproval: false,
                                        confidenceThreshold: 0.9,
                                    })
                                }
                            >
                                <Bot className="h-4 w-4 mr-2" />
                                Full Automation (After Testing)
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Message Templates */}
                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Auto-Response Templates</CardTitle>
                            <CardDescription>Customize automated message templates</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Auto-Acknowledgment */}
                            <div className="space-y-2">
                                <Label htmlFor="auto-ack">Auto-Acknowledgment Message</Label>
                                <Textarea
                                    id="auto-ack"
                                    defaultValue={
                                        settings.autoAckMessage ||
                                        'We received your message. Our team will respond shortly.'
                                    }
                                    onBlur={(e) => handleSaveTemplate('autoAckMessage', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Sent when a message is received but no case is created
                                </p>
                            </div>

                            <Separator />

                            {/* Case Created */}
                            <div className="space-y-2">
                                <Label htmlFor="case-created">Case Created Message</Label>
                                <Textarea
                                    id="case-created"
                                    defaultValue={
                                        settings.caseCreatedMessage ||
                                        "Case #{caseNumber} created. We'll contact you soon."
                                    }
                                    onBlur={(e) => handleSaveTemplate('caseCreatedMessage', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Sent when a case is auto-created. Use {'{caseNumber}'} as placeholder
                                </p>
                            </div>

                            <Separator />

                            {/* After Hours */}
                            <div className="space-y-2">
                                <Label htmlFor="after-hours">After Hours Message</Label>
                                <Textarea
                                    id="after-hours"
                                    defaultValue={
                                        settings.afterHoursMessage ||
                                        'We received your message after hours. On-call staff will respond within 15 minutes.'
                                    }
                                    onBlur={(e) => handleSaveTemplate('afterHoursMessage', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Sent when messages are received outside business hours
                                </p>
                            </div>

                            <Separator />

                            {/* Emergency Contact */}
                            <div className="space-y-2">
                                <Label htmlFor="emergency-contact">Emergency Contact Number</Label>
                                <Input
                                    id="emergency-contact"
                                    defaultValue={settings.emergencyContactNumber || ''}
                                    onBlur={(e) => handleSaveTemplate('emergencyContactNumber', e.target.value)}
                                    placeholder="1-800-XXX-XXXX"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Included in emergency escalation messages
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security & Privacy</CardTitle>
                            <CardDescription>Security settings and data handling</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium">Session Encryption</h4>
                                <p className="text-sm text-muted-foreground">
                                    ✅ Telegram session is encrypted before storage using AES-256-CBC
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h4 className="font-medium">Data Privacy</h4>
                                <p className="text-sm text-muted-foreground">
                                    ✅ All messages encrypted in transit
                                    <br />
                                    ✅ Complete audit trail maintained
                                    <br />
                                    ✅ GDPR compliant data handling
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h4 className="font-medium">Access Control</h4>
                                <p className="text-sm text-muted-foreground">
                                    ✅ Only admins can modify integration settings
                                    <br />
                                    ✅ Role-based permissions enforced
                                    <br />
                                    ✅ Activity logging enabled
                                </p>
                            </div>

                            <Separator />

                            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <div className="flex gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-amber-900 dark:text-amber-100">
                                            Telegram TOS Notice
                                        </h4>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            Using Telegram Client API for automation may violate Telegram's Terms of
                                            Service. Use a dedicated business account and have a backup plan ready.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
