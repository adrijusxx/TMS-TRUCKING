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
import type { AccidentData } from './AccidentsColumns';

interface AccidentEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editAccident?: AccidentData | null;
}

const defaultValues = {
  incidentType: 'ACCIDENT',
  severity: 'MINOR',
  date: new Date().toISOString().split('T')[0],
  status: 'REPORTED',
  location: '',
  city: '',
  state: '',
  description: '',
  dotReportable: false,
  injuriesInvolved: false,
  fatalitiesInvolved: false,
  estimatedCost: 0,
  driverId: '',
  truckId: '',
  trailerId: '',
};

export default function AccidentEditSheet({ open, onOpenChange, onSuccess, editAccident }: AccidentEditSheetProps) {
  const isEdit = !!editAccident;
  const form = useForm<any>({ defaultValues });

  useEffect(() => {
    if (editAccident && open) {
      form.reset({
        incidentType: editAccident.incidentType || 'ACCIDENT',
        severity: editAccident.severity || 'MINOR',
        date: editAccident.date
          ? new Date(editAccident.date).toISOString().split('T')[0]
          : '',
        status: editAccident.status || 'REPORTED',
        location: editAccident.location || '',
        city: editAccident.city || '',
        state: editAccident.state || '',
        description: editAccident.description || '',
        dotReportable: editAccident.dotReportable ?? false,
        injuriesInvolved: editAccident.injuriesInvolved ?? false,
        fatalitiesInvolved: editAccident.fatalitiesInvolved ?? false,
        estimatedCost: editAccident.estimatedCost ?? 0,
        driverId: editAccident.driverId || '',
        truckId: editAccident.truckId || '',
        trailerId: (editAccident as any).trailerId || '',
      });
    } else if (!editAccident && open) {
      form.reset(defaultValues);
    }
  }, [editAccident, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit
        ? apiUrl(`/api/safety/incidents/${editAccident!.id}`)
        : apiUrl('/api/safety/incidents');
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEdit ? 'update' : 'report'} accident`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Accident ${isEdit ? 'updated' : 'reported'} successfully`);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Accident' : 'Report Accident'}</SheetTitle>
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

          {/* Incident details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Type</Label>
              <Select value={form.watch('incidentType')} onValueChange={(v) => form.setValue('incidentType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="COLLISION">Collision</SelectItem>
                  <SelectItem value="ROLLOVER">Rollover</SelectItem>
                  <SelectItem value="FIRE">Fire</SelectItem>
                  <SelectItem value="SPILL">Spill</SelectItem>
                  <SelectItem value="INJURY">Injury</SelectItem>
                  <SelectItem value="EQUIPMENT_FAILURE">Equipment Failure</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={form.watch('severity')} onValueChange={(v) => form.setValue('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="MODERATE">Moderate</SelectItem>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...form.register('date')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REPORTED">Reported</SelectItem>
                  <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                  <SelectItem value="INVESTIGATION_COMPLETE">Investigation Complete</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input {...form.register('location')} placeholder="Street address or highway" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...form.register('city')} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...form.register('state')} placeholder="State" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register('description')} placeholder="Describe the accident..." rows={3} />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('dotReportable')}
                onCheckedChange={(v) => form.setValue('dotReportable', !!v)}
              />
              <Label className="font-normal">DOT Reportable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('injuriesInvolved')}
                onCheckedChange={(v) => form.setValue('injuriesInvolved', !!v)}
              />
              <Label className="font-normal">Injuries</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch('fatalitiesInvolved')}
                onCheckedChange={(v) => form.setValue('fatalitiesInvolved', !!v)}
              />
              <Label className="font-normal">Fatalities</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimated Cost</Label>
            <Input type="number" step="0.01" {...form.register('estimatedCost', { valueAsNumber: true })} />
          </div>

          {/* Documents */}
          {isEdit && editAccident?.id && (
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
              {isEdit ? 'Save Changes' : 'Report Accident'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
