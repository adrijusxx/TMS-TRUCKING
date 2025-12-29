'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  List,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiagnosticsFilters, DiagnosticsFiltersState } from './DiagnosticsFilters';
import { DiagnosticCard } from './DiagnosticCard';
import { TroubleshootingModal } from './TroubleshootingModal';
import { DiagnosticsAnalytics } from './DiagnosticsAnalytics';

interface DiagnosticsDashboardProps {
  initialTab?: string;
}

export function DiagnosticsDashboard({ initialTab = 'active' }: DiagnosticsDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filters, setFilters] = useState<DiagnosticsFiltersState>({
    status: 'active',
    severity: '',
    category: '',
    truckId: '',
    search: '',
    dateFrom: undefined,
    dateTo: undefined,
  });
  
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [troubleshootCode, setTroubleshootCode] = useState<string | null>(null);

  // Fetch diagnostics
  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.category) params.set('category', filters.category);
      if (filters.truckId) params.set('truckId', filters.truckId);
      if (filters.search) params.set('search', filters.search);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());

      const response = await fetch(`/api/fleet/diagnostics?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setDiagnostics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/fleet/diagnostics/analytics');
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  // Fetch trucks for filter
  const fetchTrucks = useCallback(async () => {
    try {
      const response = await fetch('/api/trucks?limit=500');
      const result = await response.json();
      if (result.success) {
        setTrucks(result.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch trucks:', error);
    }
  }, []);

  // Sync from Samsara
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/fleet/diagnostics/sync', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        setLastSync(new Date(result.data.lastSyncTime));
        // Refresh data
        fetchDiagnostics();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Resolve fault
  const handleResolve = async (faultId: string) => {
    try {
      const response = await fetch('/api/fleet/diagnostics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', faultId }),
      });
      const result = await response.json();
      if (result.success) {
        fetchDiagnostics();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Failed to resolve fault:', error);
    }
  };

  // Reactivate fault
  const handleReactivate = async (faultId: string) => {
    try {
      const response = await fetch('/api/fleet/diagnostics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate', faultId }),
      });
      const result = await response.json();
      if (result.success) {
        fetchDiagnostics();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Failed to reactivate fault:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDiagnostics();
    fetchAnalytics();
    fetchTrucks();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchDiagnostics();
  }, [filters]);

  // Update filter status when tab changes
  useEffect(() => {
    if (activeTab === 'active') {
      setFilters(f => ({ ...f, status: 'active' }));
    } else if (activeTab === 'resolved') {
      setFilters(f => ({ ...f, status: 'resolved' }));
    }
  }, [activeTab]);

  const items = diagnostics?.items || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fleet Diagnostics</h1>
          <p className="text-muted-foreground text-sm">
            Monitor and analyze vehicle fault codes from Samsara
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDiagnostics();
              fetchAnalytics();
            }}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Sync from Samsara
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <DiagnosticsAnalytics analytics={analytics} loading={!analytics} compact />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Active
            {analytics?.summary?.totalActive > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {analytics.summary.totalActive}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Resolved
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="by-truck" className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            By Truck
          </TabsTrigger>
        </TabsList>

        {/* Active & Resolved Tabs */}
        <TabsContent value="active" className="space-y-4 mt-4">
          <DiagnosticsFilters
            filters={filters}
            onFiltersChange={setFilters}
            trucks={trucks}
          />
          <DiagnosticsList
            items={items}
            loading={loading}
            onTroubleshoot={setTroubleshootCode}
            onResolve={handleResolve}
            onReactivate={handleReactivate}
          />
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-4">
          <DiagnosticsFilters
            filters={filters}
            onFiltersChange={setFilters}
            trucks={trucks}
          />
          <DiagnosticsList
            items={items}
            loading={loading}
            onTroubleshoot={setTroubleshootCode}
            onResolve={handleResolve}
            onReactivate={handleReactivate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <DiagnosticsAnalytics analytics={analytics} loading={!analytics} />
        </TabsContent>

        <TabsContent value="by-truck" className="space-y-4 mt-4">
          <TruckDiagnosticsView
            trucks={trucks}
            onSelectTruck={(truckId) => {
              setFilters(f => ({ ...f, truckId, status: 'all' }));
              setActiveTab('active');
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Troubleshooting Modal */}
      <TroubleshootingModal
        code={troubleshootCode}
        open={!!troubleshootCode}
        onClose={() => setTroubleshootCode(null)}
      />
    </div>
  );
}

// Sub-component: Diagnostics List
function DiagnosticsList({
  items,
  loading,
  onTroubleshoot,
  onResolve,
  onReactivate,
}: {
  items: any[];
  loading: boolean;
  onTroubleshoot: (code: string) => void;
  onResolve: (id: string) => void;
  onReactivate: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <p className="text-lg font-medium">No Faults Found</p>
        <p className="text-muted-foreground">No diagnostic codes match your filters</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((fault) => (
        <DiagnosticCard
          key={fault.id}
          fault={fault}
          onTroubleshoot={onTroubleshoot}
          onResolve={onResolve}
          onReactivate={onReactivate}
        />
      ))}
    </div>
  );
}

// Sub-component: Truck Diagnostics View
function TruckDiagnosticsView({
  trucks,
  onSelectTruck,
}: {
  trucks: any[];
  onSelectTruck: (truckId: string) => void;
}) {
  const [truckFaultsData, setTruckFaultsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyWithFaults, setShowOnlyWithFaults] = useState(true);

  useEffect(() => {
    const fetchTruckFaults = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/fleet/diagnostics?status=active&pageSize=2000');
        const result = await response.json();
        if (result.success && result.data.items) {
          // Group faults by truck with truck info
          const truckMap = new Map<string, { truck: any; faults: any[]; criticalCount: number; warningCount: number }>();
          
          result.data.items.forEach((fault: any) => {
            if (fault.truck) {
              const existing = truckMap.get(fault.truck.id) || {
                truck: fault.truck,
                faults: [],
                criticalCount: 0,
                warningCount: 0,
              };
              existing.faults.push(fault);
              if (fault.severity === 'CRITICAL') existing.criticalCount++;
              if (fault.severity === 'WARNING') existing.warningCount++;
              truckMap.set(fault.truck.id, existing);
            }
          });
          
          // Convert to array and sort by critical count, then warning count
          const trucksArray = Array.from(truckMap.values()).sort((a, b) => {
            if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
            return b.warningCount - a.warningCount;
          });
          
          setTruckFaultsData(trucksArray);
        }
      } catch (error) {
        console.error('Failed to fetch truck faults:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTruckFaults();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const trucksToShow = showOnlyWithFaults 
    ? truckFaultsData 
    : [...truckFaultsData, ...trucks.filter(t => !truckFaultsData.some(tf => tf.truck.id === t.id)).map(t => ({ truck: t, faults: [], criticalCount: 0, warningCount: 0 }))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">
            {truckFaultsData.length} Trucks with Active Faults
          </h3>
          <Button
            variant={showOnlyWithFaults ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyWithFaults(!showOnlyWithFaults)}
          >
            {showOnlyWithFaults ? 'Show All Trucks' : 'Show Only With Faults'}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Click a truck to view its faults
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical: {truckFaultsData.reduce((sum, t) => sum + t.criticalCount, 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Warning: {truckFaultsData.reduce((sum, t) => sum + t.warningCount, 0)}</span>
        </div>
      </div>

      {/* Truck Grid */}
      {trucksToShow.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">All Trucks Healthy</p>
          <p className="text-muted-foreground">No active diagnostic faults detected</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {trucksToShow.map(({ truck, faults, criticalCount, warningCount }) => {
            const totalFaults = faults.length;
            const hasCritical = criticalCount > 0;
            
            return (
              <Card
                key={truck.id}
                className={cn(
                  'p-3 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]',
                  hasCritical && 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/30',
                  !hasCritical && totalFaults > 0 && 'border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/30',
                  totalFaults === 0 && 'border-green-200 dark:border-green-800'
                )}
                onClick={() => onSelectTruck(truck.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      'p-1.5 rounded-lg flex-shrink-0',
                      hasCritical ? 'bg-red-100 dark:bg-red-900' :
                      totalFaults > 0 ? 'bg-yellow-100 dark:bg-yellow-900' :
                      'bg-green-100 dark:bg-green-900'
                    )}>
                      <Truck className={cn(
                        'h-4 w-4',
                        hasCritical ? 'text-red-600' :
                        totalFaults > 0 ? 'text-yellow-600' :
                        'text-green-600'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{truck.truckNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {truck.year} {truck.make}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {totalFaults > 0 ? (
                      <>
                        {criticalCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-5">
                            {criticalCount} critical
                          </Badge>
                        )}
                        {warningCount > 0 && (
                          <Badge variant="outline" className="text-xs h-5 border-yellow-500 text-yellow-600">
                            {warningCount} warning
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        OK
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Top fault codes preview */}
                {faults.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap gap-1">
                      {faults.slice(0, 3).map((fault: any) => (
                        <span key={fault.id} className="text-[10px] font-mono bg-muted px-1 rounded">
                          {fault.faultCode}
                        </span>
                      ))}
                      {faults.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{faults.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

