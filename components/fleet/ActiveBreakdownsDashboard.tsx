'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BreakdownQuickEntryForm from './BreakdownQuickEntryForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Truck,
  User,
  Package,
  RefreshCw,
  Filter,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, apiUrl } from '@/lib/utils';

interface Breakdown {
  id: string;
  breakdownNumber: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  reportedAt: string;
  timeElapsed: string;
  elapsedMinutes: number;
  location: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  truck: {
    id: string;
    truckNumber: string;
    make: string;
    model: string;
    year: number;
  };
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
    };
  } | null;
  load?: {
    id: string;
    loadNumber: string;
    customer?: {
      name: string;
    };
    appointmentTime?: string;
  } | null;
  description: string;
  breakdownType: string;
  estimatedArrival?: string;
  arrivedAt?: string;
}

interface ActiveBreakdownsData {
  breakdowns: Breakdown[];
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

async function fetchActiveBreakdowns(priority?: string) {
  const params = new URLSearchParams();
  if (priority && priority !== 'all') {
    params.append('priority', priority);
  }

  const response = await fetch(apiUrl(`/api/fleet/breakdowns/active?${params.toString()}`));
  if (!response.ok) {
    throw new Error('Failed to fetch active breakdowns');
  }
  return response.json();
}

export default function ActiveBreakdownsDashboard() {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(apiUrl(`/api/fleet/breakdowns/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete breakdown');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Breakdown case deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string, breakdownNumber: string) => {
    if (window.confirm(`Are you sure you want to delete breakdown case #${breakdownNumber}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: ActiveBreakdownsData }>({
    queryKey: ['activeBreakdowns', priorityFilter],
    queryFn: () => fetchActiveBreakdowns(priorityFilter),
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  const breakdowns = data?.data?.breakdowns || [];
  const stats = data?.data?.stats || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

  // Priority badge colors
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge className="bg-red-500 text-white">🔴 CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 text-white">🟡 HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500 text-white">🟢 MEDIUM</Badge>;
      case 'LOW':
        return <Badge className="bg-blue-500 text-white">⚪ LOW</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      REPORTED: 'bg-gray-500',
      DISPATCHED: 'bg-blue-500',
      IN_PROGRESS: 'bg-yellow-500',
      WAITING_PARTS: 'bg-orange-500',
      COMPLETED: 'bg-green-500',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">Failed to load active breakdowns</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Active Breakdowns</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={() => setQuickEntryOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🔴 Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🟡 High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">🟢 Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.medium}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">⚪ Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by Priority:</span>
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
            <SelectItem value="HIGH">🟡 High</SelectItem>
            <SelectItem value="MEDIUM">🟢 Medium</SelectItem>
            <SelectItem value="LOW">⚪ Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Breakdowns Table */}
      {breakdowns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Breakdowns</h3>
            <p className="text-muted-foreground mb-4">
              All breakdowns are resolved or there are no active breakdowns at this time.
            </p>
            <Link href="/dashboard/breakdowns/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Report New Breakdown
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Breakdowns</CardTitle>
            <CardDescription>
              Sorted by priority and time reported. Critical breakdowns appear first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Case #</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Elapsed</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdowns.map((breakdown) => (
                    <TableRow key={breakdown.id}>
                      <TableCell>{getPriorityBadge(breakdown.priority)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/breakdowns/${breakdown.id}`}
                          className="font-mono text-sm font-semibold hover:underline"
                        >
                          {breakdown.breakdownNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">#{breakdown.truck.truckNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {breakdown.truck.year} {breakdown.truck.make} {breakdown.truck.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {breakdown.driver ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                #{breakdown.driver.driverNumber}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{breakdown.location}</div>
                            {(breakdown.city || breakdown.state) && (
                              <div className="text-xs text-muted-foreground">
                                {breakdown.city}
                                {breakdown.city && breakdown.state ? ', ' : ''}
                                {breakdown.state}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(breakdown.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{breakdown.timeElapsed}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {breakdown.driver?.user.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Call Driver"
                              onClick={() => {
                                window.location.href = `tel:${breakdown.driver?.user.phone}`;
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/dashboard/breakdowns/${breakdown.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              View
                            </Button>
                          </Link>
                          {session?.user?.role === 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete Case"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(breakdown.id, breakdown.breakdownNumber)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Entry Dialog */}
      <BreakdownQuickEntryForm
        open={quickEntryOpen}
        onOpenChange={setQuickEntryOpen}
      />
    </div>
  );
}

