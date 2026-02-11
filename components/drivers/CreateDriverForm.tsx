'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createDriverSchema, type CreateDriverInput } from '@/lib/validations/driver';
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
import { PayType } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

async function createDriver(data: CreateDriverInput) {
  const response = await fetch(apiUrl('/api/drivers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create driver');
  }
  return response.json();
}

interface CreateDriverFormProps {
  onSuccess?: (driverId: string) => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateDriverForm({
  onSuccess,
  onCancel,
  isSheet = false,
}: CreateDriverFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateDriverInput>({
    resolver: zodResolver(createDriverSchema),
    defaultValues: {
      payType: 'PER_MILE',
    },
  });

  const mcNumberId = watch('mcNumberId');

  const createMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver created successfully');
      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        router.push(`/dashboard/drivers/${data.data.id}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message || 'Failed to create driver');
    },
  });

  const onSubmit = async (data: CreateDriverInput) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        {onCancel ? (
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Link href="/dashboard/drivers">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h2 className="text-2xl font-semibold">Driver Information</h2>
          <p className="text-sm text-muted-foreground">
            Create a new driver account
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Driver's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="555-0100"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Driver Details */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Details</CardTitle>
            <CardDescription>Driver number and license information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverNumber">Driver Number *</Label>
              <Input
                id="driverNumber"
                placeholder="D-001"
                {...register('driverNumber')}
              />
              {errors.driverNumber && (
                <p className="text-sm text-destructive">
                  {errors.driverNumber.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  placeholder="TX-123456"
                  {...register('licenseNumber')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseState">License State *</Label>
                <Input
                  id="licenseState"
                  placeholder="TX"
                  maxLength={2}
                  {...register('licenseState')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">License Expiry *</Label>
              <Input
                id="licenseExpiry"
                type="date"
                {...register('licenseExpiry')}
              />
              {errors.licenseExpiry && (
                <p className="text-sm text-destructive">
                  {errors.licenseExpiry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalCardExpiry">Medical Card Expiry *</Label>
              <Input
                id="medicalCardExpiry"
                type="date"
                {...register('medicalCardExpiry')}
              />
              {errors.medicalCardExpiry && (
                <p className="text-sm text-destructive">
                  {errors.medicalCardExpiry.message}
                </p>
              )}
            </div>

            <McNumberSelector
              value={mcNumberId}
              onValueChange={(mcNumberId) => setValue('mcNumberId', mcNumberId, { shouldValidate: true })}
              required
              error={errors.mcNumberId?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drugTestDate">Drug Test Date</Label>
                <Input
                  id="drugTestDate"
                  type="date"
                  {...register('drugTestDate')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundCheck">Background Check</Label>
                <Input
                  id="backgroundCheck"
                  type="date"
                  {...register('backgroundCheck')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pay & Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Pay & Contact</CardTitle>
            <CardDescription>Compensation and emergency contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payType">Pay Type *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('payType', value as PayType)
                  }
                  defaultValue="PER_MILE"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_MILE">Per Mile</SelectItem>
                    <SelectItem value="PER_LOAD">Per Load</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payRate">Pay Rate *</Label>
                <Input
                  id="payRate"
                  type="number"
                  step="0.01"
                  placeholder="0.50"
                  {...register('payRate', { valueAsNumber: true })}
                />
                {errors.payRate && (
                  <p className="text-sm text-destructive">
                    {errors.payRate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeTerminal">Home Terminal</Label>
              <Input
                id="homeTerminal"
                placeholder="Dallas, TX"
                {...register('homeTerminal')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <Input
                id="emergencyContact"
                placeholder="Jane Doe"
                {...register('emergencyContact')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                placeholder="555-9999"
                {...register('emergencyPhone')}
              />
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
          <Link href="/dashboard/drivers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        )}
        <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
          {isSubmitting || createMutation.isPending
            ? 'Creating...'
            : 'Create Driver'}
        </Button>
      </div>
    </form>
  );
}

