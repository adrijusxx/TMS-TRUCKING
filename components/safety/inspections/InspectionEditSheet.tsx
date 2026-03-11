'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import DriverCombobox from '@/components/drivers/DriverCombobox';
import TruckCombobox from '@/components/trucks/TruckCombobox';
import TrailerCombobox from '@/components/trailers/TrailerCombobox';
import DocumentUpload from '@/components/documents/DocumentUpload';
import type { InspectionData } from './InspectionsColumns';

interface InspectionEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editInspection?: InspectionData | null;
}

const defaults = {
  inspectionLevel: 'LEVEL_1',
  inspectionDate: new Date().toISOString().split('T')[0],
  inspectionLocation: '',
  inspectionState: '',
  inspectorName: '',
  inspectorBadgeNumber: '',
  violationsFound: false,
  outOfService: false,
  recordable: false,
  oosReason: '',
  totalCharge: 0,
  totalFee: 0,
  note: '',
  driverId: '',
  truckId: '',
  trailerId: '',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return <Label>{children} <span className="text-destructive">*</span></Label>;
}

export default function InspectionEditSheet({
  open, onOpenChange, onSuccess, editInspection,
}: InspectionEditSheetProps) {
  const isEdit = !!editInspection;
  const form = useForm<any>({ defaultValues: defaults });

  useEffect(() => {
    if (editInspection && open) {
      form.reset({
        inspectionLevel: editInspection.inspectionLevel || 'LEVEL_1',
        inspectionDate: editInspection.inspectionDate
          ? new Date(editInspection.inspectionDate).toISOString().split('T')[0]
          : '',
        inspectionLocation: editInspection.inspectionLocation || '',
        inspectionState: editInspection.inspectionState || '',
        inspectorName: editInspection.inspectorName || '',
        inspectorBadgeNumber: editInspection.inspectorBadgeNumber || '',
        violationsFound: editInspection.violationsFound ?? false,
        outOfService: editInspection.outOfService ?? false,
        recordable: editInspection.recordable ?? false,
        oosReason: editInspection.oosReason || '',
        totalCharge: editInspection.totalCharge ?? 0,
        totalFee: editInspection.totalFee ?? 0,
        note: editInspection.note || '',
        driverId: editInspection.driverId || '',
        truckId: editInspection.truckId || '',
        trailerId: editInspection.trailerId || '',
      });
    } else if (!editInspection && open) {
      form.reset(defaults);
    }
  }, [editInspection, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit
        ? apiUrl(`/api/safety/inspections/${editInspection!.id}`)
        : apiUrl('/api/safety/inspections');
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEdit ? 'update' : 'create'} inspection`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Inspection ${isEdit ? 'updated' : 'created'} successfully`);
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
    mutation.mutate(payload);
  };

  const watchOOS = form.watch('outOfService');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Inspection' : 'Create DOT Inspection'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update inspection details below.' : 'Record a new DOT roadside inspection.'}
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

          {/* --- Inspection Details --- */}
          <SectionLabel>Inspection Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <RequiredLabel>Inspection Level</RequiredLabel>
              <Select value={form.watch('inspectionLevel')} onValueChange={(v) => form.setValue('inspectionLevel', v)}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEVEL_1">Level 1 - Full</SelectItem>
                  <SelectItem value="LEVEL_2">Level 2 - Walk-Around</SelectItem>
                  <SelectItem value="LEVEL_3">Level 3 - Driver Only</SelectItem>
                  <SelectItem value="LEVEL_5">Level 5 - Vehicle Only</SelectItem>
                  <SelectItem value="LEVEL_6">Level 6 - Enhanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Inspection Date</RequiredLabel>
              <Input type="date" {...form.register('inspectionDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input {...form.register('inspectionLocation')} placeholder="Inspection location" />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input {...form.register('inspectionState')} placeholder="e.g. TX" maxLength={2} />
            </div>
          </div>

          <Separator />

          {/* --- Inspector --- */}
          <SectionLabel>Inspector</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Inspector Name</Label>
              <Input {...form.register('inspectorName')} placeholder="Inspector name" />
            </div>
            <div className="space-y-1.5">
              <Label>Badge Number</Label>
              <Input {...form.register('inspectorBadgeNumber')} placeholder="Badge number" />
            </div>
          </div>

          {/* --- Results --- */}
          <SectionLabel>Results</SectionLabel>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('violationsFound')}
                onCheckedChange={(v) => form.setValue('violationsFound', !!v)}
              />
              <Label className="font-normal text-sm">Violations Found</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={watchOOS}
                onCheckedChange={(v) => form.setValue('outOfService', !!v)}
              />
              <Label className="font-normal text-sm">Out of Service</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('recordable')}
                onCheckedChange={(v) => form.setValue('recordable', !!v)}
              />
              <Label className="font-normal text-sm">Recordable</Label>
            </div>
          </div>

          {watchOOS && (
            <div className="space-y-1.5">
              <RequiredLabel>OOS Reason</RequiredLabel>
              <Input {...form.register('oosReason')} placeholder="Reason for out of service" />
            </div>
          )}

          <Separator />

          {/* --- Financial --- */}
          <SectionLabel>Financial</SectionLabel>
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
            <Label>Note</Label>
            <Textarea {...form.register('note')} placeholder="Additional notes..." rows={3} />
          </div>

          {/* --- Documents --- */}
          {isEdit && editInspection?.id && (
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
              {isEdit ? 'Save Changes' : 'Create Inspection'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
