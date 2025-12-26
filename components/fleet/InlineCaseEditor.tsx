'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save, X, Loader2, Phone, Mail, MapPin, DollarSign, Users,
  CreditCard, FileText, ExternalLink, Clock, Calendar, CheckCircle,
} from 'lucide-react';
import { cn, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import CaseAssignmentPicker from './CaseAssignmentPicker';
import CasePaymentForm from './CasePaymentForm';
import WorkOrderImporter from './WorkOrderImporter';
import ReceiptUploader from './ReceiptUploader';
import QuickVendorCreate from './QuickVendorCreate';
import Link from 'next/link';

interface Assignment {
  id: string;
  userId: string;
  role?: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string };
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

interface Breakdown {
  id: string;
  breakdownNumber: string;
  priority: string;
  status: string;
  breakdownType: string;
  location: string;
  description: string;
  serviceProvider?: string;
  serviceContact?: string;
  serviceAddress?: string;
  repairCost?: number;
  towingCost?: number;
  laborCost?: number;
  partsCost?: number;
  otherCosts?: number;
  totalCost: number;
  isDriverChargeable?: boolean;
  driverChargeNotes?: string;
  resolution?: string;
  repairNotes?: string;
  technicianNotes?: string;
  reportedAt?: string;
  dispatchedAt?: string;
  arrivedAt?: string;
  repairStartedAt?: string;
  repairCompletedAt?: string;
  truckReadyAt?: string;
  downtimeHours?: number;
  truck: { id: string; truckNumber: string; make?: string; model?: string };
  driver?: { id: string; user: { firstName: string; lastName: string; phone?: string; email?: string } } | null;
  assignments?: Assignment[];
  payments?: Payment[];
  totalPaid?: number;
}

interface InlineCaseEditorProps {
  breakdown: Breakdown;
  onClose: () => void;
}

const STATUSES = [
  { value: 'REPORTED', label: 'Reported' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_PARTS', label: 'Waiting Parts' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITIES = [
  { value: 'CRITICAL', label: '🔴 Critical' },
  { value: 'HIGH', label: '🟡 High' },
  { value: 'MEDIUM', label: '🟢 Medium' },
  { value: 'LOW', label: '⚪ Low' },
];

async function updateBreakdown(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/breakdowns/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update case');
  }
  return response.json();
}

export default function InlineCaseEditor({ breakdown, onClose }: InlineCaseEditorProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

  // Form state
  const [formData, setFormData] = useState({
    status: breakdown.status,
    priority: breakdown.priority,
    location: breakdown.location,
    description: breakdown.description,
    serviceProvider: breakdown.serviceProvider || '',
    serviceContact: breakdown.serviceContact || '',
    serviceAddress: breakdown.serviceAddress || '',
    repairCost: breakdown.repairCost || 0,
    towingCost: breakdown.towingCost || 0,
    laborCost: breakdown.laborCost || 0,
    partsCost: breakdown.partsCost || 0,
    otherCosts: breakdown.otherCosts || 0,
    isDriverChargeable: breakdown.isDriverChargeable || false,
    driverChargeNotes: breakdown.driverChargeNotes || '',
    resolution: breakdown.resolution || '',
    repairNotes: breakdown.repairNotes || '',
    technicianNotes: breakdown.technicianNotes || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBreakdown(breakdown.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-count'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-metrics-summary'] });
      toast.success('Case updated successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = () => {
    const costFields = {
      repairCost: parseFloat(String(formData.repairCost)) || 0,
      towingCost: parseFloat(String(formData.towingCost)) || 0,
      laborCost: parseFloat(String(formData.laborCost)) || 0,
      partsCost: parseFloat(String(formData.partsCost)) || 0,
      otherCosts: parseFloat(String(formData.otherCosts)) || 0,
    };

    // Auto-populate timeline fields based on status changes
    const timelineFields: any = {};
    const now = new Date().toISOString();

    if (formData.status !== breakdown.status) {
      switch (formData.status) {
        case 'DISPATCHED':
          if (!breakdown.dispatchedAt) timelineFields.dispatchedAt = now;
          break;
        case 'IN_PROGRESS':
          if (!breakdown.arrivedAt) timelineFields.arrivedAt = now;
          if (!breakdown.repairStartedAt) timelineFields.repairStartedAt = now;
          break;
        case 'COMPLETED':
          if (!breakdown.repairCompletedAt) timelineFields.repairCompletedAt = now;
          break;
        case 'RESOLVED':
          if (!breakdown.truckReadyAt) timelineFields.truckReadyAt = now;
          break;
      }
    }

    updateMutation.mutate({
      ...formData,
      ...costFields,
      ...timelineFields,
    });
  };

  const totalEstimatedCost =
    (parseFloat(String(formData.repairCost)) || 0) +
    (parseFloat(String(formData.towingCost)) || 0) +
    (parseFloat(String(formData.laborCost)) || 0) +
    (parseFloat(String(formData.partsCost)) || 0) +
    (parseFloat(String(formData.otherCosts)) || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold">{breakdown.breakdownNumber}</span>
          <Badge variant="outline">#{breakdown.truck.truckNumber}</Badge>
          {breakdown.driver && (
            <span className="text-sm text-muted-foreground">
              {breakdown.driver.user.firstName} {breakdown.driver.user.lastName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-8">
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="costs" className="text-xs">
            Costs {totalEstimatedCost > 0 && <Badge className="ml-1 h-4 px-1" variant="secondary">${totalEstimatedCost}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">
            Payments {(breakdown.payments?.length || 0) > 0 && <Badge className="ml-1 h-4 px-1" variant="secondary">{breakdown.payments?.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs">
            Team {(breakdown.assignments?.length || 0) > 0 && <Badge className="ml-1 h-4 px-1" variant="secondary">{breakdown.assignments?.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Service Provider</Label>
              <Input
                value={formData.serviceProvider}
                onChange={(e) => setFormData(p => ({ ...p, serviceProvider: e.target.value }))}
                placeholder="Repair shop name"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Service Contact</Label>
              <Input
                value={formData.serviceContact}
                onChange={(e) => setFormData(p => ({ ...p, serviceContact: e.target.value }))}
                placeholder="Phone number"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Service Address</Label>
              <Input
                value={formData.serviceAddress}
                onChange={(e) => setFormData(p => ({ ...p, serviceAddress: e.target.value }))}
                placeholder="Service location"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Resolution / Repair Notes</Label>
            <Textarea
              value={formData.resolution}
              onChange={(e) => setFormData(p => ({ ...p, resolution: e.target.value }))}
              rows={2}
              placeholder="How was the issue resolved?"
              className="text-xs resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Timeline Events
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Reported</span>
                  <span className="font-mono text-xs">
                    {breakdown.reportedAt ? new Date(breakdown.reportedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Dispatched</span>
                  <span className="font-mono text-xs">
                    {breakdown.dispatchedAt ? new Date(breakdown.dispatchedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Arrived</span>
                  <span className="font-mono text-xs">
                    {breakdown.arrivedAt ? new Date(breakdown.arrivedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Repair Started</span>
                  <span className="font-mono text-xs">
                    {breakdown.repairStartedAt ? new Date(breakdown.repairStartedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Repair Completed</span>
                  <span className="font-mono text-xs">
                    {breakdown.repairCompletedAt ? new Date(breakdown.repairCompletedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Truck Ready</span>
                  <span className="font-mono text-xs">
                    {breakdown.truckReadyAt ? new Date(breakdown.truckReadyAt).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
              {breakdown.downtimeHours !== undefined && breakdown.downtimeHours > 0 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
                  <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">Total Downtime</div>
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {breakdown.downtimeHours.toFixed(1)} hours
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Technician Notes</Label>
                <Textarea
                  value={formData.technicianNotes}
                  onChange={(e) => setFormData(p => ({ ...p, technicianNotes: e.target.value }))}
                  placeholder="Notes from technician..."
                  rows={6}
                  className="text-xs resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Repair Notes</Label>
                <Textarea
                  value={formData.repairNotes}
                  onChange={(e) => setFormData(p => ({ ...p, repairNotes: e.target.value }))}
                  placeholder="Detailed repair notes..."
                  rows={6}
                  className="text-xs resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="mt-3 space-y-3">
          {/* Work Order Importer */}
          <WorkOrderImporter
            breakdownId={breakdown.id}
            onImportSuccess={(data) => {
              // Update form data with parsed values
              if (data.repairCost) setFormData(p => ({ ...p, repairCost: data.repairCost }));
              if (data.towingCost) setFormData(p => ({ ...p, towingCost: data.towingCost }));
              if (data.laborCost) setFormData(p => ({ ...p, laborCost: data.laborCost }));
              if (data.partsCost) setFormData(p => ({ ...p, partsCost: data.partsCost }));
              if (data.otherCosts) setFormData(p => ({ ...p, otherCosts: data.otherCosts }));
              if (data.serviceProvider) setFormData(p => ({ ...p, serviceProvider: data.serviceProvider }));
              if (data.serviceContact) setFormData(p => ({ ...p, serviceContact: data.serviceContact }));
              if (data.serviceAddress) setFormData(p => ({ ...p, serviceAddress: data.serviceAddress }));
            }}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Repair Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.repairCost}
                  onChange={(e) => setFormData(p => ({ ...p, repairCost: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-xs pl-6"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Towing Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.towingCost}
                  onChange={(e) => setFormData(p => ({ ...p, towingCost: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-xs pl-6"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Labor Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.laborCost}
                  onChange={(e) => setFormData(p => ({ ...p, laborCost: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-xs pl-6"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Parts Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.partsCost}
                  onChange={(e) => setFormData(p => ({ ...p, partsCost: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-xs pl-6"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Other Costs</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.otherCosts}
                  onChange={(e) => setFormData(p => ({ ...p, otherCosts: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-xs pl-6"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Total Estimated</Label>
              <div className="h-8 flex items-center px-2 bg-muted rounded-md text-sm font-bold">
                ${totalEstimatedCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Driver Chargeability */}
          <div className="border rounded-md p-3 space-y-2 bg-background">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Driver Chargeable?</Label>
              <Switch
                checked={formData.isDriverChargeable}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, isDriverChargeable: checked }))}
              />
            </div>
            {formData.isDriverChargeable && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reason for charge</Label>
                <Input
                  value={formData.driverChargeNotes}
                  onChange={(e) => setFormData(p => ({ ...p, driverChargeNotes: e.target.value }))}
                  placeholder="Why is driver being charged?"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* Quick Add Repair Shop */}
          <QuickVendorCreate
            compact
            onSuccess={(vendor) => {
              setFormData(p => ({
                ...p,
                serviceProvider: vendor.name,
                serviceContact: vendor.phone,
                serviceAddress: vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : vendor.state,
              }));
              toast.success('Vendor info populated');
            }}
          />

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Costs
            </Button>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-3 space-y-4">
          <CasePaymentForm
            breakdownId={breakdown.id}
            payments={breakdown.payments || []}
            totalPaid={breakdown.totalPaid || 0}
            totalCost={totalEstimatedCost}
          />
          <ReceiptUploader breakdownId={breakdown.id} documentType="RECEIPT" />
          <ReceiptUploader breakdownId={breakdown.id} documentType="INVOICE" />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-3">
          <CaseAssignmentPicker
            breakdownId={breakdown.id}
            assignments={breakdown.assignments || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

