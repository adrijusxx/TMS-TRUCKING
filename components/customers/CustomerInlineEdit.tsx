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
import { CustomerType } from '@prisma/client';

interface CustomerInlineEditProps {
  row: {
    id: string;
    customerNumber: string;
    name: string;
    type: CustomerType;
    email: string;
    phone: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    paymentTerms?: number | null;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function updateCustomer(customerId: string, data: any) {
  const response = await fetch(apiUrl(`/api/customers/${customerId}`), {
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

export default function CustomerInlineEdit({ row, onSave, onCancel }: CustomerInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      customerNumber: row.customerNumber || '',
      name: row.name || '',
      type: row.type || 'DIRECT',
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      zip: row.zip || '',
      paymentTerms: row.paymentTerms || 30,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateCustomer(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', row.id] });
      toast.success('Customer updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      customerNumber: data.customerNumber,
      name: data.name,
      type: data.type,
      email: data.email,
      phone: data.phone,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      paymentTerms: data.paymentTerms ? parseInt(data.paymentTerms) : null,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerNumber">Customer Number</Label>
              <Input id="customerNumber" {...register('customerNumber')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as CustomerType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="BROKER">Broker</SelectItem>
                  <SelectItem value="FACTORING_COMPANY">Factoring Company</SelectItem>
                  <SelectItem value="SHIPPER">Shipper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" maxLength={2} {...register('state')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input id="zip" {...register('zip')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
              <Input id="paymentTerms" type="number" {...register('paymentTerms')} />
            </div>
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




