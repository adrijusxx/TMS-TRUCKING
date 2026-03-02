'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
        inspectionLocation: (editInspection as any).inspectionLocation || '',
        inspectionState: (editInspection as any).inspectionState || '',
        inspectorName: (editInspection as any).inspectorName || '',
        inspectorBadgeNumber: (editInspection as any).inspectorBadgeNumber || '',
        violationsFound: editInspection.violationsFound ?? false,
        outOfService: editInspection.outOfService ?? false,
        recordable: editInspection.recordable ?? false,
        oosReason: (editInspection as any).oosReason || '',
        totalCharge: editInspection.totalCharge ?? 0,
        totalFee: editInspection.totalFee ?? 0,
        note: editInspection.note || '',
        driverId: (editInspection as any).driverId || '',
        truckId: (editInspection as any).truckId || '',
        trailerId: (editInspection as any).trailerId || '',
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
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Entity selectors */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Driver</Label>
              <DriverCombobox
                value={form.watch('driverId')}
                onValueChange={(v) => form.setValue('driverId', v)}
                placeholder="Select driver"
              />
            </div>
            <div className="space-y-2">
              <Label>Truck</Label>
              <TruckCombobox
                value={form.watch('truckId')}
                onValueChange={(v) => form.setValue('truckId', v)}
                placeholder="Select truck"
              />
            </div>
            <div className="space-y-2">
              <Label>Trailer</Label>
              <TrailerCombobox
                value={form.watch('trailerId')}
                onValueChange={(v) => form.setValue('trailerId', v)}
                placeholder="Select trailer"
              />
            </div>
          </div>

          <Separator />

          {/* Inspection details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inspection Level</Label>
              <Select value={form.watch('inspectionLevel')} onValueChange={(v) => form.setValue('inspectionLevel', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEVEL_1">Level 1</SelectItem>
                  <SelectItem value="LEVEL_2">Level 2</SelectItem>
                  <SelectItem value="LEVEL_3">Level 3</SelectItem>
                  <SelectItem value="LEVEL_5">Level 5</SelectItem>
                  <SelectItem value="LEVEL_6">Level 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Inspection Date</Label>
              <Input type="date" {...form.register('inspectionDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...form.register('inspectionLocation')} placeholder="Location" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...form.register('inspectionState')} placeholder="State" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inspector Name</Label>
              <Input {...form.register('inspectorName')} placeholder="Inspector name" />
            </div>
            <div className="space-y-2">
              <Label>Badge Number</Label>
              <Input {...form.register('inspectorBadgeNumber')} placeholder="Badge number" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('violationsFound')}
                onCheckedChange={(v) => form.setValue('violationsFound', !!v)}
              />
              <Label className="font-normal">Violations Found</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={watchOOS}
                onCheckedChange={(v) => form.setValue('outOfService', !!v)}
              />
              <Label className="font-normal">Out of Service</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('recordable')}
                onCheckedChange={(v) => form.setValue('recordable', !!v)}
              />
              <Label className="font-normal">Recordable</Label>
            </div>
          </div>

          {watchOOS && (
            <div className="space-y-2">
              <Label>OOS Reason</Label>
              <Input {...form.register('oosReason')} placeholder="Reason for out of service" />
            </div>
          )}

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

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea {...form.register('note')} placeholder="Additional notes..." rows={3} />
          </div>

          {/* Documents */}
          {isEdit && editInspection?.id && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attachments</Label>
                <DocumentUpload
                  compact
                  onSuccess={() => onSuccess?.()}
                />
              </div>
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
