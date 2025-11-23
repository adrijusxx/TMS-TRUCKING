'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomerSchema, quickCreateCustomerSchema, type CreateCustomerInput } from '@/lib/validations/customer';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerType } from '@prisma/client';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

async function createCustomer(data: CreateCustomerInput | { name: string; email: string }) {
  const response = await fetch(apiUrl('/api/customers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create customer');
  }
  const result = await response.json();
  // Ensure we return the result in the expected format
  if (!result.data || !result.data.id) {
    console.error('Unexpected API response format:', result);
    throw new Error('Customer created but response format is invalid');
  }
  return result;
}

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: (customerId: string) => void;
  quickCreate?: boolean; // If true, show only name and email fields
}

export default function CreateCustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
  quickCreate = false,
}: CreateCustomerDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<any>({
    resolver: zodResolver(quickCreate ? quickCreateCustomerSchema : createCustomerSchema) as any,
    defaultValues: quickCreate ? {} : {
      type: 'DIRECT' as const,
      paymentTerms: 30,
    },
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (data) => {
      // Invalidate and refetch customers to ensure new customer appears
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.refetchQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
      reset();
      onOpenChange(false);
      // Wait a bit for the query to complete before calling callback
      // Ensure we have a valid customer ID before calling callback
      const customerId = data?.data?.id || data?.id;
      if (customerId && typeof customerId === 'string' && customerId.trim() !== '') {
        setTimeout(() => {
          if (onCustomerCreated) {
            onCustomerCreated(customerId);
          }
        }, 500);
      } else {
        console.error('Customer created but ID not found in response:', data);
        toast.warning('Customer created but could not be auto-selected. Please select it manually.');
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = async (data: CreateCustomerInput) => {
    setError(null);
    
    if (quickCreate) {
      // Quick create: only send name and email, customer number will be auto-generated
      createMutation.mutate({
        name: data.name,
        email: data.email,
      } as any);
      return;
    }
    
    // Full create: remove empty billing fields
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={quickCreate ? "max-w-md" : "max-w-2xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>{quickCreate ? 'Quick Create Customer' : 'Create New Customer'}</DialogTitle>
          <DialogDescription>
            {quickCreate 
              ? 'Enter customer name and email. Customer number will be auto-generated.'
              : 'Add a new customer to your system. Required fields are marked with *.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {quickCreate ? (
            // Quick create: only name and email
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  placeholder="ABC Logistics"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {typeof errors.name.message === 'string' ? errors.name.message : String(errors.name.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {typeof errors.email.message === 'string' ? errors.email.message : String(errors.email.message)}
                  </p>
                )}
              </div>
            </>
          ) : (
            // Full create: all fields
            <>
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
                      {typeof errors.customerNumber.message === 'string' ? errors.customerNumber.message : String(errors.customerNumber.message)}
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
                  placeholder="ABC Logistics"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {typeof errors.name.message === 'string' ? errors.name.message : String(errors.name.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {typeof errors.address.message === 'string' ? errors.address.message : String(errors.address.message)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Dallas"
                    {...register('city')}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">
                      {typeof errors.city.message === 'string' ? errors.city.message : String(errors.city.message)}
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
                      {typeof errors.state.message === 'string' ? errors.state.message : String(errors.state.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    placeholder="75001"
                    {...register('zip')}
                  />
                  {errors.zip && (
                    <p className="text-sm text-destructive">
                      {typeof errors.zip.message === 'string' ? errors.zip.message : String(errors.zip.message)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      {typeof errors.phone.message === 'string' ? errors.phone.message : String(errors.phone.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {typeof errors.email.message === 'string' ? errors.email.message : String(errors.email.message)}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

