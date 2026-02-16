'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Truck,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Package,
  MapPin,
  Calendar,
} from 'lucide-react';
import { apiUrl, formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import FleetBoard from './FleetBoard';

interface FleetMetrics {
  trucks: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    outOfService: number;
    withDrivers: number;
    utilizationRate: number;
  };
  drivers: {
    total: number;
    available: number;
    onDuty: number;
    offDuty: number;
  };
  maintenance: {
    overdue: number;
    dueSoon: number;
    scheduled: number;
    totalCost: number;
  };
  breakdowns: {
    active: number;
    recent: number;
    totalCost: number;
  };
  inspections: {
    due: number;
    overdue: number;
    upcoming: number;
  };
  loads: {
    active: number;
    assigned: number;
  };
}

async function fetchFleetMetrics(): Promise<{ success: boolean; data: FleetMetrics }> {
  const response = await fetch(apiUrl('/api/fleet/metrics'));
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Failed to fetch fleet metrics: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch fleet metrics');
  }
  return data;
}

export default function FleetDashboard() {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: FleetMetrics }>({
    queryKey: ['fleet-metrics'],
    queryFn: fetchFleetMetrics,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <FleetBoard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive mb-2 font-semibold">Error loading fleet metrics</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
        <FleetBoard />
      </div>
    );
  }

  const metrics = data?.data;

  if (!metrics) {
    return <FleetBoard />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Trucks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.trucks.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.trucks.available} available, {metrics.trucks.utilizationRate.toFixed(1)}% utilization
            </p>
          </CardContent>
        </Card>

        {/* Active Drivers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.drivers.onDuty}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.drivers.available} available of {metrics.drivers.total} total
            </p>
          </CardContent>
        </Card>

        {/* Active Loads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loads</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.loads.active}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.loads.assigned} assigned to trucks
            </p>
          </CardContent>
        </Card>

        {/* Maintenance Due */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.maintenance.dueSoon + metrics.maintenance.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.maintenance.overdue > 0 && (
                <span className="text-red-600">{metrics.maintenance.overdue} overdue, </span>
              )}
              {metrics.maintenance.dueSoon} due soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Truck Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Truck Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">In Use</span>
              <span className="font-semibold">{metrics.trucks.inUse}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold text-green-600">{metrics.trucks.available}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Maintenance</span>
              <span className="font-semibold text-yellow-600">{metrics.trucks.maintenance}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Out of Service</span>
              <span className="font-semibold text-red-600">{metrics.trucks.outOfService}</span>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scheduled</span>
              <span className="font-semibold">{metrics.maintenance.scheduled}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due Soon</span>
              <span className="font-semibold text-yellow-600">{metrics.maintenance.dueSoon}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <span className="font-semibold text-red-600">{metrics.maintenance.overdue}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-semibold">{formatCurrency(metrics.maintenance.totalCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Inspections */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Upcoming</span>
              <span className="font-semibold">{metrics.inspections.upcoming}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due</span>
              <span className="font-semibold text-yellow-600">{metrics.inspections.due}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <span className="font-semibold text-red-600">{metrics.inspections.overdue}</span>
            </div>
          </CardContent>
        </Card>

        {/* Breakdowns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Breakdowns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active</span>
              <span className="font-semibold text-red-600">{metrics.breakdowns.active}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recent (30d)</span>
              <span className="font-semibold">{metrics.breakdowns.recent}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-semibold">{formatCurrency(metrics.breakdowns.totalCost)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common fleet management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/fleet/maintenance">
              <Button variant="outline" className="w-full justify-start">
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance
              </Button>
            </Link>
            <Link href="/dashboard/fleet/inspections">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Inspections
              </Button>
            </Link>
            <Link href="/dashboard/fleet/breakdowns">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Breakdowns
              </Button>
            </Link>
            <Link href="/dashboard/fleet/reports">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Board */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Fleet Board</h2>
          <p className="text-sm text-muted-foreground">Real-time truck status and assignments</p>
        </div>
        <FleetBoard />
      </div>
    </div>
  );
}

























