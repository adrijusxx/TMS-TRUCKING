'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wifi, Activity } from 'lucide-react';
import { DeviceQueueTable } from './DeviceQueueSections';
import { MissingTrucksRepairBanner } from './MissingTrucksRepairBanner';
import { BulkMcAssignmentBanner } from './BulkMcAssignmentBanner';
import { toast } from 'sonner';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

const TABS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'LINKED', label: 'Linked' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

export function UnifiedDeviceQueue() {
  const [activeStatus, setActiveStatus] = useState('PENDING');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentMcNumberId, setCurrentMcNumberId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const cookie = getCookie('selectedMcNumberIds');
      if (cookie) {
        try {
          const ids = JSON.parse(cookie);
          if (Array.isArray(ids) && ids.length > 0) { setCurrentMcNumberId(ids[0]); return; }
        } catch { /* ignore */ }
      }
      try {
        const res = await fetch('/api/mc-numbers');
        const result = await res.json();
        if (result.success && result.data?.length > 0) setCurrentMcNumberId(result.data[0].id);
      } catch { /* ignore */ }
    };
    init();
  }, []);

  const fetchDevices = async (status = activeStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fleet/device-queue?status=${status}&pageSize=500`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchDevices(activeStatus); }, [activeStatus]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/fleet/samsara-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      });
      const result = await res.json();
      const devices = result?.data?.results?.devices;
      if (devices) {
        const parts: string[] = [];
        if (devices.updated > 0) parts.push(`${devices.updated} already linked (updated)`);
        if (devices.matched > 0) parts.push(`${devices.matched} auto-matched`);
        if (devices.queued > 0) parts.push(`${devices.queued} queued for review`);
        if (devices.errors?.length > 0) parts.push(`${devices.errors.length} errors`);
        if (devices.orphansReset > 0) parts.push(`${devices.orphansReset} orphans reset`);
        toast.success('Sync complete', {
          description: parts.length > 0 ? parts.join(' · ') : 'No changes',
          duration: 8000,
        });
      } else {
        toast.success('Sync complete');
      }
      await fetchDevices(activeStatus);
    } catch {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const counts = data?.counts || {};
  const alreadySynced = data?.alreadySynced;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Samsara Device Queue</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve devices synced from Samsara
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDevices(activeStatus)}
            disabled={loading || syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSyncNow} disabled={syncing}>
            <Wifi className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Samsara'}
          </Button>
        </div>
      </div>

      {/* Diagnostic banners */}
      <MissingTrucksRepairBanner
        currentMcNumberId={currentMcNumberId}
        onRepairComplete={() => fetchDevices(activeStatus)}
      />
      <BulkMcAssignmentBanner currentMcNumberId={currentMcNumberId} />

      {/* Already synced summary */}
      {alreadySynced && (alreadySynced.trucks > 0 || alreadySynced.trailers > 0) && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-md border bg-muted/30 text-sm">
          <Activity className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-muted-foreground">
            <strong className="text-foreground">{alreadySynced.trucks}</strong> trucks synced
            {alreadySynced.trailers > 0 && (
              <> · <strong className="text-foreground">{alreadySynced.trailers}</strong> trailers synced</>
            )}
            {counts.pending > 0 && (
              <> · <strong className="text-foreground">{counts.pending}</strong> pending review</>
            )}
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {counts[tab.value.toLowerCase()] > 0 && (
                <Badge
                  variant={tab.value === 'PENDING' ? 'destructive' : 'secondary'}
                  className="ml-2 text-xs"
                >
                  {counts[tab.value.toLowerCase()]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeStatus} className="mt-4">
          <DeviceQueueTable
            items={data?.items || []}
            loading={loading}
            currentStatus={activeStatus}
            currentMcNumberId={currentMcNumberId}
            onActionComplete={() => fetchDevices(activeStatus)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
