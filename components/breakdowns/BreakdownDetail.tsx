'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Truck,
  FileText,
  Edit,
  Trash2,
  Upload,
  Clock,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface BreakdownDetailProps {
  breakdownId: string;
}

async function fetchBreakdown(id: string) {
  const response = await fetch(`/api/breakdowns/${id}`);
  if (!response.ok) throw new Error('Failed to fetch breakdown');
  return response.json();
}

async function updateBreakdown(id: string, data: any) {
  const response = await fetch(`/api/breakdowns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update breakdown');
  }
  return response.json();
}

async function deleteBreakdown(id: string) {
  const response = await fetch(`/api/breakdowns/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete breakdown');
  }
  return response.json();
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REPORTED: 'bg-yellow-100 text-yellow-800',
    DISPATCHED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    WAITING_PARTS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export default function BreakdownDetail({ breakdownId }: BreakdownDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['breakdown', breakdownId],
    queryFn: () => fetchBreakdown(breakdownId),
  });

  const breakdown = data?.data;

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBreakdown(breakdownId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown', breakdownId] });
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      toast.success('Breakdown updated successfully');
      setIsEditing(false);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBreakdown(breakdownId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      toast.success('Breakdown deleted successfully');
      router.push('/dashboard/breakdowns');
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const handleUpdate = (field: string, value: any) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this breakdown? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading breakdown...</div>
      </div>
    );
  }

  if (fetchError || !breakdown) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading breakdown</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Calculate downtime hours
  const downtimeHours = breakdown.downtimeHours || 
    (breakdown.reportedAt && breakdown.truckReadyAt 
      ? Math.round((new Date(breakdown.truckReadyAt).getTime() - new Date(breakdown.reportedAt).getTime()) / (1000 * 60 * 60) * 10) / 10
      : breakdown.reportedAt
      ? Math.round((Date.now() - new Date(breakdown.reportedAt).getTime()) / (1000 * 60 * 60) * 10) / 10
      : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/breakdowns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{breakdown.breakdownNumber}</h1>
            <p className="text-muted-foreground">
              Reported {formatDateTime(breakdown.reportedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('trucks.edit') && (
            <>
              <Link href={`/dashboard/breakdowns/${breakdownId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              {can('trucks.delete') && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Breakdown Information</CardTitle>
            <CardDescription>Details about the breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                {isEditing && can('trucks.edit') ? (
                  <Select
                    value={breakdown.status}
                    onValueChange={(value) => handleUpdate('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REPORTED">Reported</SelectItem>
                      <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getStatusColor(breakdown.status)}>
                      {formatStatus(breakdown.status)}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Priority</Label>
                <div className="mt-1">
                  <Badge className={getPriorityColor(breakdown.priority)}>
                    {breakdown.priority}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Breakdown Type</Label>
              <div className="mt-1 font-medium">{formatType(breakdown.breakdownType)}</div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Description</Label>
              <div className="mt-1 whitespace-pre-wrap">{breakdown.description}</div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {can('trucks.edit') && (
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={breakdown.status}
                  onValueChange={(value) => handleUpdate('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPORTED">Reported</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_PARTS">Waiting Parts</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-1">Downtime</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {downtimeHours !== null ? `${downtimeHours}h` : 'Calculating...'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Truck</Label>
              <div className="mt-1">
                <Link
                  href={`/dashboard/trucks/${breakdown.truck.id}`}
                  className="font-medium text-primary hover:underline flex items-center gap-2"
                >
                  <Truck className="h-4 w-4" />
                  {breakdown.truck.truckNumber}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {breakdown.truck.make} {breakdown.truck.model}
                </div>
              </div>
            </div>

            {breakdown.driver && (
              <div>
                <Label className="text-sm text-muted-foreground">Driver</Label>
                <div className="mt-1">
                  <Link
                    href={`/dashboard/drivers/${breakdown.driver.id}`}
                    className="font-medium text-primary hover:underline flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
                  </Link>
                </div>
              </div>
            )}

            {breakdown.load && (
              <div>
                <Label className="text-sm text-muted-foreground">Active Load</Label>
                <div className="mt-1">
                  <Link
                    href={`/dashboard/loads/${breakdown.load.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {breakdown.load.loadNumber}
                  </Link>
                </div>
              </div>
            )}

            {breakdown.odometerReading && (
              <div>
                <Label className="text-sm text-muted-foreground">Odometer Reading</Label>
                <div className="mt-1 font-medium">
                  {breakdown.odometerReading.toLocaleString()} miles
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">{breakdown.location}</div>
                {breakdown.address && (
                  <div className="text-sm text-muted-foreground">{breakdown.address}</div>
                )}
                {(breakdown.city || breakdown.state) && (
                  <div className="text-sm text-muted-foreground">
                    {breakdown.city && `${breakdown.city}, `}
                    {breakdown.state} {breakdown.zip}
                  </div>
                )}
              </div>
            </div>
            {breakdown.latitude && breakdown.longitude && (
              <div className="text-xs text-muted-foreground">
                Coordinates: {breakdown.latitude.toFixed(4)}, {breakdown.longitude.toFixed(4)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Reported At</Label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDateTime(breakdown.reportedAt)}
              </div>
            </div>
            {breakdown.dispatchedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Dispatched At</Label>
                <div className="mt-1">{formatDateTime(breakdown.dispatchedAt)}</div>
              </div>
            )}
            {breakdown.arrivedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Arrived At</Label>
                <div className="mt-1">{formatDateTime(breakdown.arrivedAt)}</div>
              </div>
            )}
            {breakdown.repairStartedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Repair Started</Label>
                <div className="mt-1">{formatDateTime(breakdown.repairStartedAt)}</div>
              </div>
            )}
            {breakdown.repairCompletedAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Repair Completed</Label>
                <div className="mt-1">{formatDateTime(breakdown.repairCompletedAt)}</div>
              </div>
            )}
            {breakdown.truckReadyAt && (
              <div>
                <Label className="text-sm text-muted-foreground">Truck Ready</Label>
                <div className="mt-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {formatDateTime(breakdown.truckReadyAt)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Provider */}
        {(breakdown.serviceProvider || breakdown.serviceContact || breakdown.serviceAddress) && (
          <Card>
            <CardHeader>
              <CardTitle>Service Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {breakdown.serviceProvider && (
                <div>
                  <Label className="text-sm text-muted-foreground">Provider</Label>
                  <div className="mt-1 font-medium">{breakdown.serviceProvider}</div>
                </div>
              )}
              {breakdown.serviceContact && (
                <div>
                  <Label className="text-sm text-muted-foreground">Contact</Label>
                  <div className="mt-1">{breakdown.serviceContact}</div>
                </div>
              )}
              {breakdown.serviceAddress && (
                <div>
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <div className="mt-1">{breakdown.serviceAddress}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Costs */}
        {(breakdown.repairCost || breakdown.towingCost || breakdown.laborCost || breakdown.partsCost || breakdown.totalCost > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {breakdown.repairCost && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Repair Cost</span>
                  <span className="font-medium">{formatCurrency(breakdown.repairCost)}</span>
                </div>
              )}
              {breakdown.towingCost && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Towing Cost</span>
                  <span className="font-medium">{formatCurrency(breakdown.towingCost)}</span>
                </div>
              )}
              {breakdown.laborCost && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Labor Cost</span>
                  <span className="font-medium">{formatCurrency(breakdown.laborCost)}</span>
                </div>
              )}
              {breakdown.partsCost && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parts Cost</span>
                  <span className="font-medium">{formatCurrency(breakdown.partsCost)}</span>
                </div>
              )}
              {breakdown.otherCosts && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Other Costs</span>
                  <span className="font-medium">{formatCurrency(breakdown.otherCosts)}</span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between font-bold">
                <span>Total Cost</span>
                <span className="text-lg">{formatCurrency(breakdown.totalCost || 0)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution */}
        {breakdown.resolution && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{breakdown.resolution}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

