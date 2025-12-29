'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrailerSchema, type CreateTrailerInput } from '@/lib/validations/trailer';
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
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

async function createTrailer(data: CreateTrailerInput) {
  const response = await fetch(apiUrl('/api/trailers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create trailer');
  }
  return response.json();
}

interface CreateTrailerFormProps {
  onSuccess?: (trailerId: string) => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateTrailerForm({
  onSuccess,
  onCancel,
  isSheet = false,
}: CreateTrailerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateTrailerInput>({
    resolver: zodResolver(createTrailerSchema),
  });

  const mcNumberId = watch('mcNumberId');

  const createMutation = useMutation({
    mutationFn: createTrailer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] });
      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        router.push('/dashboard/trailers');
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: CreateTrailerInput) => {
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
          <Link href="/dashboard/trailers">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h2 className="text-2xl font-semibold">Trailer Information</h2>
          <p className="text-sm text-muted-foreground">
            Create a new trailer
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
            <CardDescription>Trailer identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trailerNumber">Trailer Number *</Label>
              <Input
                id="trailerNumber"
                placeholder="TR-101"
                {...register('trailerNumber')}
              />
              {errors.trailerNumber && (
                <p className="text-sm text-destructive">
                  {errors.trailerNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                placeholder="1HGBH41JXMN109186"
                {...register('vin')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="Great Dane"
                  {...register('make')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="53' Dry Van"
                  {...register('model')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2022"
                {...register('year', { valueAsNumber: true })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  placeholder="TX-ABC123"
                  {...register('licensePlate')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  maxLength={2}
                  {...register('state')}
                />
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

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Trailer details and assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Equipment Type</Label>
              <Select
                onValueChange={(value) =>
                  setValue('type', value, { shouldValidate: true })
                }
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
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership">Ownership</Label>
              <Input
                id="ownership"
                placeholder="Company Owned"
                {...register('ownership')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                placeholder="Company Name"
                {...register('ownerName')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationExpiry">Registration Expiry</Label>
                <Input
                  id="registrationExpiry"
                  type="date"
                  {...register('registrationExpiry')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  {...register('insuranceExpiry')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspectionExpiry">Inspection Expiry</Label>
              <Input
                id="inspectionExpiry"
                type="date"
                {...register('inspectionExpiry')}
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
          <Link href="/dashboard/trailers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        )}
        <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
          {isSubmitting || createMutation.isPending
            ? 'Creating...'
            : 'Create Trailer'}
        </Button>
      </div>
    </form>
  );
}





