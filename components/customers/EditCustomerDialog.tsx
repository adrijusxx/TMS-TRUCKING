'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCustomerSchema, type UpdateCustomerInput } from '@/lib/validations/customer';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerType } from '@prisma/client';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface EditCustomerDialogProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const response = await fetch(apiUrl(`/api/customers/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update customer');
  }
  return response.json();
}

export default function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: EditCustomerDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema) as any,
  });

  // Reset form when customer changes or dialog opens
  useEffect(() => {
    if (customer && open) {
      reset({
        customerNumber: customer.customerNumber,
        name: customer.name,
        type: customer.type,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        phone: customer.phone,
        email: customer.email,
        billingAddress: customer.billingAddress || '',
        billingCity: customer.billingCity || '',
        billingState: customer.billingState || '',
        billingZip: customer.billingZip || '',
        billingEmail: customer.billingEmail || '',
        paymentTerms: customer.paymentTerms,
        creditLimit: customer.creditLimit || undefined,
      });
    }
  }, [customer, open, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerInput) => updateCustomer(customer.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = async (data: UpdateCustomerInput) => {
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
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerNumber">Customer Number *</Label>
              <Input
                id="customerNumber"
                {...register('customerNumber')}
                placeholder="CUST-001"
              />
              {errors.customerNumber && (
                <p className="text-sm text-destructive">{errors.customerNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="ABC Company"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Customer Type *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as CustomerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="BROKER">Broker</SelectItem>
                  <SelectItem value="FACTORING">Factoring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contact@company.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="123 Main St"
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="NY"
                maxLength={2}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input
                id="zip"
                {...register('zip')}
                placeholder="10001"
              />
              {errors.zip && (
                <p className="text-sm text-destructive">{errors.zip.message}</p>
              )}
            </div>
          </div>

          {/* Billing Address (Optional) */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Billing Address (Optional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Input
                id="billingAddress"
                {...register('billingAddress')}
                placeholder="Same as above or different address"
              />
            </div>

            {watch('billingAddress') && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      {...register('billingCity')}
                      placeholder="New York"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingState">State</Label>
                    <Input
                      id="billingState"
                      {...register('billingState')}
                      placeholder="NY"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingZip">ZIP Code</Label>
                    <Input
                      id="billingZip"
                      {...register('billingZip')}
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    {...register('billingEmail')}
                    placeholder="billing@company.com"
                  />
                </div>
              </>
            )}
          </div>

          {/* Financial Information */}
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (days) *</Label>
              <Input
                id="paymentTerms"
                type="number"
                {...register('paymentTerms', { valueAsNumber: true })}
                placeholder="30"
              />
              {errors.paymentTerms && (
                <p className="text-sm text-destructive">{errors.paymentTerms.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                {...register('creditLimit', { valueAsNumber: true })}
                placeholder="10000.00"
              />
              {errors.creditLimit && (
                <p className="text-sm text-destructive">{errors.creditLimit.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





