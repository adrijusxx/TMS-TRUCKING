'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}

async function fetchAlerts(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);

  const response = await fetch(apiUrl(`/api/safety/alerts?${params}`));
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json() as Promise<{ alerts: Alert[] }>;
}

async function acknowledgeAlert(alertId: string) {
  const response = await fetch(apiUrl(`/api/safety/alerts/${alertId}/acknowledge`), {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
  return response.json();
}

export default function AlertCenter() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', filter],
    queryFn: () => fetchAlerts(filter === 'ALL' ? undefined : filter)
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading alerts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading alerts</p>
        </div>
      </div>
    );
  }

  const alerts = data?.alerts || [];
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  };

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.status === 'RESOLVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
        >
          All
        </Button>
        <Button
          variant={filter === 'ACTIVE' ? 'default' : 'outline'}
          onClick={() => setFilter('ACTIVE')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'RESOLVED' ? 'default' : 'outline'}
          onClick={() => setFilter('RESOLVED')}
        >
          Resolved
        </Button>
      </div>

      {/* Critical Alerts */}
      {filter !== 'RESOLVED' && criticalAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(alert.severity)}
                      <div className="font-medium">{alert.title}</div>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(alert.createdAt)}
                    </div>
                  </div>
                  {alert.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'ACTIVE' ? 'Active Alerts' : filter === 'RESOLVED' ? 'Resolved Alerts' : 'All Alerts'}
          </CardTitle>
          <CardDescription>
            {filter === 'ACTIVE'
              ? 'Alerts requiring attention'
              : filter === 'RESOLVED'
              ? 'Resolved alerts'
              : 'All safety and compliance alerts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {filter.toLowerCase()} alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between p-4 border rounded-lg ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
                      : alert.severity === 'HIGH'
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200'
                      : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(alert.severity)}
                      <div className="font-medium">{alert.title}</div>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.status === 'RESOLVED' && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(alert.createdAt)}
                      {alert.acknowledgedAt && (
                        <span className="ml-4">Acknowledged: {formatDate(alert.acknowledgedAt)}</span>
                      )}
                      {alert.resolvedAt && (
                        <span className="ml-4">Resolved: {formatDate(alert.resolvedAt)}</span>
                      )}
                    </div>
                  </div>
                  {alert.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

