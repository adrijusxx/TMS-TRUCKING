'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTruckSchema, type CreateTruckInput } from '@/lib/validations/truck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipmentType } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

async function createTruck(data: CreateTruckInput) {
  const response = await fetch(apiUrl('/api/trucks'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create truck');
  }
  return response.json();
}

interface CreateTruckFormProps {
  onSuccess?: (truckId: string) => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateTruckForm({
  onSuccess,
  onCancel,
  isSheet = false,
}: CreateTruckFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateTruckInput>({
    resolver: zodResolver(createTruckSchema) as any,
    defaultValues: {
      odometerReading: 0,
      eldInstalled: false,
      gpsInstalled: false,
      equipmentType: 'DRY_VAN',
    },
  });

  const mcNumberId = watch('mcNumberId');

  const createMutation = useMutation({
    mutationFn: createTruck,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        router.push(`/dashboard/trucks/${data.data.id}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: CreateTruckInput) => {
    setError(null);
    try {
      createMutation.mutate(data);
    } catch (err) {
      // Error is handled by onError callback
      console.error('Form submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        {onCancel ? (
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Link href="/dashboard/trucks">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h2 className="text-2xl font-semibold">Truck Information</h2>
          <p className="text-sm text-muted-foreground">
            Add a new truck to your fleet
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          <p className="font-semibold mb-1">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.truckNumber && <li>Truck Number: {errors.truckNumber.message}</li>}
            {errors.vin && <li>VIN: {errors.vin.message}</li>}
            {errors.make && <li>Make: {errors.make.message}</li>}
            {errors.model && <li>Model: {errors.model.message}</li>}
            {errors.year && <li>Year: {errors.year.message}</li>}
            {errors.licensePlate && <li>License Plate: {errors.licensePlate.message}</li>}
            {errors.state && <li>State: {errors.state.message}</li>}
            {errors.equipmentType && <li>Equipment Type: {errors.equipmentType.message}</li>}
            {errors.capacity && <li>Capacity: {errors.capacity.message}</li>}
            {errors.registrationExpiry && <li>Registration Expiry: {errors.registrationExpiry.message}</li>}
            {errors.insuranceExpiry && <li>Insurance Expiry: {errors.insuranceExpiry.message}</li>}
            {errors.inspectionExpiry && <li>Inspection Expiry: {errors.inspectionExpiry.message}</li>}
            {errors.mcNumberId && <li>MC Number: {errors.mcNumberId.message}</li>}
          </ul>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Truck identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="truckNumber">Truck Number *</Label>
              <Input
                id="truckNumber"
                placeholder="T-101"
                {...register('truckNumber')}
              />
              {errors.truckNumber && (
                <p className="text-sm text-destructive">
                  {errors.truckNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <Input
                id="vin"
                placeholder="1HGBH41JXMN109186"
                {...register('vin')}
              />
              {errors.vin && (
                <p className="text-sm text-destructive">
                  {errors.vin.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="Freightliner"
                  {...register('make')}
                />
                {errors.make && (
                  <p className="text-sm text-destructive">
                    {errors.make.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="Cascadia"
                  {...register('model')}
                />
                {errors.model && (
                  <p className="text-sm text-destructive">
                    {errors.model.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                placeholder="2022"
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="text-sm text-destructive">
                  {errors.year.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  placeholder="TX-ABC123"
                  {...register('licensePlate')}
                />
                {errors.licensePlate && (
                  <p className="text-sm text-destructive">
                    {errors.licensePlate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  maxLength={2}
                  {...register('state')}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">
                    {errors.state.message}
                  </p>
                )}
              </div>
            </div>

            <McNumberSelector
              value={mcNumberId}
              onValueChange={(mcNumberId) => setValue('mcNumberId', mcNumberId, { shouldValidate: true })}
              required
              error={errors.mcNumberId?.message}
            />
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Truck specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentType">Equipment Type *</Label>
              <Select
                onValueChange={(value) =>
                  setValue('equipmentType', value as EquipmentType, { shouldValidate: true })
                }
                defaultValue="DRY_VAN"
                value={watch('equipmentType')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                  <SelectItem value="REEFER">Reefer</SelectItem>
                  <SelectItem value="FLATBED">Flatbed</SelectItem>
                  <SelectItem value="STEP_DECK">Step Deck</SelectItem>
                  <SelectItem value="LOWBOY">Lowboy</SelectItem>
                  <SelectItem value="TANKER">Tanker</SelectItem>
                  <SelectItem value="CONESTOGA">Conestoga</SelectItem>
                  <SelectItem value="POWER_ONLY">Power Only</SelectItem>
                  <SelectItem value="HOTSHOT">Hotshot</SelectItem>
                </SelectContent>
              </Select>
              {errors.equipmentType && (
                <p className="text-sm text-destructive">
                  {errors.equipmentType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (lbs) *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="45000"
                {...register('capacity', { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometerReading">Current Odometer (miles)</Label>
              <Input
                id="odometerReading"
                type="number"
                placeholder="0"
                {...register('odometerReading', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="eldInstalled"
                  {...register('eldInstalled')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="eldInstalled" className="cursor-pointer">
                  ELD Installed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="gpsInstalled"
                  {...register('gpsInstalled')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="gpsInstalled" className="cursor-pointer">
                  GPS Installed
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration & Insurance */}
        <Card>
          <CardHeader>
            <CardTitle>Registration & Insurance</CardTitle>
            <CardDescription>Expiry dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registrationExpiry">Registration Expiry *</Label>
              <Input
                id="registrationExpiry"
                type="date"
                {...register('registrationExpiry', {
                  setValueAs: (value) => value || undefined,
                })}
              />
              {errors.registrationExpiry && (
                <p className="text-sm text-destructive">
                  {errors.registrationExpiry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">Insurance Expiry *</Label>
              <Input
                id="insuranceExpiry"
                type="date"
                {...register('insuranceExpiry', {
                  setValueAs: (value) => value || undefined,
                })}
              />
              {errors.insuranceExpiry && (
                <p className="text-sm text-destructive">
                  {errors.insuranceExpiry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspectionExpiry">Inspection Expiry *</Label>
              <Input
                id="inspectionExpiry"
                type="date"
                {...register('inspectionExpiry', {
                  setValueAs: (value) => value || undefined,
                })}
              />
              {errors.inspectionExpiry && (
                <p className="text-sm text-destructive">
                  {errors.inspectionExpiry.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Link href="/dashboard/trucks">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        )}
        <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
          {isSubmitting || createMutation.isPending
            ? 'Creating...'
            : 'Create Truck'}
        </Button>
      </div>
    </form>
  );
}

