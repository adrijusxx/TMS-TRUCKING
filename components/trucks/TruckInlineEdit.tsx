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
import { TruckStatus, EquipmentType } from '@prisma/client';

interface TruckInlineEditProps {
  row: {
    id: string;
    truckNumber: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    state: string;
    equipmentType: string;
    status: TruckStatus;
    mcNumberId?: string | null;
    mcNumber?: { id: string; number: string } | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function updateTruck(truckId: string, data: any) {
  const response = await fetch(apiUrl(`/api/trucks/${truckId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update truck');
  }
  return response.json();
}

export default function TruckInlineEdit({ row, onSave, onCancel }: TruckInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      truckNumber: row.truckNumber || '',
      vin: row.vin || '',
      make: row.make || '',
      model: row.model || '',
      year: row.year || new Date().getFullYear(),
      licensePlate: row.licensePlate || '',
      state: row.state || '',
      equipmentType: row.equipmentType || 'DRY_VAN',
      status: row.status || 'AVAILABLE',
      mcNumberId: row.mcNumberId || row.mcNumber?.id || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTruck(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['truck', row.id] });
      toast.success('Truck updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update truck');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      truckNumber: data.truckNumber,
      vin: data.vin,
      make: data.make,
      model: data.model,
      year: parseInt(data.year),
      licensePlate: data.licensePlate,
      state: data.state,
      equipmentType: data.equipmentType as EquipmentType,
      status: data.status as TruckStatus,
      mcNumberId: data.mcNumberId || null,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truckNumber">Truck Number</Label>
              <Input id="truckNumber" {...register('truckNumber')} />
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
              <Label htmlFor="equipmentType">Equipment Type</Label>
              <Select
                value={watch('equipmentType')}
                onValueChange={(value) => setValue('equipmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                  <SelectItem value="REEFER">Reefer</SelectItem>
                  <SelectItem value="FLATBED">Flatbed</SelectItem>
                  <SelectItem value="STEP_DECK">Step Deck</SelectItem>
                  <SelectItem value="LOWBOY">Lowboy</SelectItem>
                  <SelectItem value="CONESTOGA">Conestoga</SelectItem>
                  <SelectItem value="DOUBLE_DROP">Double Drop</SelectItem>
                  <SelectItem value="POWER_ONLY">Power Only</SelectItem>
                  <SelectItem value="STRETCH_FLATBED">Stretch Flatbed</SelectItem>
                  <SelectItem value="CURTAIN_SIDE">Curtain Side</SelectItem>
                  <SelectItem value="TANKER">Tanker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as TruckStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
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

