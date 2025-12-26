'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomerSchema, type CreateCustomerInput } from '@/lib/validations/customer';
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
import { CustomerType } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils';

async function createCustomer(data: CreateCustomerInput) {
  const response = await fetch(apiUrl('/api/customers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create customer');
  }
  return response.json();
}

interface CreateCustomerFormProps {
  onSuccess?: (customerId: string) => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateCustomerForm({
  onSuccess,
  onCancel,
  isSheet = false
}: CreateCustomerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as any,
    defaultValues: {
      type: 'DIRECT' as const,
      paymentTerms: 30,
    },
  });

  const useBillingAddress = watch('billingAddress');

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        router.push(`/dashboard/customers/${data.data.id}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = async (data: CreateCustomerInput) => {
    setError(null);
    // Remove empty billing fields
    if (!data.billingAddress) {
      delete data.billingAddress;
      delete data.billingCity;
      delete data.billingState;
      delete data.billingZip;
    }
    if (!data.billingEmail) {
      delete data.billingEmail;
    }
    createMutation.mutate(data as CreateCustomerInput);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        {onCancel ? (
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Link href="/dashboard/customers">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h2 className="text-2xl font-semibold">Customer Information</h2>
          <p className="text-sm text-muted-foreground">
            Add a new customer to your system
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
            <CardDescription>Customer identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerNumber">Customer Number *</Label>
                <Input
                  id="customerNumber"
                  placeholder="C-001"
                  {...register('customerNumber')}
                />
                {errors.customerNumber && (
                  <p className="text-sm text-destructive">
                    {errors.customerNumber.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Customer Type *</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('type', value as CustomerType)
                  }
                  defaultValue="DIRECT"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT">Direct</SelectItem>
                    <SelectItem value="BROKER">Broker</SelectItem>
                    <SelectItem value="FREIGHT_FORWARDER">Freight Forwarder</SelectItem>
                    <SelectItem value="THIRD_PARTY_LOGISTICS">3PL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                placeholder="ABC Corporation"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="billing@abccorp.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="555-0100"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Physical location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                {...register('address')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Dallas"
                  {...register('city')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  maxLength={2}
                  {...register('state')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP *</Label>
                <Input
                  id="zip"
                  placeholder="75001"
                  {...register('zip')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Payment terms and billing address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (days) *</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  placeholder="30"
                  {...register('paymentTerms', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  placeholder="100000"
                  {...register('creditLimit', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="useBillingAddress"
                checked={!!useBillingAddress}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setValue('billingAddress', '');
                    setValue('billingCity', '');
                    setValue('billingState', '');
                    setValue('billingZip', '');
                  }
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="useBillingAddress" className="cursor-pointer">
                Use different billing address
              </Label>
            </div>

            {useBillingAddress && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Input
                    id="billingAddress"
                    placeholder="456 Billing St"
                    {...register('billingAddress')}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      placeholder="Dallas"
                      {...register('billingCity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingState">State</Label>
                    <Input
                      id="billingState"
                      placeholder="TX"
                      maxLength={2}
                      {...register('billingState')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingZip">ZIP</Label>
                    <Input
                      id="billingZip"
                      placeholder="75001"
                      {...register('billingZip')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    placeholder="billing@abccorp.com"
                    {...register('billingEmail')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Link href="/dashboard/customers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        )}
        <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
          {isSubmitting || createMutation.isPending
            ? 'Creating...'
            : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
}

