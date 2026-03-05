'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Phone, MessageSquare, Clock, Send, Building2, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import PaymentTracking from '@/components/accounting/PaymentTracking';
import { fetchBreakdown, fetchVendors, updateBreakdown, formatStatus, getStatusColor, getPriorityColor } from './breakdown-detail/api';
import BreakdownOverviewTab from './breakdown-detail/BreakdownOverviewTab';
import BreakdownTimelineTab from './breakdown-detail/BreakdownTimelineTab';

interface BreakdownDetailEnhancedProps {
  breakdownId: string;
}

export default function BreakdownDetailEnhanced({ breakdownId }: BreakdownDetailEnhancedProps) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
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

  const breakdown = data?.data;
  const vendors = vendorsData?.data?.vendors || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBreakdown(breakdownId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown', breakdownId] });
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] });
      toast.success('Breakdown updated successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDispatchVendor = () => {
    if (!selectedVendorId) { toast.error('Please select a vendor'); return; }
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><div className="text-muted-foreground">Loading breakdown...</div></div>;
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
      <BreakdownHeader
        breakdown={breakdown}
        downtimeHours={downtimeHours}
        canEdit={can('trucks.edit')}
        dispatchDialogOpen={dispatchDialogOpen}
        setDispatchDialogOpen={setDispatchDialogOpen}
        vendors={vendors}
        selectedVendorId={selectedVendorId}
        setSelectedVendorId={setSelectedVendorId}
        dispatchNotes={dispatchNotes}
        setDispatchNotes={setDispatchNotes}
        onDispatchVendor={handleDispatchVendor}
        onUpdateField={(field: string, value: string | number) => updateMutation.mutate({ [field]: value })}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BreakdownOverviewTab breakdown={breakdown} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <BreakdownTimelineTab breakdown={breakdown} breakdownId={breakdownId} />
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          <DispatchTab
            breakdown={breakdown}
            onOpenDispatchDialog={() => setDispatchDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostsTab breakdown={breakdown} breakdownId={breakdownId} canEdit={can('trucks.edit')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --- Inline helper components --- */

function BreakdownHeader({ breakdown, downtimeHours, canEdit, dispatchDialogOpen, setDispatchDialogOpen,
  vendors, selectedVendorId, setSelectedVendorId, dispatchNotes, setDispatchNotes,
  onDispatchVendor, onUpdateField }: any) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/fleet/breakdowns">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{breakdown.breakdownNumber}</h1>
              <Badge className={getPriorityColor(breakdown.priority)}>{breakdown.priority}</Badge>
              <Badge className={getStatusColor(breakdown.status)}>{formatStatus(breakdown.status)}</Badge>
            </div>
            <p className="text-muted-foreground">Reported {formatDateTime(breakdown.reportedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {breakdown.driver?.user?.phone && (
            <>
              <Button variant="outline" onClick={() => window.location.href = `tel:${breakdown.driver.user.phone}`}>
                <Phone className="h-4 w-4 mr-2" />Call Driver
              </Button>
              <Button variant="outline" onClick={() => window.location.href = `sms:${breakdown.driver.user.phone}`}>
                <MessageSquare className="h-4 w-4 mr-2" />Text Driver
              </Button>
            </>
          )}
          {canEdit && (
            <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
              <DialogTrigger asChild>
                <Button><Send className="h-4 w-4 mr-2" />Dispatch Vendor</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dispatch Service Vendor</DialogTitle>
                  <DialogDescription>Select a vendor to dispatch for this breakdown</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Vendor</Label>
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger><SelectValue placeholder="Choose a vendor..." /></SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor: any) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{vendor.name}</div>
                                {vendor.phone && <div className="text-xs text-muted-foreground">{vendor.phone}</div>}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dispatch Notes (Optional)</Label>
                    <Textarea placeholder="Add any special instructions..." value={dispatchNotes} onChange={(e: any) => setDispatchNotes(e.target.value)} rows={3} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setDispatchDialogOpen(false); setSelectedVendorId(''); setDispatchNotes(''); }}>Cancel</Button>
                    <Button onClick={onDispatchVendor} disabled={!selectedVendorId}>Dispatch</Button>
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
              <span className="font-semibold">{downtimeHours !== null ? `${downtimeHours}h` : 'Calculating...'}</span>
            </div>
            {breakdown.load && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Load:</span>
                <Link href={`/dashboard/loads/${breakdown.load.loadNumber || breakdown.load.id}`} className="font-semibold text-primary hover:underline">
                  {breakdown.load.loadNumber}
                </Link>
              </div>
            )}
            {canEdit && (
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-sm">Update Status:</Label>
                <Select value={breakdown.status} onValueChange={(value: string) => onUpdateField('status', value)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['REPORTED', 'DISPATCHED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'RESOLVED', 'CANCELLED'].map((s) => (
                      <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DispatchTab({ breakdown, onOpenDispatchDialog }: { breakdown: any; onOpenDispatchDialog: () => void }) {
  return (
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
              {breakdown.serviceContact && <div className="text-sm text-muted-foreground">Contact: {breakdown.serviceContact}</div>}
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
              <Button onClick={onOpenDispatchDialog}><Send className="h-4 w-4 mr-2" />Dispatch Vendor</Button>
              <Link href="/dashboard/fleet/vendors">
                <Button variant="outline"><Building2 className="h-4 w-4 mr-2" />Browse Vendors</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CostsTab({ breakdown, breakdownId, canEdit }: { breakdown: any; breakdownId: string; canEdit: boolean }) {
  const costItems = [
    { key: 'repairCost', label: 'Repair Cost' },
    { key: 'towingCost', label: 'Towing Cost' },
    { key: 'laborCost', label: 'Labor Cost' },
    { key: 'partsCost', label: 'Parts Cost' },
    { key: 'otherCosts', label: 'Other Costs' },
  ];

  const hasCosts = breakdown.totalCost > 0 || breakdown.repairCost || breakdown.towingCost;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Costs</CardTitle>
          <CardDescription>Track all expenses related to this breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {hasCosts ? (
            <div className="space-y-3">
              {costItems.map(({ key, label }) =>
                breakdown[key] ? (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-medium">{formatCurrency(breakdown[key])}</span>
                  </div>
                ) : null
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

      <PaymentTracking
        entityId={breakdownId}
        entityType="breakdown"
        payments={breakdown.payments || []}
        mcNumberId={breakdown.mcNumberId}
        canEdit={canEdit}
      />
    </div>
  );
}
