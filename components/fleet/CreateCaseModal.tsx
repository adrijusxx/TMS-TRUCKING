'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Truck, Loader2, X } from 'lucide-react';
import { cn, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

const inlineCaseSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  location: z.string().min(1, 'Location is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  breakdownType: z.enum([
    'ENGINE_FAILURE', 'TRANSMISSION_FAILURE', 'BRAKE_FAILURE', 'TIRE_FLAT',
    'TIRE_BLOWOUT', 'ELECTRICAL_ISSUE', 'COOLING_SYSTEM', 'FUEL_SYSTEM',
    'SUSPENSION', 'ACCIDENT_DAMAGE', 'WEATHER_RELATED', 'OTHER',
  ]),
  description: z.string().min(1, 'Description is required'),
});

type InlineCaseFormData = z.infer<typeof inlineCaseSchema>;

interface CreateCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function searchTrucks(query: string) {
  const response = await fetch(apiUrl(`/api/trucks?search=${encodeURIComponent(query)}&limit=10`));
  if (!response.ok) throw new Error('Failed to search trucks');
  const data = await response.json();
  return data.data || [];
}

async function createBreakdown(data: InlineCaseFormData) {
  const response = await fetch(apiUrl('/api/breakdowns'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create case');
  }
  return response.json();
}

export default function CreateCaseModal({ open, onOpenChange }: CreateCaseModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [truckSearchOpen, setTruckSearchOpen] = useState(false);
  const [truckSearchQuery, setTruckSearchQuery] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<InlineCaseFormData>({
    resolver: zodResolver(inlineCaseSchema),
    defaultValues: { priority: 'MEDIUM', breakdownType: 'OTHER' },
  });

  const selectedTruckId = watch('truckId');

  const { data: trucksData } = useQuery({
    queryKey: ['truckSearch', truckSearchQuery],
    queryFn: () => searchTrucks(truckSearchQuery),
    enabled: truckSearchOpen,
  });

  const trucks = trucksData || [];
  const selectedTruck = trucks.find((t: any) => t.id === selectedTruckId);

  const createMutation = useMutation({
    mutationFn: createBreakdown,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-count'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-metrics-summary'] });
      toast.success(`Case ${data.data.breakdownNumber} created successfully`);
      reset();
      onOpenChange(false);
      // Don't navigate - let user continue on dashboard
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (data: InlineCaseFormData) => createMutation.mutate(data);

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Breakdown Case</DialogTitle>
          <DialogDescription>
            Report a new vehicle breakdown case. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Truck Selection */}
            <div className="space-y-2">
              <Label>Truck *</Label>
              <Popover open={truckSearchOpen} onOpenChange={setTruckSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedTruck ? `#${selectedTruck.truckNumber} - ${selectedTruck.make}` : 'Select truck...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search trucks..." value={truckSearchQuery} onValueChange={setTruckSearchQuery} />
                    <CommandList>
                      <CommandEmpty>No trucks found.</CommandEmpty>
                      <CommandGroup>
                        {trucks.map((truck: any) => (
                          <CommandItem 
                            key={truck.id} 
                            value={truck.id} 
                            onSelect={() => { 
                              setValue('truckId', truck.id); 
                              setTruckSearchOpen(false); 
                              setTruckSearchQuery(''); 
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedTruckId === truck.id ? 'opacity-100' : 'opacity-0')} />
                            <Truck className="mr-2 h-4 w-4" />
                            #{truck.truckNumber} - {truck.make} {truck.model}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.truckId && <p className="text-sm text-destructive">{errors.truckId.message}</p>}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select defaultValue="MEDIUM" onValueChange={(v) => setValue('priority', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                  <SelectItem value="HIGH">🟡 High</SelectItem>
                  <SelectItem value="MEDIUM">🟢 Medium</SelectItem>
                  <SelectItem value="LOW">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Breakdown Type *</Label>
              <Select defaultValue="OTHER" onValueChange={(v) => setValue('breakdownType', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENGINE_FAILURE">Engine Failure</SelectItem>
                  <SelectItem value="TRANSMISSION_FAILURE">Transmission Failure</SelectItem>
                  <SelectItem value="BRAKE_FAILURE">Brake Failure</SelectItem>
                  <SelectItem value="TIRE_FLAT">Flat Tire</SelectItem>
                  <SelectItem value="TIRE_BLOWOUT">Tire Blowout</SelectItem>
                  <SelectItem value="ELECTRICAL_ISSUE">Electrical Issue</SelectItem>
                  <SelectItem value="COOLING_SYSTEM">Cooling System</SelectItem>
                  <SelectItem value="FUEL_SYSTEM">Fuel System</SelectItem>
                  <SelectItem value="SUSPENSION">Suspension</SelectItem>
                  <SelectItem value="ACCIDENT_DAMAGE">Accident Damage</SelectItem>
                  <SelectItem value="WEATHER_RELATED">Weather Related</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input placeholder="I-80, MM 145" {...register('location')} />
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea 
              placeholder="Brief description of the issue..." 
              rows={4} 
              {...register('description')} 
              className="resize-none"
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Case'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}










