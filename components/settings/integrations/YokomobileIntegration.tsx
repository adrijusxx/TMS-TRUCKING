'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface VoipConfig {
    pbxExtension?: string;
    answerDevice?: string;
    enabled?: boolean;
    sipPassword?: string;
    softphoneEnabled?: boolean;
    // Legacy fields (read-only, for migration)
    username?: string;
}

export default function YokomobileIntegration() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [settings, setSettings] = useState({
        pbxExtension: '',
        answerDevice: '',
        enabled: false,
        sipPassword: '',
        softphoneEnabled: false,
    });

    useEffect(() => {
        fetch('/api/user/voip-settings')
            .then(async res => {
                if (!res.ok) return {};
                const text = await res.text();
                return text ? JSON.parse(text) : {};
            })
            .then(data => {
                if (data.voipConfig) {
                    const config = data.voipConfig as VoipConfig;
                    setSettings({
                        // Support legacy username field as fallback
                        pbxExtension: config.pbxExtension || config.username || '',
                        answerDevice: config.answerDevice || '',
                        enabled: config.enabled || false,
                        sipPassword: config.sipPassword || '',
                        softphoneEnabled: config.softphoneEnabled || false,
                    });
                }
            })
            .catch(err => console.error('Failed to load VoIP settings', err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (test = false) => {
        if (!settings.pbxExtension || !settings.answerDevice) {
            toast.error('Please fill in PBX extension and answer device');
            return;
        }

        try {
            if (test) setTesting(true);
            else setSaving(true);

            const res = await fetch('/api/user/voip-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, test }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(
                test
                    ? 'Settings saved and extension verified on PBX!'
                    : 'Settings saved successfully'
            );
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
            setTesting(false);
        }
    };

    const configValid = settings.enabled && settings.pbxExtension && settings.answerDevice;

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Phone Integration Status</CardTitle>
                    <CardDescription>
                        Configure your PBX extension for click-to-call.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {configValid ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Phone integration is active (Ext: {settings.pbxExtension})</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Phone integration not configured.</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>PBX Extension Settings</CardTitle>
                    <CardDescription>
                        Your personal phone extension on the company PBX system
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>PBX Extension *</Label>
                        <Input
                            value={settings.pbxExtension}
                            onChange={(e) => setSettings({ ...settings, pbxExtension: e.target.value })}
                            placeholder="e.g. 101 or user@domain"
                        />
                        <p className="text-xs text-muted-foreground">
                            Your extension number or SIP username on the PBX.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Answer Device (Your Phone) *</Label>
                        <Input
                            value={settings.answerDevice}
                            onChange={(e) => setSettings({ ...settings, answerDevice: e.target.value })}
                            placeholder="e.g. 15551234567"
                        />
                        <p className="text-xs text-muted-foreground">
                            This phone will ring first when you click-to-call, then connects to the destination.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            id="yokoEnabled"
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="yokoEnabled" className="cursor-pointer">Enable Phone Integration</Label>
                    </div>

                    {/* Browser Softphone Section */}
                    <div className="pt-4 border-t mt-4 space-y-4">
                        <div>
                            <h4 className="text-sm font-medium">Browser Softphone</h4>
                            <p className="text-xs text-muted-foreground">
                                Make and receive calls directly in your browser without a desk phone.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>SIP Password</Label>
                            <Input
                                type="password"
                                value={settings.sipPassword}
                                onChange={(e) => setSettings({ ...settings, sipPassword: e.target.value })}
                                placeholder="Enter SIP password from PBX device config"
                            />
                            <p className="text-xs text-muted-foreground">
                                The SIP password for your PBX device. Ask your admin if unsure.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="softphoneEnabled"
                                type="checkbox"
                                checked={settings.softphoneEnabled}
                                onChange={(e) => setSettings({ ...settings, softphoneEnabled: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                                disabled={!settings.sipPassword}
                            />
                            <Label htmlFor="softphoneEnabled" className="cursor-pointer">
                                Enable Browser Softphone
                            </Label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                        <Button onClick={() => handleSave(false)} disabled={saving || testing}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Settings
                        </Button>
                        <Button variant="outline" onClick={() => handleSave(true)} disabled={saving || testing}>
                            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Save & Verify Extension
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <a href="https://portal.yoko.us" target="_blank" className="text-primary hover:underline">
                            Open Yoko Portal
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
