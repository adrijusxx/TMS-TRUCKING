'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, ExternalLink, Phone, MessageSquare, Loader2, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function YokomobileIntegration() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [settings, setSettings] = useState({
        username: '',
        password: '',
        answerDevice: '',
        enabled: false,
    });

    useEffect(() => {
        fetch('/api/user/voip-settings')
            .then(async res => {
                if (!res.ok) {
                    // Try to parse error if json, otherwise ignore
                    return {};
                }
                const text = await res.text();
                return text ? JSON.parse(text) : {};
            })
            .then(data => {
                if (data.voipConfig) {
                    setSettings(prev => ({ ...prev, ...data.voipConfig }));
                }
            })
            .catch(err => console.error('Failed to load VoIP settings', err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (test = false) => {
        if (!settings.username || !settings.password || !settings.answerDevice) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (test) setTesting(true);
            else setSaving(true);

            const res = await fetch('/api/user/voip-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, test })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(test ? 'Settings saved and connection verified!' : 'Settings saved successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
            setTesting(false);
        }
    };

    const configValid = settings.enabled && settings.username && settings.password && settings.answerDevice;

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuration Status</CardTitle>
                    <CardDescription>
                        Connect your personal Yokomobile SIP credentials.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {configValid ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Yokomobile is configured correctly</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                                Yokomobile credentials not configured.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Yokomobile Credentials</CardTitle>
                    <CardDescription>
                        Configure your yokopbx.com login credentials
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>SIP Username *</Label>
                        <Input
                            value={settings.username}
                            onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                            placeholder="SIP Username"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>SIP Password *</Label>
                        <Input
                            type="password"
                            value={settings.password}
                            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                            placeholder="SIP Password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Answer Device (Your Phone) *</Label>
                        <Input
                            value={settings.answerDevice}
                            onChange={(e) => setSettings({ ...settings, answerDevice: e.target.value })}
                            placeholder="e.g. 15551234567"
                        />
                        <p className="text-xs text-muted-foreground">This phone will ring first before connecting the call.</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            id="yokoEnabled"
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="yokoEnabled" className="cursor-pointer">Enable Yokomobile Integration</Label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                        <Button onClick={() => handleSave(false)} disabled={saving || testing}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Settings
                        </Button>
                        <Button variant="outline" onClick={() => handleSave(true)} disabled={saving || testing}>
                            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Test Connection
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <a href="https://portal.yoko.us" target="_blank" className="text-primary hover:underline">Open Yoko Portal</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
