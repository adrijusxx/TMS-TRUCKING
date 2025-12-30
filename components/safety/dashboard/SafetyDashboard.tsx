'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Users, Truck, Calendar, FileWarning, TrendingUp, Bell, Shield, FileCheck, GraduationCap, Wrench, AlertCircle, FileText, UserCheck, Activity, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
                  className={`p-3 rounded-lg border ${alert.severity === 'CRITICAL'
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

      {/* Management Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Safety Management</h2>
        </div>

        <Tabs defaultValue="drivers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="drivers">Driver Compliance</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Safety</TabsTrigger>
            <TabsTrigger value="risk">Risk & Training</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/safety/cdl">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <FileCheck className="h-5 w-5 text-blue-500 mb-2" />
                    <CardTitle className="text-sm">CDL Management</CardTitle>
                    <CardDescription className="text-xs">Track expirations & types</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/drug-tests">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Activity className="h-5 w-5 text-purple-500 mb-2" />
                    <CardTitle className="text-sm">Drug & Alcohol</CardTitle>
                    <CardDescription className="text-xs">Test results & scheduling</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/dqf">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <UserCheck className="h-5 w-5 text-green-500 mb-2" />
                    <CardTitle className="text-sm">DQF Files</CardTitle>
                    <CardDescription className="text-xs">Driver qualification files</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/mvr">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <FileText className="h-5 w-5 text-orange-500 mb-2" />
                    <CardTitle className="text-sm">MVR Records</CardTitle>
                    <CardDescription className="text-xs">Motor vehicle reports</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/hos">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Calendar className="h-5 w-5 text-indigo-500 mb-2" />
                    <CardTitle className="text-sm">Hours of Service</CardTitle>
                    <CardDescription className="text-xs">Log audits & violations</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/annual-reviews">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <ClipboardCheck className="h-5 w-5 text-teal-500 mb-2" />
                    <CardTitle className="text-sm">Annual Reviews</CardTitle>
                    <CardDescription className="text-xs">Performance evaluations</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/safety/dot-inspections">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Shield className="h-5 w-5 text-blue-600 mb-2" />
                    <CardTitle className="text-sm">DOT Inspections</CardTitle>
                    <CardDescription className="text-xs">Level 1-3 inspections</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/roadside-inspections">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Truck className="h-5 w-5 text-amber-600 mb-2" />
                    <CardTitle className="text-sm">Roadside</CardTitle>
                    <CardDescription className="text-xs">Roadside checks & citations</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/dvir">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Wrench className="h-5 w-5 text-slate-500 mb-2" />
                    <CardTitle className="text-sm">DVIRs</CardTitle>
                    <CardDescription className="text-xs">Daily vehicle inspections</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/out-of-service">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
                    <CardTitle className="text-sm">Out of Service</CardTitle>
                    <CardDescription className="text-xs">OOS vehicles & drivers</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/safety/incidents">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
                    <CardTitle className="text-sm">Accidents & Incidents</CardTitle>
                    <CardDescription className="text-xs">Crash logs & claims</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/trainings">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <GraduationCap className="h-5 w-5 text-blue-500 mb-2" />
                    <CardTitle className="text-sm">Training Programs</CardTitle>
                    <CardDescription className="text-xs">Assign & track training</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/safety/programs">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Shield className="h-5 w-5 text-indigo-500 mb-2" />
                    <CardTitle className="text-sm">Safety Programs</CardTitle>
                    <CardDescription className="text-xs">Incentives & bonuses</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

