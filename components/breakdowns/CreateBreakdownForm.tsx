'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createBreakdownSchema, CreateBreakdownInput } from '@/lib/validations/breakdown';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import SimilarCasesPanel from '@/components/breakdowns/SimilarCasesPanel';
import SolutionSuggestions from '@/components/breakdowns/SolutionSuggestions';

async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchLoads() {
  const response = await fetch(apiUrl('/api/loads?limit=1000&status=IN_TRANSIT&status=EN_ROUTE_PICKUP&status=LOADED&status=EN_ROUTE_DELIVERY'));
  if (!response.ok) throw new Error('Failed to fetch loads');
  return response.json();
}

async function createBreakdown(data: CreateBreakdownInput) {
  const response = await fetch(apiUrl('/api/breakdowns'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create breakdown');
  }
  return response.json();
}

export default function CreateBreakdownForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: trucksData } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
  });

  const { data: loadsData } = useQuery({
    queryKey: ['loads'],
    queryFn: fetchLoads,
  });

  const trucks = trucksData?.data || [];
  const drivers = driversData?.data || [];
  const loads = loadsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateBreakdownInput>({
    resolver: zodResolver(createBreakdownSchema) as any,
    defaultValues: {
      priority: 'MEDIUM' as const,
    },
  });

  const createMutation = useMutation({
    mutationFn: createBreakdown,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['breakdowns'] });
      toast.success('Breakdown created successfully');
      router.push(`/dashboard/breakdowns/${data.data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = async (data: CreateBreakdownInput) => {
    setError(null);
    createMutation.mutate(data as CreateBreakdownInput);
  };

  const description = watch('description');
  const problem = watch('problem');
  const truckId = watch('truckId');
  const breakdownType = watch('breakdownType');

  const handleUseSolution = (caseData: any) => {
    if (caseData.solution) {
      setValue('description', caseData.solution);
      toast.success('Solution copied to description');
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    if (suggestion.rootCause) {
      const enhancedDescription = `Root Cause: ${suggestion.rootCause}\n\nRecommended Steps:\n${suggestion.recommendedSteps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}`;
      setValue('description', enhancedDescription);
    }
    if (suggestion.urgencyLevel) {
      const priorityMap: any = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
      setValue('priority', priorityMap[suggestion.urgencyLevel] || 'MEDIUM');
    }
    toast.success('AI suggestions applied!');
  };

  return (
    <div className="flex gap-6">
      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/breakdowns">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Report Breakdown</h2>
            <p className="text-sm text-muted-foreground">
              Log a new truck breakdown or repair issue
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Breakdown details and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="truckId">Truck *</Label>
                <Select
                  onValueChange={(value) => setValue('truckId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck: any) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.truckNumber} - {truck.make} {truck.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.truckId && (
                  <p className="text-sm text-destructive">{errors.truckId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Driver</Label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setValue('driverId', undefined);
                    } else {
                      setValue('driverId', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user.firstName} {driver.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadId">Active Load</Label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setValue('loadId', undefined);
                    } else {
                      setValue('loadId', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a load (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {loads.map((load: any) => (
                      <SelectItem key={load.id} value={load.id}>
                        {load.loadNumber} - {load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breakdownType">Breakdown Type *</Label>
                <Select
                  onValueChange={(value) => setValue('breakdownType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select breakdown type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGINE_FAILURE">Engine Failure</SelectItem>
                    <SelectItem value="TRANSMISSION_FAILURE">Transmission Failure</SelectItem>
                    <SelectItem value="BRAKE_FAILURE">Brake Failure</SelectItem>
                    <SelectItem value="TIRE_FLAT">Tire Flat</SelectItem>
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
                {errors.breakdownType && (
                  <p className="text-sm text-destructive">{errors.breakdownType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem</Label>
                <Input
                  id="problem"
                  placeholder="e.g., air valve, engine shutdown"
                  {...register('problem')}
                />
                {errors.problem && (
                  <p className="text-sm text-destructive">{errors.problem.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemCategory">Problem Category</Label>
                <Input
                  id="problemCategory"
                  placeholder="e.g., TRUCK AIR LEAK, Engine and Power Issues"
                  {...register('problemCategory')}
                />
                {errors.problemCategory && (
                  <p className="text-sm text-destructive">{errors.problemCategory.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  onValueChange={(value) => setValue('priority', value as any)}
                  defaultValue="MEDIUM"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where the breakdown occurred</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., I-95 Exit 42, Rest Area"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  {...register('address')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    {...register('city')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    maxLength={2}
                    {...register('state')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="ZIP Code"
                  {...register('zip')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="odometerReading">Odometer Reading</Label>
                <Input
                  id="odometerReading"
                  type="number"
                  placeholder="Current mileage"
                  {...register('odometerReading', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Detailed description of the breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened, symptoms, and any immediate actions taken..."
                rows={5}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Provider (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Service Provider (Optional)</CardTitle>
            <CardDescription>If service has been arranged</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceProvider">Service Provider Name</Label>
              <Input
                id="serviceProvider"
                placeholder="Service provider or repair shop name"
                {...register('serviceProvider')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceContact">Contact Information</Label>
              <Input
                id="serviceContact"
                placeholder="Phone number or contact"
                {...register('serviceContact')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAddress">Service Address</Label>
              <Input
                id="serviceAddress"
                placeholder="Service provider address"
                {...register('serviceAddress')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/breakdowns">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Breakdown'}
          </Button>
        </div>
      </form>

      {/* AI Assistant Sidebar */}
      <div className="w-96 space-y-4 sticky top-4 h-fit">
        <SolutionSuggestions
          description={description || ''}
          problem={problem || undefined}
          truckId={truckId || undefined}
          breakdownType={breakdownType || undefined}
          onApplySuggestion={handleApplySuggestion}
        />
        <SimilarCasesPanel
          description={description || ''}
          truckId={truckId || undefined}
          breakdownType={breakdownType || undefined}
          onUseSolution={handleUseSolution}
        />
      </div>
    </div>
  );
}
