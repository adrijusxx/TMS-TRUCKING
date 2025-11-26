'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Users, Truck, Calendar, FileWarning, TrendingUp, Bell } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { getMcContext } from '@/lib/utils/query-keys';
import ActiveDriversTile from './ActiveDriversTile';
import ActiveVehiclesTile from './ActiveVehiclesTile';
import DaysSinceAccidentTile from './DaysSinceAccidentTile';
import OpenViolationsTile from './OpenViolationsTile';
import ExpiringDocumentsTile from './ExpiringDocumentsTile';
import CSAScoresTile from './CSAScoresTile';

interface SafetyDashboardData {
  metrics: {
    activeDrivers: number;
    activeVehicles: number;
    daysSinceAccident: number | null;
    openViolations: number;
    expiringDocuments: number;
    csaScores: Record<string, {
      percentile: number;
      trend: string;
      score?: number;
    }>;
  };
  alerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
}

async function fetchSafetyDashboard() {
  const response = await fetch(apiUrl('/api/safety/dashboard'));
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch safety dashboard: ${response.status}`);
  }
  return response.json() as Promise<SafetyDashboardData>;
}

export default function SafetyDashboard() {
  // Include MC context in query key so it refetches when MC selection changes
  const mcContext = getMcContext();
  const { data, isLoading, error } = useQuery({
    queryKey: ['safety-dashboard', mcContext],
    queryFn: fetchSafetyDashboard,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading safety dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Please try refreshing the page'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    activeDrivers: 0,
    activeVehicles: 0,
    daysSinceAccident: null,
    openViolations: 0,
    expiringDocuments: 0,
    csaScores: {}
  };

  const alerts = data?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-destructive" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      : alert.severity === 'HIGH'
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                  }`}
                >
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.message}</div>
                </div>
              ))}
              {alerts.length > 5 && (
                <div className="text-sm text-muted-foreground text-center pt-2">
                  +{alerts.length - 5} more alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ActiveDriversTile count={metrics.activeDrivers} />
        <ActiveVehiclesTile count={metrics.activeVehicles} />
        <DaysSinceAccidentTile days={metrics.daysSinceAccident} />
        <OpenViolationsTile count={metrics.openViolations} />
        <ExpiringDocumentsTile count={metrics.expiringDocuments} />
        <CSAScoresTile scores={metrics.csaScores} />
      </div>
    </div>
  );
}

