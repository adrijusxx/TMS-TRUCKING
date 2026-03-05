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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquipmentType } from '@prisma/client';
import { ArrowLeft, Truck, FileText } from 'lucide-react';
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
    register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch,
  } = useForm<CreateTruckInput>({
    resolver: zodResolver(createTruckSchema) as any,
    defaultValues: { odometerReading: 0, eldInstalled: false, gpsInstalled: false, equipmentType: 'DRY_VAN' },
  });

  const mcNumberId = watch('mcNumberId');

  const createMutation = useMutation({
    mutationFn: createTruck,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      if (onSuccess) onSuccess(data.data.id);
      else router.push(`/dashboard/trucks/${data.data.truckNumber || data.data.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  const onSubmit = (data: CreateTruckInput) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onCancel ? (
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          ) : (
            <Link href="/dashboard/trucks"><Button type="button" variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          )}
          <div>
            <h2 className="text-2xl font-semibold">Create Truck</h2>
            <p className="text-sm text-muted-foreground">Add a new truck to your fleet</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          ) : (
            <Link href="/dashboard/trucks"><Button type="button" variant="outline">Cancel</Button></Link>
          )}
          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || createMutation.isPending}>
            {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Truck'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">{error}</div>
      )}

      <Tabs defaultValue="details">
        <TabsList className="w-full flex bg-muted/50 p-1 h-auto">
          <TabsTrigger value="details" className="flex-1 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Truck className="h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex-1 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" /> Registration & Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Truck identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="truckNumber">Truck Number *</Label>
                  <Input id="truckNumber" placeholder="T-101" {...register('truckNumber')} />
                  {errors.truckNumber && <p className="text-sm text-destructive">{errors.truckNumber.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN *</Label>
                  <Input id="vin" placeholder="1HGBH41JXMN109186" {...register('vin')} />
                  {errors.vin && <p className="text-sm text-destructive">{errors.vin.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make *</Label>
                    <Input id="make" placeholder="Freightliner" {...register('make')} />
                    {errors.make && <p className="text-sm text-destructive">{errors.make.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input id="model" placeholder="Cascadia" {...register('model')} />
                    {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input id="year" type="number" placeholder="2022" {...register('year', { valueAsNumber: true })} />
                  {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">License Plate *</Label>
                    <Input id="licensePlate" placeholder="TX-ABC123" {...register('licensePlate')} />
                    {errors.licensePlate && <p className="text-sm text-destructive">{errors.licensePlate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" placeholder="TX" maxLength={2} {...register('state')} />
                    {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                  </div>
                </div>
                <McNumberSelector
                  value={mcNumberId}
                  onValueChange={(v) => setValue('mcNumberId', v, { shouldValidate: true })}
                  required
                  error={errors.mcNumberId?.message}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Equipment and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Equipment Type *</Label>
                  <Select onValueChange={(v) => setValue('equipmentType', v as EquipmentType, { shouldValidate: true })} defaultValue="DRY_VAN" value={watch('equipmentType')}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (lbs) *</Label>
                  <Input id="capacity" type="number" placeholder="45000" {...register('capacity', { valueAsNumber: true })} />
                  {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometerReading">Current Odometer (miles)</Label>
                  <Input id="odometerReading" type="number" placeholder="0" {...register('odometerReading', { valueAsNumber: true })} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="eldInstalled" {...register('eldInstalled')} className="rounded border-gray-300" />
                    <Label htmlFor="eldInstalled" className="cursor-pointer">ELD Installed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="gpsInstalled" {...register('gpsInstalled')} className="rounded border-gray-300" />
                    <Label htmlFor="gpsInstalled" className="cursor-pointer">GPS Installed</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration & Insurance</CardTitle>
              <CardDescription>Expiry dates and compliance information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationExpiry">Registration Expiry *</Label>
                  <Input id="registrationExpiry" type="date" {...register('registrationExpiry', { setValueAs: (v) => v || undefined })} />
                  {errors.registrationExpiry && <p className="text-sm text-destructive">{errors.registrationExpiry.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Insurance Expiry *</Label>
                  <Input id="insuranceExpiry" type="date" {...register('insuranceExpiry', { setValueAs: (v) => v || undefined })} />
                  {errors.insuranceExpiry && <p className="text-sm text-destructive">{errors.insuranceExpiry.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspectionExpiry">Inspection Expiry *</Label>
                  <Input id="inspectionExpiry" type="date" {...register('inspectionExpiry', { setValueAs: (v) => v || undefined })} />
                  {errors.inspectionExpiry && <p className="text-sm text-destructive">{errors.inspectionExpiry.message}</p>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Documents can be uploaded after creating the truck.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
