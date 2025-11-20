'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const mcNumberSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  type: z.enum(['CARRIER', 'BROKER'], { message: 'Type is required' }),
  companyPhone: z.string().optional(),
  owner: z.string().optional(),
  isDefault: z.boolean().optional(),
  usdot: z.string().optional(),
  notes: z.string().optional(),
  number: z.string().min(1, 'MC number is required'),
});

type McNumberFormData = z.infer<typeof mcNumberSchema>;

interface McNumber {
  id: string;
  companyName: string;
  type: 'CARRIER' | 'BROKER';
  companyPhone: string | null;
  owner: string | null;
  isDefault: boolean;
  usdot: string | null;
  notes: string | null;
  number: string;
}

interface McNumberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcNumber?: McNumber | null;
}

async function createMcNumber(data: McNumberFormData) {
  const response = await fetch(apiUrl('/api/mc-numbers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create MC number');
  }
  return response.json();
}

async function updateMcNumber(id: string, data: McNumberFormData) {
  const response = await fetch(apiUrl(`/api/mc-numbers/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update MC number');
  }
  return response.json();
}

export default function McNumberForm({
  open,
  onOpenChange,
  mcNumber,
}: McNumberFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<McNumberFormData>({
    resolver: zodResolver(mcNumberSchema),
    defaultValues: {
      companyName: '',
      type: 'CARRIER',
      companyPhone: '',
      owner: '',
      isDefault: false,
      usdot: '',
      notes: '',
      number: '',
    },
  });

  const isDefault = watch('isDefault');

  useEffect(() => {
    if (mcNumber) {
      reset({
        companyName: mcNumber.companyName,
        type: mcNumber.type,
        companyPhone: mcNumber.companyPhone || '',
        owner: mcNumber.owner || '',
        isDefault: mcNumber.isDefault,
        usdot: mcNumber.usdot || '',
        notes: mcNumber.notes || '',
        number: mcNumber.number,
      });
    } else {
      reset({
        companyName: '',
        type: 'CARRIER',
        companyPhone: '',
        owner: '',
        isDefault: false,
        usdot: '',
        notes: '',
        number: '',
      });
    }
    setError(null);
  }, [mcNumber, reset]);

  const createMutation = useMutation({
    mutationFn: createMcNumber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] }); // Refresh MC switcher
      toast.success('MC number created successfully');
      onOpenChange(false);
      reset();
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: McNumberFormData }) =>
      updateMcNumber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] }); // Refresh MC switcher
      toast.success('MC number updated successfully');
      onOpenChange(false);
      reset();
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = async (data: McNumberFormData) => {
    setError(null);
    if (mcNumber) {
      updateMutation.mutate({ id: mcNumber.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mcNumber ? 'Edit MC Number' : 'Create MC Number'}
          </DialogTitle>
          <DialogDescription>
            {mcNumber
              ? 'Update MC number information'
              : 'Add a new MC number to your company'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">MC Number *</Label>
              <Input
                id="number"
                {...register('number')}
                placeholder="e.g., 160847"
              />
              {errors.number && (
                <p className="text-sm text-destructive">
                  {errors.number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) =>
                  setValue('type', value as 'CARRIER' | 'BROKER')
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARRIER">Carrier</SelectItem>
                  <SelectItem value="BROKER">Broker</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              {...register('companyName')}
              placeholder="e.g., FOUR WAYS LOGISTICS II INC"
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                {...register('companyPhone')}
                placeholder="e.g., 708-897-8259"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usdot">USDOT</Label>
              <Input
                id="usdot"
                {...register('usdot')}
                placeholder="e.g., 2724854"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <Input
              id="owner"
              {...register('owner')}
              placeholder="e.g., Adrian Via"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) =>
                setValue('isDefault', checked as boolean)
              }
            />
            <Label
              htmlFor="isDefault"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Set as default MC number
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mcNumber ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
