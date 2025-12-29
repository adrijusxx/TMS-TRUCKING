'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Database, Server, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime?: number;
}

interface SystemMetrics {
  apiResponseTime?: number;
  databaseQueryTime?: number;
  errorRate?: number;
  requestCount?: number;
  activeConnections?: number;
}

interface DatabaseMetrics {
  queryCount?: number;
  slowQueries?: number;
  connectionPool?: {
    active: number;
    idle: number;
    total: number;
  };
}

async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(apiUrl('/api/health'));
  if (!response.ok) throw new Error('Failed to fetch health status');
  return response.json();
}

async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const response = await fetch(apiUrl('/api/admin/metrics'));
  if (!response.ok) throw new Error('Failed to fetch system metrics');
  return response.json();
}

async function fetchDatabaseMetrics(): Promise<DatabaseMetrics> {
  const response = await fetch(apiUrl('/api/admin/metrics/database'));
  if (!response.ok) throw new Error('Failed to fetch database metrics');
  return response.json();
}

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const { data: healthStatus, isLoading: healthLoading } = useQuery({
    queryKey: ['health-status'],
    queryFn: fetchHealthStatus,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: fetchSystemMetrics,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const { data: dbMetrics, isLoading: dbLoading } = useQuery({
    queryKey: ['database-metrics'],
    queryFn: fetchDatabaseMetrics,
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        );
      case 'down':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Down
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/dashboard/admin' },
        { label: 'Monitoring' }
      ]} />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">System Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Real-time system health and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="system">System Metrics</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="api">API Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Overall system status and uptime
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="text-center py-4">Loading health status...</div>
                ) : healthStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      {getStatusBadge(healthStatus.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Check</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(healthStatus.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    {healthStatus.uptime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Uptime</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(healthStatus.uptime / 3600)}h {Math.floor((healthStatus.uptime % 3600) / 60)}m
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Quick Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>API Response Time</CardDescription>
                  <CardTitle className="text-2xl">
                    {systemMetrics ? `${systemMetrics.apiResponseTime ?? 0}ms` : '--'}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Database Query Time</CardDescription>
                  <CardTitle className="text-2xl">
                    {systemMetrics ? `${systemMetrics.databaseQueryTime ?? 0}ms` : '--'}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Error Rate</CardDescription>
                  <CardTitle className="text-2xl">
                    {systemMetrics ? `${((systemMetrics.errorRate ?? 0) * 100).toFixed(2)}%` : '--'}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Connections</CardDescription>
                  <CardTitle className="text-2xl">
                    {systemMetrics ? (systemMetrics.activeConnections ?? 0) : '--'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="text-center py-4">Loading metrics...</div>
                ) : systemMetrics ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium mb-1">Request Count</div>
                        <div className="text-2xl font-bold">
                          {(systemMetrics.requestCount ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Error Rate</div>
                        <div className="text-2xl font-bold text-red-600">
                          {((systemMetrics.errorRate ?? 0) * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dbLoading ? (
                  <div className="text-center py-4">Loading database metrics...</div>
                ) : dbMetrics ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Total Queries</div>
                        <div className="text-2xl font-bold">{(dbMetrics.queryCount ?? 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Slow Queries</div>
                        <div className="text-2xl font-bold text-yellow-600">{dbMetrics.slowQueries ?? 0}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Connection Pool</div>
                        <div className="text-lg">
                          <span className="font-bold text-green-600">{dbMetrics.connectionPool?.active ?? 0}</span>
                          {' / '}
                          <span className="text-muted-foreground">{dbMetrics.connectionPool?.total ?? 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {dbMetrics.connectionPool?.idle ?? 0} idle
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  API Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="text-center py-4">Loading API metrics...</div>
                ) : systemMetrics ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Average Response Time</div>
                      <div className="text-3xl font-bold">{systemMetrics.apiResponseTime ?? 0}ms</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Target: &lt; 500ms
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

