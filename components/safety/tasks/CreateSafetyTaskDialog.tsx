'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { createSafetyTaskSchema, type CreateSafetyTaskInput } from '@/lib/validations/safety-task';
import type { SafetyTaskData } from './SafetyTasksColumns';

interface CreateSafetyTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editTask?: SafetyTaskData | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return <Label>{children} <span className="text-destructive">*</span></Label>;
}

export default function CreateSafetyTaskDialog({ open, onOpenChange, onSuccess, editTask }: CreateSafetyTaskDialogProps) {
  const isEdit = !!editTask;

  const form = useForm<CreateSafetyTaskInput & { status?: string }>({
    resolver: zodResolver(createSafetyTaskSchema) as any,
    defaultValues: {
      taskType: 'GENERAL',
      date: new Date(),
      driverAmount: 0,
      totalAmount: 0,
    },
  });

  useEffect(() => {
    if (editTask && open) {
      form.reset({
        taskType: editTask.taskType as CreateSafetyTaskInput['taskType'],
        date: new Date(editTask.date),
        note: editTask.note ?? '',
        location: editTask.location ?? '',
        city: editTask.city ?? '',
        state: editTask.state ?? '',
        driverAmount: editTask.driverAmount ?? 0,
        totalAmount: editTask.totalAmount ?? 0,
      });
    } else if (!editTask && open) {
      form.reset({ taskType: 'GENERAL', date: new Date(), driverAmount: 0, totalAmount: 0 });
    }
  }, [editTask, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit ? apiUrl(`/api/safety/tasks/${editTask!.id}`) : apiUrl('/api/safety/tasks');
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEdit ? 'update' : 'create'} safety task`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Safety task ${isEdit ? 'updated' : 'created'} successfully`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: any) => {
    if (isEdit && statusValue) {
      data.status = statusValue;
    }
    mutation.mutate(data);
  };

  const [statusValue, setStatusValue] = [
    form.watch('status' as any) || editTask?.status || 'PENDING',
    (v: string) => form.setValue('status' as any, v),
  ] as const;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Safety Task' : 'Create Safety Task'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update task details below.' : 'Create a new safety task to track.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {/* --- Task Details --- */}
          <SectionLabel>Task Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <RequiredLabel>Task Type</RequiredLabel>
              <Select
                value={form.watch('taskType')}
                onValueChange={(v) => form.setValue('taskType', v as CreateSafetyTaskInput['taskType'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCIDENT_CLAIM">Accident / Claim</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="CITATION">Citation</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Date</RequiredLabel>
              <Input type="date" {...form.register('date', { valueAsDate: true })} />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={statusValue as string} onValueChange={setStatusValue as any}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...form.register('note')} placeholder="Describe the safety task..." rows={3} />
          </div>

          <Separator />

          {/* --- Location --- */}
          <SectionLabel>Location</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input {...form.register('location')} placeholder="Address" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input {...form.register('city')} placeholder="City" />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input {...form.register('state')} placeholder="e.g. TX" maxLength={2} />
            </div>
          </div>

          <Separator />

          {/* --- Financial --- */}
          <SectionLabel>Financial</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Driver Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('driverAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('totalAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
