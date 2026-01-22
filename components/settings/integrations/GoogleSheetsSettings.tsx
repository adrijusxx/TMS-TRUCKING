'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, TestTube2, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GoogleSheetsSettings() {
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testSheetId, setTestSheetId] = useState('');
    const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings/integrations/google-sheets');
            if (res.ok) {
                const data = await res.json();
                setServiceAccountEmail(data.serviceAccountEmail || null);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyEmail = async () => {
        if (serviceAccountEmail) {
            await navigator.clipboard.writeText(serviceAccountEmail);
            setCopied(true);
            toast.success('Email copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleTest = async () => {
        if (!testSheetId.trim()) {
            toast.error('Please enter a Google Sheet ID or URL');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const res = await fetch('/api/settings/integrations/google-sheets/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetId: testSheetId }),
            });

            const data = await res.json();

            setTestResult({
                success: data.success,
                message: data.success ? data.message : data.error,
            });

            if (data.success) {
                toast.success('Connection successful!');
            } else {
                toast.error(data.error || 'Connection failed');
            }
        } catch (error) {
            setTestResult({ success: false, message: 'Connection test failed' });
            toast.error('Connection test failed');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (!serviceAccountEmail) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <img src="https://www.gstatic.com/images/branding/product/1x/sheets_48dp.png" alt="Google Sheets" className="h-6 w-6" />
                        Google Sheets Integration
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>
                            Google Sheets integration is not available. Contact support to enable this feature.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <img src="https://www.gstatic.com/images/branding/product/1x/sheets_48dp.png" alt="Google Sheets" className="h-6 w-6" />
                        Google Sheets Integration
                    </CardTitle>
                    <CardDescription>
                        Import CRM leads and data from Google Sheets
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Service Account Email */}
                    <div className="space-y-2">
                        <Label>Service Account Email</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Share your Google Sheet with this email address to grant access
                        </p>
                        <div className="flex gap-2">
                            <Input
                                value={serviceAccountEmail}
                                readOnly
                                className="font-mono text-sm bg-muted"
                            />
                            <Button variant="outline" size="icon" onClick={handleCopyEmail}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Setup Instructions */}
                    <Alert>
                        <AlertDescription className="text-xs">
                            <strong>How to use:</strong>
                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                <li>Open your Google Sheet</li>
                                <li>Click "Share" button</li>
                                <li>Paste the service account email above</li>
                                <li>Give "Viewer" access and click "Share"</li>
                                <li>Copy the Sheet URL and use it in CRM Settings</li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Test Connection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Test Connection</CardTitle>
                    <CardDescription>
                        Verify that you've shared your sheet correctly
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Sheet ID or full URL"
                            value={testSheetId}
                            onChange={(e) => setTestSheetId(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleTest} disabled={testing} variant="outline">
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                        </Button>
                    </div>

                    {testResult && (
                        <Alert variant={testResult.success ? 'default' : 'destructive'}>
                            {testResult.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            <AlertDescription className="text-sm">{testResult.message}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
