'use client';

import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, Truck, Wrench } from 'lucide-react';
import { DeviceQueueFiltersComponent, DeviceQueueFilters } from './DeviceQueueFilters';
import { DeviceQueueSections } from './DeviceQueueSections';
import FleetFaultSummary from './FleetFaultSummary';
import { Card } from '@/components/ui/card';
import { BulkMcAssignmentBanner } from './BulkMcAssignmentBanner';
import { MissingTrucksRepairBanner } from './MissingTrucksRepairBanner';

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function UnifiedDeviceQueue() {
  const [activeStatus, setActiveStatus] = useState('PENDING');
  const [filters, setFilters] = useState<DeviceQueueFilters>({ status: 'PENDING' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentMcNumberId, setCurrentMcNumberId] = useState<string | null>(null);

  // Get current MC from cookie on mount
  useEffect(() => {
    const fetchCurrentMc = async () => {
      // First try to get from cookie
      const selectedMcIdsCookie = getCookie('selectedMcNumberIds');
      if (selectedMcIdsCookie) {
        try {
          const parsedIds = JSON.parse(selectedMcIdsCookie);
          if (Array.isArray(parsedIds) && parsedIds.length > 0) {
            setCurrentMcNumberId(parsedIds[0]); // Use first selected MC
            return;
          }
        } catch { /* ignore */ }
      }
      
      // Fallback: fetch from API to get default/first MC
      try {
        const response = await fetch('/api/mc-numbers');
        const result = await response.json();
        if (result.success && result.data?.length > 0) {
          setCurrentMcNumberId(result.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch MC numbers:', error);
      }
    };
    
    fetchCurrentMc();
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [filters]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/fleet/device-queue?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setFilters({ ...filters, status });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/fleet/samsara-sync', {
        method: 'POST',
      });
      if (response.ok) {
        setTimeout(() => {
          fetchDevices();
          setSyncing(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncing(false);
    }
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet', href: '/dashboard/fleet' },
          { label: 'Samsara Devices' },
        ]}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Samsara Device Queue</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve new devices from Samsara before adding to TMS
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDevices}
              disabled={loading || syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading || syncing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleSyncNow} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Samsara'}
            </Button>
          </div>
        </div>

        {/* Missing Trucks Repair Banner - Shows if linked devices > trucks */}
        <MissingTrucksRepairBanner 
          currentMcNumberId={currentMcNumberId} 
          onRepairComplete={fetchDevices}
        />

        {/* Bulk MC Assignment Banner - Shows if trucks missing MC */}
        <BulkMcAssignmentBanner currentMcNumberId={currentMcNumberId} />

        {/* Status Tabs */}
            <Tabs value={activeStatus} onValueChange={handleStatusChange}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="PENDING" className="relative">
                  Pending Review
                  {data?.counts?.pending > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data.counts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="APPROVED">
                  Approved
                  {data?.counts?.approved > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {data.counts.approved}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="LINKED">
                  Linked
                  {data?.counts?.linked > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {data.counts.linked}
                      {data?.counts?.linkedTrucks !== undefined && (
                        <span className="ml-1 text-xs opacity-70">
                          ({data.counts.linkedTrucks}T/{data.counts.linkedTrailers || 0}R)
                        </span>
                      )}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="REJECTED">
                  Rejected
                  {data?.counts?.rejected > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {data.counts.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeStatus} className="space-y-4 mt-6">
                {/* Filters */}
                <DeviceQueueFiltersComponent
                  filters={filters}
                  onChange={setFilters}
                  filterOptions={data?.filterOptions}
                />

                {/* Info Banner for PENDING */}
                {activeStatus === 'PENDING' && data?.items?.length > 0 && (
                  <div className="space-y-3">
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                              Smart Sections with Bulk Actions
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {data.items.length} device{data.items.length !== 1 ? 's' : ''} automatically organized by match confidence.
                              Use checkboxes to select multiple devices. Each section has its own "Select All" checkbox.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                              ⚠️ Approve vs. Link
                            </h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              <strong>Approve</strong> creates a NEW truck/trailer record. <strong>Link</strong> connects to an EXISTING record.
                              If you get "unique constraint" errors, the device already exists - use <strong>Link</strong> instead!
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Device Sections (Smart Grouping) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <DeviceQueueSections
                      items={data?.items || []}
                      loading={loading}
                      onActionComplete={fetchDevices}
                      currentMcNumberId={currentMcNumberId}
                      currentStatus={activeStatus}
                    />
                  </div>
                  <div>
                    <FleetFaultSummary />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
      </div>
    </>
  );
}

