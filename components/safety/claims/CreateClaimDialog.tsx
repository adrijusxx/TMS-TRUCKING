'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { ClaimData } from './ClaimsColumns';

interface CreateClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editClaim?: ClaimData | null;
}

export default function CreateClaimDialog({ open, onOpenChange, onSuccess, editClaim }: CreateClaimDialogProps) {
  const isEdit = !!editClaim;
  const form = useForm<any>({
    defaultValues: {
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
    },
  });

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
      });
    } else if (!editClaim && open) {
      form.reset({
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
      });
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

  const onSubmit = (data: any) => mutation.mutate(data);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Claim' : 'Create Insurance Claim'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Claim Type</Label>
              <Select value={form.watch('claimType')} onValueChange={(v) => form.setValue('claimType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="CARGO">Cargo</SelectItem>
                  <SelectItem value="PROPERTY_DAMAGE">Property Damage</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Loss</Label>
              <Input type="date" {...form.register('dateOfLoss')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Insurance Company</Label>
              <Input {...form.register('insuranceCompany')} placeholder="Insurance company" />
            </div>
            <div className="space-y-2">
              <Label>Claim Adjuster</Label>
              <Input {...form.register('adjusterName')} placeholder="Adjuster name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coverage Type</Label>
              <Select value={form.watch('coverageType')} onValueChange={(v) => form.setValue('coverageType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIABILITY">Liability</SelectItem>
                  <SelectItem value="PHYSICAL_DAMAGE">Physical Damage</SelectItem>
                  <SelectItem value="CARGO">Cargo</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="DENIED">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('hasPoliceReport')}
                onCheckedChange={(v) => form.setValue('hasPoliceReport', !!v)}
              />
              <Label className="font-normal">Police Report</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('hasTowing')}
                onCheckedChange={(v) => form.setValue('hasTowing', !!v)}
              />
              <Label className="font-normal">Towing</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('recordable')}
                onCheckedChange={(v) => form.setValue('recordable', !!v)}
              />
              <Label className="font-normal">Recordable</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Driver Amount</Label>
              <Input type="number" step="0.01" {...form.register('driverAmount', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Vendor Amount</Label>
              <Input type="number" step="0.01" {...form.register('vendorAmount', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Charge</Label>
              <Input type="number" step="0.01" {...form.register('totalCharge', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Total Fee</Label>
              <Input type="number" step="0.01" {...form.register('totalFee', { valueAsNumber: true })} />
            </div>
          </div>

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
