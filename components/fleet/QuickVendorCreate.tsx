'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Building2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const quickVendorSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  state: z.string().min(2, 'State is required'),
  city: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional().nullable(),
  specialties: z.string().optional(),
  notes: z.string().optional(),
});

type QuickVendorFormData = z.infer<typeof quickVendorSchema>;

async function createVendor(data: QuickVendorFormData) {
  const response = await fetch(apiUrl('/api/fleet/vendors'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      type: 'REPAIR_SHOP',
      isActive: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create vendor');
  }

  return response.json();
}

interface QuickVendorCreateProps {
  onSuccess?: (vendor: any) => void;
  compact?: boolean;
}

export default function QuickVendorCreate({ onSuccess, compact = false }: QuickVendorCreateProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<QuickVendorFormData>({
    resolver: zodResolver(quickVendorSchema),
    defaultValues: {
      name: '',
      phone: '',
      state: '',
      city: '',
      hourlyRate: null,
      specialties: '',
      notes: '',
    },
  });

  const selectedState = watch('state');

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['repairShops'] });
      toast.success(`Vendor "${data.data.name}" created successfully`);
      reset();
      setIsExpanded(false);
      if (onSuccess) onSuccess(data.data);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (data: QuickVendorFormData) => {
    createMutation.mutate(data);
  };

  if (!isExpanded && compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="w-full"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Quick Add Repair Shop
      </Button>
    );
  }

  return (
    <Card className={compact ? '' : 'max-w-2xl'}>
      <CardHeader>
        <CardTitle className="text-md flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Add Recommended Repair Shop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Company Name */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="name" className="text-xs">Company Name *</Label>
              <Input
                id="name"
                placeholder="ABC Truck Repair"
                className="h-9 text-sm"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                className="h-9 text-sm"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-1">
              <Label htmlFor="state" className="text-xs">State *</Label>
              <Select value={selectedState} onValueChange={(v) => setValue('state', v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-xs text-destructive">{errors.state.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs">City</Label>
              <Input
                id="city"
                placeholder="Dallas"
                className="h-9 text-sm"
                {...register('city')}
              />
            </div>

            {/* Hourly Rate */}
            <div className="space-y-1">
              <Label htmlFor="hourlyRate" className="text-xs">Hourly Rate (approx.)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                placeholder="125.00"
                className="h-9 text-sm"
                {...register('hourlyRate', { valueAsNumber: true })}
              />
              {errors.hourlyRate && (
                <p className="text-xs text-destructive">{errors.hourlyRate.message}</p>
              )}
            </div>

            {/* Specialties */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="specialties" className="text-xs">Specialties</Label>
              <Input
                id="specialties"
                placeholder="Engine, Transmission, Brakes"
                className="h-9 text-sm"
                {...register('specialties')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="notes" className="text-xs">Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Additional information, recommendations, or special instructions..."
                className="text-sm resize-none"
                {...register('notes')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            {compact && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset();
                  setIsExpanded(false);
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reset()}
              disabled={createMutation.isPending}
            >
              Clear
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Add Repair Shop
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

