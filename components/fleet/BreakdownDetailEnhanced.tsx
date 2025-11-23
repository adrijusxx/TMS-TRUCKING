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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate, formatDateTime, apiUrl } from '@/lib/utils';
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Truck,
  Phone,
  MessageSquare,
  Clock,
  Wrench,
  CheckCircle,
  Send,
  Users,
  Building2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import BreakdownCommunicationLog from './BreakdownCommunicationLog';
import PaymentTracking from '@/components/accounting/PaymentTracking';

interface BreakdownDetailEnhancedProps {
  breakdownId: string;
}

async function fetchBreakdown(id: string) {
  const response = await fetch(apiUrl(`/api/breakdowns/${id}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown');
  return response.json();
}

async function fetchVendors(type?: string) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  const response = await fetch(apiUrl(`/api/vendors?${params.toString()}&limit=100`));
  if (!response.ok) throw new Error('Failed to fetch vendors');
  return response.json();
}

async function fetchUsers() {
  const response = await fetch(apiUrl('/api/settings/users?role=EMPLOYEES'));
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

async function updateBreakdown(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/breakdowns/${id}`), {
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

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REPORTED: 'bg-yellow-500 text-white',
    DISPATCHED: 'bg-blue-500 text-white',
    IN_PROGRESS: 'bg-orange-500 text-white',
    WAITING_PARTS: 'bg-purple-500 text-white',
    COMPLETED: 'bg-green-500 text-white',
    RESOLVED: 'bg-green-500 text-white',
    CANCELLED: 'bg-gray-500 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-blue-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    CRITICAL: 'bg-red-500 text-white',
  };
  return colors[priority] || 'bg-gray-500 text-white';
}

export default function BreakdownDetailEnhanced({ breakdownId }: BreakdownDetailEnhancedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const { data, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['breakdown', breakdownId],
    queryFn: () => fetchBreakdown(breakdownId),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', 'SERVICE_PROVIDER'],
    queryFn: () => fetchVendors('SERVICE_PROVIDER'),
    enabled: dispatchDialogOpen,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const breakdown = data?.data;
  const vendors = vendorsData?.data?.vendors || [];
  const users = usersData?.data?.users || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBreakdown(breakdownId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown', breakdownId] });
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] });
      toast.success('Breakdown updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleUpdate = (field: string, value: any) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleDispatchVendor = () => {
    if (!selectedVendorId) {
      toast.error('Please select a vendor');
      return;
    }

    const vendor = vendors.find((v: any) => v.id === selectedVendorId);
    updateMutation.mutate({
      status: 'DISPATCHED',
      dispatchedAt: new Date().toISOString(),
      serviceProvider: vendor?.name,
      serviceContact: vendor?.phone || vendor?.contacts?.[0]?.phone,
      serviceAddress: vendor?.address ? `${vendor.address}, ${vendor.city}, ${vendor.state}` : undefined,
    });

    setDispatchDialogOpen(false);
    setSelectedVendorId('');
    setDispatchNotes('');
    toast.success(`Vendor ${vendor?.name} dispatched`);
  };

  const handleCallDriver = () => {
    if (breakdown?.driver?.user?.phone) {
      window.location.href = `tel:${breakdown.driver.user.phone}`;
    } else {
      toast.error('Driver phone number not available');
    }
  };

  const handleTextDriver = () => {
    if (breakdown?.driver?.user?.phone) {
      window.location.href = `sms:${breakdown.driver.user.phone}`;
    } else {
      toast.error('Driver phone number not available');
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
          <Link href="/dashboard/fleet/breakdowns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{breakdown.breakdownNumber}</h1>
              <Badge className={getPriorityColor(breakdown.priority)}>
                {breakdown.priority}
              </Badge>
              <Badge className={getStatusColor(breakdown.status)}>
                {formatStatus(breakdown.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Reported {formatDateTime(breakdown.reportedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {breakdown.driver?.user?.phone && (
            <>
              <Button variant="outline" onClick={handleCallDriver}>
                <Phone className="h-4 w-4 mr-2" />
                Call Driver
              </Button>
              <Button variant="outline" onClick={handleTextDriver}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Text Driver
              </Button>
            </>
          )}
          {can('trucks.edit') && (
            <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Dispatch Vendor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dispatch Service Vendor</DialogTitle>
                  <DialogDescription>
                    Select a vendor to dispatch for this breakdown
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Vendor</Label>
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{vendor.name}</div>
                                {vendor.phone && (
                                  <div className="text-xs text-muted-foreground">
                                    {vendor.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dispatch Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add any special instructions..."
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDispatchDialogOpen(false);
                        setSelectedVendorId('');
                        setDispatchNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleDispatchVendor} disabled={!selectedVendorId}>
                      Dispatch
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Downtime:</span>
              <span className="font-semibold">
                {downtimeHours !== null ? `${downtimeHours}h` : 'Calculating...'}
              </span>
            </div>
            {breakdown.load && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Load:</span>
                <Link
                  href={`/dashboard/loads/${breakdown.load.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {breakdown.load.loadNumber}
                </Link>
              </div>
            )}
            {can('trucks.edit') && (
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-sm">Update Status:</Label>
                <Select
                  value={breakdown.status}
                  onValueChange={(value) => handleUpdate('status', value)}
                >
                  <SelectTrigger className="w-[180px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Breakdown Information */}
            <Card>
              <CardHeader>
                <CardTitle>Breakdown Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Breakdown Type</Label>
                  <div className="mt-1 font-medium">
                    {breakdown.breakdownType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                </div>
                {breakdown.problem && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Problem</Label>
                    <div className="mt-1">{breakdown.problem}</div>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <div className="mt-1 whitespace-pre-wrap">{breakdown.description}</div>
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
                      {breakdown.truck.make} {breakdown.truck.model} ({breakdown.truck.year})
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
                      {breakdown.driver.user.phone && (
                        <div className="text-sm text-muted-foreground">
                          {breakdown.driver.user.phone}
                        </div>
                      )}
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

            {/* Service Provider */}
            {breakdown.serviceProvider && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Provider</Label>
                    <div className="mt-1 font-medium">{breakdown.serviceProvider}</div>
                  </div>
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
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Timeline</CardTitle>
              <CardDescription>Key events and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-blue-500 p-2">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-px h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-semibold">Reported</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(breakdown.reportedAt)}
                    </div>
                  </div>
                </div>

                {breakdown.dispatchedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-500 p-2">
                        <Send className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-px h-full bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-semibold">Dispatched</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(breakdown.dispatchedAt)}
                      </div>
                      {breakdown.serviceProvider && (
                        <div className="text-sm mt-1">Vendor: {breakdown.serviceProvider}</div>
                      )}
                    </div>
                  </div>
                )}

                {breakdown.arrivedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-orange-500 p-2">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-px h-full bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-semibold">Service Arrived</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(breakdown.arrivedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {breakdown.repairStartedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-purple-500 p-2">
                        <Wrench className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-px h-full bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-semibold">Repair Started</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(breakdown.repairStartedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {breakdown.repairCompletedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-500 p-2">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      {breakdown.truckReadyAt && <div className="w-px h-full bg-border mt-2" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-semibold">Repair Completed</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(breakdown.repairCompletedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {breakdown.truckReadyAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-600 p-2">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Truck Ready</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(breakdown.truckReadyAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Communication Timeline */}
          <BreakdownCommunicationLog breakdownId={breakdownId} />
        </TabsContent>

        {/* Dispatch Tab */}
        <TabsContent value="dispatch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch & Coordination</CardTitle>
              <CardDescription>Manage vendor dispatch and coordination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {breakdown.serviceProvider ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Vendor</Label>
                    <div className="mt-1 font-medium">{breakdown.serviceProvider}</div>
                    {breakdown.serviceContact && (
                      <div className="text-sm text-muted-foreground">
                        Contact: {breakdown.serviceContact}
                      </div>
                    )}
                  </div>
                  {breakdown.dispatchedAt && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Dispatched At</Label>
                      <div className="mt-1">{formatDateTime(breakdown.dispatchedAt)}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No vendor dispatched yet</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => setDispatchDialogOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Dispatch Vendor
                    </Button>
                    <Link href="/dashboard/fleet/vendors">
                      <Button variant="outline">
                        <Building2 className="h-4 w-4 mr-2" />
                        Browse Vendors
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Costs</CardTitle>
              <CardDescription>Track all expenses related to this breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {breakdown.totalCost > 0 || breakdown.repairCost || breakdown.towingCost ? (
                <div className="space-y-3">
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
                  <div className="pt-3 border-t flex justify-between font-bold text-lg">
                    <span>Total Cost</span>
                    <span>{formatCurrency(breakdown.totalCost || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No costs recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Tracking */}
          <PaymentTracking
            entityId={breakdownId}
            entityType="breakdown"
            payments={breakdown.payments || []}
            mcNumberId={breakdown.mcNumberId}
            canEdit={can('trucks.edit')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

