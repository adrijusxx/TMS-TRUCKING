'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import DocumentUpload from '@/components/documents/DocumentUpload';
import type { ClaimData } from './ClaimsColumns';

interface CreateClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editClaim?: ClaimData | null;
}

const defaultValues = {
  claimType: 'ACCIDENT',
  status: 'OPEN',
  dateOfLoss: new Date().toISOString().split('T')[0],
  insuranceCompany: '',
  adjusterName: '',
  coverageType: 'LIABILITY',
  hasPoliceReport: false,
  hasTowing: false,
  recordable: false,
  driverAmount: 0,
  vendorAmount: 0,
  totalCharge: 0,
  totalFee: 0,
  driverId: '',
  truckId: '',
  trailerId: '',
  notes: '',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return <Label>{children} <span className="text-destructive">*</span></Label>;
}

export default function CreateClaimDialog({ open, onOpenChange, onSuccess, editClaim }: CreateClaimDialogProps) {
  const isEdit = !!editClaim;
  const form = useForm<any>({ defaultValues });

  useEffect(() => {
    if (editClaim && open) {
      form.reset({
        claimType: editClaim.claimType || 'ACCIDENT',
        status: editClaim.status || 'OPEN',
        dateOfLoss: editClaim.dateOfLoss
          ? new Date(editClaim.dateOfLoss).toISOString().split('T')[0]
          : '',
        insuranceCompany: editClaim.insuranceCompany || '',
        adjusterName: editClaim.adjusterName || '',
        coverageType: editClaim.coverageType || '',
        hasPoliceReport: editClaim.hasPoliceReport ?? false,
        hasTowing: editClaim.hasTowing ?? false,
        recordable: editClaim.recordable ?? false,
        driverCompStatus: editClaim.driverCompStatus || '',
        driverAmount: editClaim.driverAmount ?? 0,
        vendorCompStatus: editClaim.vendorCompStatus || '',
        vendorAmount: editClaim.vendorAmount ?? 0,
        totalCharge: editClaim.totalCharge ?? 0,
        totalFee: editClaim.totalFee ?? 0,
        driverId: (editClaim as any).driverId || '',
        truckId: (editClaim as any).truckId || '',
        trailerId: (editClaim as any).trailerId || '',
        notes: (editClaim as any).notes || '',
      });
    } else if (!editClaim && open) {
      form.reset(defaultValues);
    }
  }, [editClaim, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit ? apiUrl(`/api/safety/claims/${editClaim!.id}`) : apiUrl('/api/safety/claims');
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEdit ? 'update' : 'create'} claim`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Claim ${isEdit ? 'updated' : 'created'} successfully`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onSubmit = (data: any) => {
    const payload = { ...data };
    if (!payload.driverId) delete payload.driverId;
    if (!payload.truckId) delete payload.truckId;
    if (!payload.trailerId) delete payload.trailerId;
    if (!payload.notes) delete payload.notes;
    mutation.mutate(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Claim' : 'Create Insurance Claim'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update claim details below.' : 'Fill in the claim information.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {/* --- Assets --- */}
          <SectionLabel>Assets</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Driver</Label>
              <DriverCombobox
                value={form.watch('driverId')}
                onValueChange={(v) => form.setValue('driverId', v)}
                placeholder="Select driver"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Truck</Label>
              <TruckCombobox
                value={form.watch('truckId')}
                onValueChange={(v) => form.setValue('truckId', v)}
                placeholder="Select truck"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trailer</Label>
              <TrailerCombobox
                value={form.watch('trailerId')}
                onValueChange={(v) => form.setValue('trailerId', v)}
                placeholder="Select trailer"
              />
            </div>
          </div>

          <Separator />

          {/* --- Claim Details --- */}
          <SectionLabel>Claim Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <RequiredLabel>Claim Type</RequiredLabel>
              <Select value={form.watch('claimType')} onValueChange={(v) => form.setValue('claimType', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="CARGO">Cargo</SelectItem>
                  <SelectItem value="PROPERTY_DAMAGE">Property Damage</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Date of Loss</RequiredLabel>
              <Input type="date" {...form.register('dateOfLoss')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Insurance Company</Label>
              <Input {...form.register('insuranceCompany')} placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>Claim Adjuster</Label>
              <Input {...form.register('adjusterName')} placeholder="Adjuster name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Coverage Type</Label>
              <Select value={form.watch('coverageType')} onValueChange={(v) => form.setValue('coverageType', v)}>
                <SelectTrigger><SelectValue placeholder="Select coverage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIABILITY">Liability</SelectItem>
                  <SelectItem value="PHYSICAL_DAMAGE">Physical Damage</SelectItem>
                  <SelectItem value="CARGO">Cargo</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="DENIED">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- Flags --- */}
          <SectionLabel>Flags</SectionLabel>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('hasPoliceReport')}
                onCheckedChange={(v) => form.setValue('hasPoliceReport', !!v)}
              />
              <Label className="font-normal text-sm">Police Report</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('hasTowing')}
                onCheckedChange={(v) => form.setValue('hasTowing', !!v)}
              />
              <Label className="font-normal text-sm">Towing</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('recordable')}
                onCheckedChange={(v) => form.setValue('recordable', !!v)}
              />
              <Label className="font-normal text-sm">Recordable</Label>
            </div>
          </div>

          <Separator />

          {/* --- Financial --- */}
          <SectionLabel>Financial</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Driver Amount ($)</Label>
              <Input type="number" step="0.01" {...form.register('driverAmount', { valueAsNumber: true })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor Amount ($)</Label>
              <Input type="number" step="0.01" {...form.register('vendorAmount', { valueAsNumber: true })} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total Charge ($)</Label>
              <Input type="number" step="0.01" {...form.register('totalCharge', { valueAsNumber: true })} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Total Fee ($)</Label>
              <Input type="number" step="0.01" {...form.register('totalFee', { valueAsNumber: true })} placeholder="0.00" />
            </div>
          </div>

          {/* --- Notes --- */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} placeholder="Additional notes..." rows={3} />
          </div>

          {/* --- Documents --- */}
          {isEdit && editClaim?.id && (
            <>
              <Separator />
              <SectionLabel>Attachments</SectionLabel>
              <DocumentUpload
                compact
                onSuccess={() => onSuccess?.()}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Claim'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
