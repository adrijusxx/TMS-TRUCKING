'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Truck,
  Calendar,
  Plus,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatCurrency, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface MaintenanceSchedule {
  id: string;
  truckId: string;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
    odometerReading: number;
  };
  maintenanceType: string;
  intervalMiles: number;
  intervalMonths: number;
  lastServiceDate?: string | null;
  lastServiceMiles?: number | null;
  nextServiceDate?: string | null;
  nextServiceMiles?: number | null;
  isOverdue: boolean;
  daysUntilDue: number | null;
  milesUntilDue: number | null;
}

interface MaintenanceStats {
  totalScheduled: number;
  overdue: number;
  dueSoon: number; // Due within 7 days
  completed: number;
}

async function fetchMaintenanceSchedules(params: {
  truckId?: string;
  status?: 'all' | 'overdue' | 'due_soon' | 'upcoming';
}) {
  const queryParams = new URLSearchParams();
  if (params.truckId) queryParams.set('truckId', params.truckId);
  if (params.status) queryParams.set('status', params.status);

  const response = await fetch(apiUrl(`/api/fleet/maintenance/schedules?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch maintenance schedules');
  return response.json();
}

async function fetchMaintenanceStats() {
  const response = await fetch(apiUrl('/api/fleet/maintenance/stats'));
  if (!response.ok) throw new Error('Failed to fetch maintenance stats');
  return response.json();
}

function getMaintenanceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    OIL_CHANGE: 'bg-blue-500 text-white',
    TIRE_ROTATION: 'bg-green-500 text-white',
    BRAKE_SERVICE: 'bg-red-500 text-white',
    INSPECTION: 'bg-purple-500 text-white',
    PMI: 'bg-orange-500 text-white',
    ENGINE: 'bg-yellow-500 text-white',
    TRANSMISSION: 'bg-indigo-500 text-white',
    REPAIR: 'bg-gray-500 text-white',
    OTHER: 'bg-slate-500 text-white',
  };
  return colors[type] || 'bg-gray-500 text-white';
}

function formatMaintenanceType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function PreventiveMaintenance() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due_soon' | 'upcoming'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenanceSchedules', statusFilter],
    queryFn: () =>
      fetchMaintenanceSchedules({
        status: statusFilter,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['maintenanceStats'],
    queryFn: fetchMaintenanceStats,
  });

  const schedules: MaintenanceSchedule[] = data?.data?.schedules || [];
  const stats: MaintenanceStats = statsData?.data || {
    totalScheduled: 0,
    overdue: 0,
    dueSoon: 0,
    completed: 0,
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading maintenance schedules</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Preventive Maintenance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule and track preventive maintenance to reduce breakdowns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScheduled}</div>
            <div className="text-xs text-muted-foreground mt-1">Active schedules</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-muted-foreground mt-1">Requires attention</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Clock className="h-4 w-4" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.dueSoon}</div>
            <div className="text-xs text-muted-foreground mt-1">Within 7 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground mt-1">This month</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Status</Label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_soon">Due Soon (7 days)</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Link href="/dashboard/maintenance/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedules</CardTitle>
          <CardDescription>
            Showing {schedules.length} maintenance schedule{schedules.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No maintenance schedules found</p>
              <p className="text-sm mt-1">
                {statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Schedule preventive maintenance to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Link
                              href={`/dashboard/trucks/${schedule.truck.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              #{schedule.truck.truckNumber}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {schedule.truck.make} {schedule.truck.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMaintenanceTypeColor(schedule.maintenanceType)}>
                          {formatMaintenanceType(schedule.maintenanceType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {schedule.intervalMiles > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              {schedule.intervalMiles.toLocaleString()} miles
                            </div>
                          )}
                          {schedule.intervalMonths > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {schedule.intervalMonths} months
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {schedule.lastServiceDate ? (
                          <div>
                            <div className="text-sm">{formatDate(schedule.lastServiceDate)}</div>
                            {schedule.lastServiceMiles && (
                              <div className="text-xs text-muted-foreground">
                                {schedule.lastServiceMiles.toLocaleString()} mi
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {schedule.nextServiceDate ? (
                          <div>
                            <div className="text-sm font-medium">{formatDate(schedule.nextServiceDate)}</div>
                            {schedule.nextServiceMiles && (
                              <div className="text-xs text-muted-foreground">
                                {schedule.nextServiceMiles.toLocaleString()} mi
                              </div>
                            )}
                            {schedule.daysUntilDue !== null && (
                              <div
                                className={`text-xs mt-1 ${
                                  schedule.isOverdue
                                    ? 'text-red-600 font-semibold'
                                    : schedule.daysUntilDue <= 7
                                    ? 'text-yellow-600'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {schedule.isOverdue
                                  ? 'OVERDUE'
                                  : schedule.daysUntilDue === 0
                                  ? 'Due today'
                                  : `${schedule.daysUntilDue} days`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {schedule.isOverdue ? (
                          <Badge className="bg-red-500 text-white">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        ) : schedule.daysUntilDue !== null && schedule.daysUntilDue <= 7 ? (
                          <Badge className="bg-yellow-500 text-white">
                            <Clock className="h-3 w-3 mr-1" />
                            Due Soon
                          </Badge>
                        ) : (
                          <Badge variant="outline">Upcoming</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/maintenance?truckId=${schedule.truck.id}`}>
                          <Button variant="ghost" size="sm">
                            View History
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

