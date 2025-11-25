'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface TrailerInlineEditProps {
  row: {
    id: string;
    trailerNumber: string;
    vin: string | null;
    make: string;
    model: string;
    year: number | null;
    licensePlate: string | null;
    state: string | null;
    type: string | null;
    status: string | null;
    fleetStatus: string | null;
    mcNumberId?: string | null;
    mcNumber?: { id: string; number: string } | null;
    assignedTruckId?: string | null;
    assignedTruck?: { id: string; truckNumber: string } | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  const result = await response.json();
  return result.data || [];
}

async function updateTrailer(trailerId: string, data: any) {
  const response = await fetch(apiUrl(`/api/trailers/${trailerId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update trailer');
  }
  return response.json();
}

export default function TrailerInlineEdit({ row, onSave, onCancel }: TrailerInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: trucks = [] } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      trailerNumber: row.trailerNumber || '',
      vin: row.vin || '',
      make: row.make || '',
      model: row.model || '',
      year: row.year || new Date().getFullYear(),
      licensePlate: row.licensePlate || '',
      state: row.state || '',
      type: row.type || '',
      status: row.status || 'AVAILABLE',
      fleetStatus: row.fleetStatus || 'ACTIVE',
      mcNumberId: row.mcNumberId || row.mcNumber?.id || '',
      assignedTruckId: row.assignedTruckId || row.assignedTruck?.id || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTrailer(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      queryClient.invalidateQueries({ queryKey: ['trailer', row.id] });
      toast.success('Trailer updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update trailer');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      trailerNumber: data.trailerNumber,
      vin: data.vin || null,
      make: data.make,
      model: data.model,
      year: data.year ? parseInt(data.year) : null,
      licensePlate: data.licensePlate || null,
      state: data.state || null,
      type: data.type || null,
      status: data.status || null,
      fleetStatus: data.fleetStatus || null,
      mcNumberId: data.mcNumberId || null,
      assignedTruckId: data.assignedTruckId && data.assignedTruckId !== 'none' ? data.assignedTruckId : null,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trailerNumber">Trailer Number</Label>
              <Input id="trailerNumber" {...register('trailerNumber')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" {...register('vin')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" {...register('make')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register('model')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" {...register('year')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input id="licensePlate" {...register('licensePlate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" maxLength={2} {...register('state')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" {...register('type')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status') || 'none'}
                onValueChange={(value) => setValue('status', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fleetStatus">Fleet Status</Label>
              <Select
                value={watch('fleetStatus') || 'none'}
                onValueChange={(value) => setValue('fleetStatus', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcNumberId">MC Number</Label>
              <McNumberSelector
                value={watch('mcNumberId') || ''}
                onValueChange={(value) => setValue('mcNumberId', value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTruckId">Assigned Truck</Label>
              <Select
                value={watch('assignedTruckId') || 'none'}
                onValueChange={(value) => setValue('assignedTruckId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {trucks.map((truck: any) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truckNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving || updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




