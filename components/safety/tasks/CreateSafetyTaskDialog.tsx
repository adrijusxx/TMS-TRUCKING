'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task Type</Label>
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

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...form.register('date', { valueAsDate: true })} />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusValue as string} onValueChange={setStatusValue as any}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea {...form.register('note')} placeholder="Describe the safety task..." rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...form.register('location')} placeholder="Location" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...form.register('city')} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...form.register('state')} placeholder="State" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Driver Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('driverAmount', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('totalAmount', { valueAsNumber: true })}
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
