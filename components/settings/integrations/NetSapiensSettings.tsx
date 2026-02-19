'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle, CheckCircle, Loader2, Save, Zap, Globe, Phone, Key, Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface WssProbeResult {
  url: string;
  status: 'ok' | 'failed';
  error?: string;
  latencyMs?: number;
}

interface NSConfigStatus {
  configured: boolean;
  hasApiKey: boolean;
  server: string | null;
  domain: string | null;
  wssUrl: string | null;
}

export default function NetSapiensSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<NSConfigStatus | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [server, setServer] = useState('yokopbx.com');
  const [wssUrl, setWssUrl] = useState('');
  const [probing, setProbing] = useState(false);
  const [probeResults, setProbeResults] = useState<WssProbeResult[] | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/settings/integrations/netsapiens');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
        if (data.data.server) setServer(data.data.server);
        if (data.data.wssUrl) setWssUrl(data.data.wssUrl);
      }
    } catch (err) {
      console.error('Failed to load NS settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey && !status?.hasApiKey) {
      toast.error('API Key is required');
      return;
    }
    if (!server) {
      toast.error('Server hostname is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/integrations/netsapiens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || 'unchanged',
          server,
          ...(wssUrl && { wssUrl }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to save');

      toast.success(data.message || 'Settings saved');
      setApiKey('');
      await fetchStatus();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProbeWss = async () => {
    if (!server) {
      toast.error('Enter a server hostname first');
      return;
    }
    setProbing(true);
    setProbeResults(null);
    try {
      const res = await fetch('/api/integrations/netsapiens/probe-wss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProbeResults(data.results);
      if (data.recommended) {
        setWssUrl(data.recommended);
        toast.success(`Found working WSS: ${data.recommended}`);
      } else {
        toast.error('No working WSS endpoint found. Check server config or ask your PBX admin.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProbing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {status?.configured && status?.domain ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Domain: <Badge variant="outline">{status.domain}</Badge>
                    {' '}Server: <Badge variant="outline">{status.server}</Badge>
                  </p>
                </div>
              </>
            ) : status?.hasApiKey ? (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-600">API Key Configured</p>
                  <p className="text-sm text-muted-foreground">
                    Domain auto-discovery pending. Save settings to retry.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-600">Not Configured</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your NetSapiens API key and server below.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Company-level API key for NetSapiens PBX. All users share this connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key *</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={status?.hasApiKey ? '(saved - enter new key to change)' : 'nsd_...'}
            />
            <p className="text-xs text-muted-foreground">
              The full 60-character API key from your NetSapiens admin panel (nsd_ prefix).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Server Hostname *</Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Input
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="yokopbx.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your PBX server hostname (without https://).
            </p>
          </div>

          <div className="space-y-2">
            <Label>WebSocket URL (WSS) — Softphone</Label>
            <div className="flex items-center gap-2">
              <Input
                value={wssUrl}
                onChange={(e) => setWssUrl(e.target.value)}
                placeholder={`wss://${server || 'yokopbx.com'}:8089/ws`}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleProbeWss}
                disabled={probing || !server}
                title="Auto-detect WSS endpoint"
              >
                {probing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {probing ? 'Probing...' : 'Auto-detect'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              WebSocket endpoint for browser softphone. Click &quot;Auto-detect&quot; to find it automatically.
            </p>
            {probeResults && (
              <div className="mt-2 rounded border p-2 space-y-1 text-xs">
                <p className="font-medium text-sm mb-1">Probe Results:</p>
                {probeResults.map((r) => (
                  <div key={r.url} className="flex items-center gap-2">
                    {r.status === 'ok' ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    )}
                    <code className="text-[11px]">{r.url}</code>
                    {r.status === 'ok' ? (
                      <span className="text-green-600 ml-auto">{r.latencyMs}ms</span>
                    ) : (
                      <span className="text-muted-foreground ml-auto truncate max-w-[140px]">{r.error}</span>
                    )}
                    {r.status === 'ok' && r.url !== wssUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        onClick={() => { setWssUrl(r.url); toast.info(`Set to ${r.url}`); }}
                      >
                        Use
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? 'Saving & Testing...' : 'Save & Connect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>
            Once connected, these features are available to all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Click-to-Call', desc: 'Call contacts directly from the TMS' },
              { label: 'Call History (CDR)', desc: 'View all call records with filters' },
              { label: 'SMS Messaging', desc: 'Send SMS to drivers and customers' },
              { label: 'Voicemail', desc: 'Listen to voicemail from the TMS' },
              { label: 'Call Recordings', desc: 'Access call recordings for review' },
              { label: 'Active Calls', desc: 'See live calls across the company' },
              { label: 'Browser Softphone', desc: 'Make & receive calls in your browser (WebRTC)' },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                <Zap className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
