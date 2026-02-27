'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wifi } from 'lucide-react';
import { DeviceQueueTable } from './DeviceQueueSections';
import { MissingTrucksRepairBanner } from './MissingTrucksRepairBanner';
import { BulkMcAssignmentBanner } from './BulkMcAssignmentBanner';

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
      await fetch('/api/fleet/samsara-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      });
      setTimeout(() => { fetchDevices(activeStatus); setSyncing(false); }, 2000);
    } catch { setSyncing(false); }
  };

  const counts = data?.counts || {};

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
