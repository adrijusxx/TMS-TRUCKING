'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileCheck, Activity, UserCheck, FileText, Calendar, ClipboardCheck, Truck, Wrench, AlertTriangle, GraduationCap, AlertCircle, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiUrl } from '@/lib/utils';
import { getMcContext } from '@/lib/utils/query-keys';
import SafetyStats, { SafetyStatsData } from './SafetyStats';
import ActionCenter, { ActionItem } from './ActionCenter';
import DriverRiskHeatmap from './DriverRiskHeatmap';

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
  const mcContext = getMcContext();
  const { data, isLoading, error } = useQuery({
    queryKey: ['safety-dashboard', mcContext],
    queryFn: fetchSafetyDashboard,
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading safety hub...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading dashboard</p>
          <button onClick={() => window.location.reload()} className="underline">Refresh</button>
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

  const rawAlerts = data?.alerts || [];

  // Transform data for SafetyStats
  const statsData: SafetyStatsData = {
    openDefects: metrics.openViolations, // Assuming openViolations maps to defects for now, otherwise 0
    hardExpirations: metrics.expiringDocuments,
    accidentsThisMonth: metrics.daysSinceAccident === null ? 0 : (metrics.daysSinceAccident < 30 ? 1 : 0), // Rough approximation
    csaScore: Object.values(metrics.csaScores).reduce((acc, curr) => acc + (curr.score || 0), 0) / (Object.keys(metrics.csaScores).length || 1), // Average or specific logic needed
  };

  // Transform data for ActionCenter
  const actionItems: ActionItem[] = rawAlerts.map(a => ({
    id: a.id,
    title: a.title,
    description: a.message,
    severity: (a.severity as any) || 'MEDIUM',
    type: (a.alertType as any) || 'OTHER',
    actionUrl: '/dashboard/safety/alerts' // Default link, ideally dynamic based on type
  }));

  return (
    <div className="space-y-6">

      {/* Top Row: KPIs */}
      <SafetyStats data={statsData} />

      {/* Middle Row: Action Center & Activity */}
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <ActionCenter items={actionItems} className="h-full" />
        </div>
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">Quick Links</CardTitle>
              <CardDescription>Most accessed resources</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/safety/compliance" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center">
                <UserCheck className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm font-medium">Driver Compliance</span>
              </Link>
              <Link href="/dashboard/safety/fleet" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center">
                <Truck className="h-6 w-6 mb-2 text-blue-600" />
                <span className="text-sm font-medium">Fleet Safety</span>
              </Link>
              <Link href="/dashboard/safety/incidents" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center">
                <AlertCircle className="h-6 w-6 mb-2 text-red-600" />
                <span className="text-sm font-medium">Incidents</span>
              </Link>
              <Link href="/dashboard/safety/training" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center">
                <GraduationCap className="h-6 w-6 mb-2 text-indigo-600" />
                <span className="text-sm font-medium">Training</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Driver Risk Heatmap */}
      <DriverRiskHeatmap />

    </div>
  );
}

