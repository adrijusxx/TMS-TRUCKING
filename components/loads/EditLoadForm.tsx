'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLoadSchema, type UpdateLoadInput } from '@/lib/validations/load';
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
import { LoadType, EquipmentType } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoadStopsDisplay from './LoadStopsDisplay';

async function fetchCustomers() {
  const response = await fetch('/api/customers');
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

async function fetchLoad(loadId: string) {
  const response = await fetch(`/api/loads/${loadId}`);
  if (!response.ok) throw new Error('Failed to fetch load');
  return response.json();
}

async function updateLoad(loadId: string, data: UpdateLoadInput) {
  const response = await fetch(`/api/loads/${loadId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update load');
  }
  return response.json();
}

interface EditLoadFormProps {
  loadId: string;
  initialData: any;
}

export default function EditLoadForm({ loadId, initialData }: EditLoadFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: loadData } = useQuery({
    queryKey: ['load', loadId],
    queryFn: () => fetchLoad(loadId),
    initialData: { success: true, data: initialData },
  });

  const customers = customersData?.data || [];
  const load = loadData?.data || initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UpdateLoadInput>({
    resolver: zodResolver(updateLoadSchema),
    defaultValues: {},
  });

  // Populate form when load data is available
  useEffect(() => {
    if (load) {
      if (load.loadNumber) setValue('loadNumber', load.loadNumber);
      if (load.customerId) setValue('customerId', load.customerId);
      if (load.loadType) setValue('loadType', load.loadType as LoadType);
      if (load.equipmentType) setValue('equipmentType', load.equipmentType as EquipmentType);
      if (load.weight) setValue('weight', load.weight);
      if (load.pieces) setValue('pieces', load.pieces);
      if (load.commodity) setValue('commodity', load.commodity);
      if (load.pallets) setValue('pallets', load.pallets);
      if (load.temperature) setValue('temperature', load.temperature);
      if (load.hazmat !== undefined) setValue('hazmat', load.hazmat);
      if (load.hazmatClass) setValue('hazmatClass', load.hazmatClass);
      if (load.revenue) setValue('revenue', load.revenue);
      if (load.driverPay !== undefined) setValue('driverPay', load.driverPay);
      if (load.fuelAdvance !== undefined) setValue('fuelAdvance', load.fuelAdvance);
      if (load.totalMiles) setValue('totalMiles', load.totalMiles);
      if (load.loadedMiles) setValue('loadedMiles', load.loadedMiles);
      if (load.emptyMiles) setValue('emptyMiles', load.emptyMiles);
      if (load.trailerNumber) setValue('trailerNumber', load.trailerNumber);
      if (load.dispatchNotes) setValue('dispatchNotes', load.dispatchNotes);
      
      // Location fields
      if (load.pickupLocation) setValue('pickupLocation', load.pickupLocation);
      if (load.pickupAddress) setValue('pickupAddress', load.pickupAddress);
      if (load.pickupCity) setValue('pickupCity', load.pickupCity);
      if (load.pickupState) setValue('pickupState', load.pickupState);
      if (load.pickupZip) setValue('pickupZip', load.pickupZip);
      if (load.pickupDate) {
        const date = new Date(load.pickupDate);
        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        setValue('pickupDate', formatted);
      }
      if (load.deliveryLocation) setValue('deliveryLocation', load.deliveryLocation);
      if (load.deliveryAddress) setValue('deliveryAddress', load.deliveryAddress);
      if (load.deliveryCity) setValue('deliveryCity', load.deliveryCity);
      if (load.deliveryState) setValue('deliveryState', load.deliveryState);
      if (load.deliveryZip) setValue('deliveryZip', load.deliveryZip);
      if (load.deliveryDate) {
        const date = new Date(load.deliveryDate);
        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        setValue('deliveryDate', formatted);
      }
      
      // Stops
      if (load.stops && load.stops.length > 0) {
        const stopsFormatted = load.stops.map((stop: any) => ({
          stopType: stop.stopType,
          sequence: stop.sequence,
          company: stop.company || '',
          address: stop.address,
          city: stop.city,
          state: stop.state,
          zip: stop.zip,
          phone: stop.phone || '',
          earliestArrival: stop.earliestArrival ? new Date(stop.earliestArrival).toISOString() : undefined,
          latestArrival: stop.latestArrival ? new Date(stop.latestArrival).toISOString() : undefined,
          contactName: stop.contactName || '',
          contactPhone: stop.contactPhone || '',
          items: stop.items || undefined,
          totalPieces: stop.totalPieces || undefined,
          totalWeight: stop.totalWeight || undefined,
          notes: stop.notes || '',
          specialInstructions: stop.specialInstructions || '',
        }));
        setValue('stops', stopsFormatted);
      }
    }
  }, [load, setValue]);

  const stops = watch('stops');
  const isMultiStop = stops && Array.isArray(stops) && stops.length > 0;

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLoadInput) => updateLoad(loadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      router.push(`/dashboard/loads/${loadId}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: UpdateLoadInput) => {
    setError(null);
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/loads/${loadId}`}>
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Load Information</h2>
            <p className="text-sm text-muted-foreground">
              Update load details
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isMultiStop && stops && (
          <Card>
            <CardHeader>
              <CardTitle>Multi-Stop Load ({stops.length} stops)</CardTitle>
              <CardDescription>
                This load has multiple stops. Review the stops below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoadStopsDisplay stops={stops} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Load number and customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loadNumber">Load Number *</Label>
                <Input
                  id="loadNumber"
                  placeholder="LOAD-2024-001"
                  {...register('loadNumber')}
                />
                {errors.loadNumber && (
                  <p className="text-sm text-destructive">
                    {errors.loadNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select
                  value={watch('customerId') || ''}
                  onValueChange={(value) => setValue('customerId', value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-destructive">
                    {errors.customerId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loadType">Load Type</Label>
                  <Select
                    value={watch('loadType') || 'FTL'}
                    onValueChange={(value) =>
                      setValue('loadType', value as LoadType, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FTL">Full Truckload</SelectItem>
                      <SelectItem value="LTL">Less Than Truckload</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="INTERMODAL">Intermodal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Equipment Type</Label>
                  <Select
                    value={watch('equipmentType') || 'DRY_VAN'}
                    onValueChange={(value) =>
                      setValue('equipmentType', value as EquipmentType, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EquipmentType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pickup Information - only show if not multi-stop */}
          {!isMultiStop && (
            <Card>
              <CardHeader>
                <CardTitle>Pickup Information</CardTitle>
                <CardDescription>Pickup details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">Location Name</Label>
                  <Input
                    id="pickupLocation"
                    placeholder="ABC Warehouse"
                    {...register('pickupLocation')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupAddress">Address</Label>
                  <Input
                    id="pickupAddress"
                    placeholder="123 Main St"
                    {...register('pickupAddress')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupCity">City</Label>
                    <Input
                      id="pickupCity"
                      placeholder="Dallas"
                      {...register('pickupCity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickupState">State</Label>
                    <Input
                      id="pickupState"
                      placeholder="TX"
                      maxLength={2}
                      {...register('pickupState')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupZip">ZIP</Label>
                  <Input
                    id="pickupZip"
                    placeholder="75001"
                    {...register('pickupZip')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupDate">Pickup Date</Label>
                  <Input
                    id="pickupDate"
                    type="datetime-local"
                    {...register('pickupDate')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Information - only show if not multi-stop */}
          {!isMultiStop && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                <CardDescription>Delivery details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryLocation">Location Name</Label>
                  <Input
                    id="deliveryLocation"
                    placeholder="XYZ Distribution"
                    {...register('deliveryLocation')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Address</Label>
                  <Input
                    id="deliveryAddress"
                    placeholder="456 Delivery Ave"
                    {...register('deliveryAddress')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryCity">City</Label>
                    <Input
                      id="deliveryCity"
                      placeholder="Houston"
                      {...register('deliveryCity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryState">State</Label>
                    <Input
                      id="deliveryState"
                      placeholder="TX"
                      maxLength={2}
                      {...register('deliveryState')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryZip">ZIP</Label>
                  <Input
                    id="deliveryZip"
                    placeholder="77001"
                    {...register('deliveryZip')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="datetime-local"
                    {...register('deliveryDate')}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Load Details & Financial */}
        <Card>
          <CardHeader>
            <CardTitle>Load Details & Financial</CardTitle>
            <CardDescription>Specifications and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="45000"
                  {...register('weight', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pieces">Pieces</Label>
                <Input
                  id="pieces"
                  type="number"
                  placeholder="20"
                  {...register('pieces', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commodity">Commodity</Label>
              <Input
                id="commodity"
                placeholder="Electronics"
                {...register('commodity')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  {...register('revenue', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPay">Driver Pay ($)</Label>
                <Input
                  id="driverPay"
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  {...register('driverPay', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelAdvance">Fuel Advance ($)</Label>
                <Input
                  id="fuelAdvance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('fuelAdvance', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMiles">Total Miles</Label>
                <Input
                  id="totalMiles"
                  type="number"
                  step="0.1"
                  placeholder="1200.5"
                  {...register('totalMiles', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loadedMiles">Loaded Miles</Label>
                <Input
                  id="loadedMiles"
                  type="number"
                  step="0.1"
                  placeholder="1000.0"
                  {...register('loadedMiles', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trailerNumber">Trailer Number</Label>
                <Input
                  id="trailerNumber"
                  placeholder="TRL-001"
                  {...register('trailerNumber')}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hazmat"
                {...register('hazmat')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="hazmat">Hazmat Load</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchNotes">Dispatch Notes</Label>
              <textarea
                id="dispatchNotes"
                rows={3}
                placeholder="Any special instructions for dispatch..."
                {...register('dispatchNotes')}
                className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error message at bottom before submit buttons */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/loads/${loadId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
          >
            {isSubmitting || updateMutation.isPending
              ? 'Updating...'
              : 'Update Load'}
          </Button>
        </div>
      </form>
    </div>
  );
}
