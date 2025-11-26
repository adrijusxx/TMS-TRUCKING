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
import LoadDocumentWarnings from './LoadDocumentWarnings';

interface LoadInlineEditProps {
  row: {
    id: string;
    loadNumber: string;
    status: string;
    customerId?: string | null;
    customer?: { id: string; name: string } | null;
    driverId?: string | null;
    driver?: { id: string; driverNumber: string } | null;
    truckId?: string | null;
    truck?: { id: string; truckNumber: string } | null;
    trailerId?: string | null;
    trailer?: { id: string; trailerNumber: string } | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    revenue?: number | null;
    totalMiles?: number | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  const result = await response.json();
  // Ensure we always return an array
  return Array.isArray(result.data) ? result.data : [];
}

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  const result = await response.json();
  // Ensure we always return an array
  return Array.isArray(result.data) ? result.data : [];
}

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  const result = await response.json();
  // Ensure we always return an array
  return Array.isArray(result.data) ? result.data : [];
}

async function fetchTrailers() {
  const response = await fetch(apiUrl('/api/trailers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trailers');
  const result = await response.json();
  // Ensure we always return an array
  return Array.isArray(result.data) ? result.data : [];
}

async function updateLoad(loadId: string, data: any) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
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

export default function LoadInlineEdit({ row, onSave, onCancel }: LoadInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
  });

  const { data: trucksData } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });

  const { data: trailersData } = useQuery({
    queryKey: ['trailers'],
    queryFn: fetchTrailers,
  });

  // Ensure all data is always an array
  const customers = Array.isArray(customersData) ? customersData : [];
  const drivers = Array.isArray(driversData) ? driversData : [];
  const trucks = Array.isArray(trucksData) ? trucksData : [];
  const trailers = Array.isArray(trailersData) ? trailersData : [];

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      customerId: row.customerId || row.customer?.id || '',
      driverId: row.driverId || row.driver?.id || '',
      truckId: row.truckId || row.truck?.id || '',
      trailerId: row.trailerId || row.trailer?.id || '',
      status: row.status || 'PENDING',
      pickupCity: row.pickupCity || '',
      pickupState: row.pickupState || '',
      deliveryCity: row.deliveryCity || '',
      deliveryState: row.deliveryState || '',
      revenue: row.revenue || 0,
      totalMiles: row.totalMiles || 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLoad(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load', row.id] });
      toast.success('Load updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update load');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      customerId: data.customerId && data.customerId !== 'none' ? data.customerId : null,
      driverId: data.driverId && data.driverId !== 'none' ? data.driverId : null,
      truckId: data.truckId && data.truckId !== 'none' ? data.truckId : null,
      trailerId: data.trailerId && data.trailerId !== 'none' ? data.trailerId : null,
      status: data.status,
      pickupCity: data.pickupCity || null,
      pickupState: data.pickupState || null,
      deliveryCity: data.deliveryCity || null,
      deliveryState: data.deliveryState || null,
      revenue: data.revenue ? parseFloat(data.revenue) : null,
      totalMiles: data.totalMiles ? parseFloat(data.totalMiles) : null,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="EN_ROUTE_PICKUP">En Route Pickup</SelectItem>
                  <SelectItem value="AT_PICKUP">At Pickup</SelectItem>
                  <SelectItem value="LOADED">Loaded</SelectItem>
                  <SelectItem value="EN_ROUTE_DELIVERY">En Route Delivery</SelectItem>
                  <SelectItem value="AT_DELIVERY">At Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="INVOICED">Invoiced</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                value={watch('customerId') || 'none'}
                onValueChange={(value) => setValue('customerId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverId">Driver</Label>
              <Select
                value={watch('driverId') || 'none'}
                onValueChange={(value) => setValue('driverId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.driverNumber} - {driver.firstName} {driver.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="truckId">Truck</Label>
              <Select
                value={watch('truckId') || 'none'}
                onValueChange={(value) => setValue('truckId', value === 'none' ? '' : value)}
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
            <div className="space-y-2">
              <Label htmlFor="trailerId">Trailer</Label>
              <Select
                value={watch('trailerId') || 'none'}
                onValueChange={(value) => setValue('trailerId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trailer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {trailers.map((trailer: any) => (
                    <SelectItem key={trailer.id} value={trailer.id}>
                      {trailer.trailerNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupCity">Pickup City</Label>
              <Input id="pickupCity" {...register('pickupCity')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupState">Pickup State</Label>
              <Input id="pickupState" maxLength={2} {...register('pickupState')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryCity">Delivery City</Label>
              <Input id="deliveryCity" {...register('deliveryCity')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryState">Delivery State</Label>
              <Input id="deliveryState" maxLength={2} {...register('deliveryState')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue</Label>
              <Input id="revenue" type="number" step="0.01" {...register('revenue')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMiles">Total Miles</Label>
              <Input id="totalMiles" type="number" step="0.1" {...register('totalMiles')} />
            </div>
          </div>

          {/* Document Warnings and Upload */}
          <div className="pt-4 border-t">
            <LoadDocumentWarnings loadId={row.id} loadNumber={row.loadNumber} />
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




