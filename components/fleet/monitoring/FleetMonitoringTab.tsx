'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw } from 'lucide-react';
import MonitoringStatsCards from './MonitoringStatsCards';
import IdleDriversTable from './IdleDriversTable';
import DormantEquipmentTable from './DormantEquipmentTable';
import MonitoringSettingsDialog from './MonitoringSettingsDialog';
import type { FleetMonitoringSnapshot } from '@/lib/managers/fleet-monitoring/types';
import { usePermissions } from '@/hooks/usePermissions';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function FleetMonitoringTab() {
  const { can } = usePermissions();
  const [data, setData] = useState<FleetMonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fleet/monitoring');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fleet Monitoring</h3>
          <p className="text-sm text-muted-foreground">
            Real-time view of idle drivers and dormant equipment.
            {data?.generatedAt && (
              <> Updated {new Date(data.generatedAt).toLocaleTimeString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {can('fleet.monitoring.settings') && (
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <MonitoringStatsCards data={data} loading={loading} />

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <IdleDriversTable drivers={data?.idleDrivers ?? []} loading={loading} />
        <DormantEquipmentTable
          trucks={data?.dormantTrucks ?? []}
          trailers={data?.dormantTrailers ?? []}
          loading={loading}
          onMarkOOS={fetchData}
        />
      </div>

      {/* Settings Dialog */}
      <MonitoringSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
