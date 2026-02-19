'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Users, RefreshCw, CheckCircle, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface NSContact {
  id?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone_number?: string;
  phone_mobile?: string;
  phone_business?: string;
  email?: string;
}

export default function ContactsSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['netsapiens-contacts'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/netsapiens/contacts');
      if (!res.ok) throw new Error('Failed to load contacts');
      return res.json();
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/integrations/netsapiens/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Sync failed');

      setSyncResult({ synced: result.synced, errors: result.errors || [] });
      toast.success(`Synced ${result.synced} contacts to PBX`);
      queryClient.invalidateQueries({ queryKey: ['netsapiens-contacts'] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const contacts: NSContact[] = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              PBX Contacts
              <Badge variant="outline">{data?.count ?? 0}</Badge>
            </CardTitle>
            <CardDescription>Shared contacts on the PBX system</CardDescription>
          </div>
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync from TMS
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sync result */}
        {syncResult && (
          <div className={`p-3 rounded-lg mb-4 ${syncResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2">
              {syncResult.errors.length > 0 ? (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium">
                {syncResult.synced} contacts synced
                {syncResult.errors.length > 0 && `, ${syncResult.errors.length} errors`}
              </span>
            </div>
          </div>
        )}

        {/* Contact list */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-8">
            No contacts on the PBX. Click &quot;Sync from TMS&quot; to push your customers and drivers.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contacts.map((c, i) => (
              <div key={c.id || i} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                <div>
                  <span className="font-medium">
                    {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.company || 'Unknown'}
                  </span>
                  {c.company && c.first_name && (
                    <span className="text-xs text-muted-foreground ml-2">{c.company}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.phone_mobile || c.phone_business || c.phone_number || c.email || '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
