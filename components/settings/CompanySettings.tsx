'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Save } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  dotNumber: z.string().min(1, 'DOT number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
});

type CompanyFormData = z.infer<typeof companySchema>;

async function fetchCompany() {
  const response = await fetch(apiUrl('/api/settings/company'));
  if (!response.ok) throw new Error('Failed to fetch company');
  return response.json();
}

async function updateCompany(data: CompanyFormData) {
  const response = await fetch(apiUrl('/api/settings/company'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update company');
  }
  return response.json();
}

export default function CompanySettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompany,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (data?.data) {
      reset(data.data);
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: updateCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess(false);
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading company settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Update your company details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
              Company settings updated successfully!
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dotNumber">DOT Number *</Label>
              <Input id="dotNumber" {...register('dotNumber')} />
              {errors.dotNumber && (
                <p className="text-sm text-destructive">
                  {errors.dotNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>MC Numbers</Label>
              <div className="bg-muted p-3 rounded-md border text-sm space-y-1">
                {data?.data?.mcNumbers && data.data.mcNumbers.length > 0 ? (
                  data.data.mcNumbers.map((mc: any) => (
                    <div key={mc.id} className="flex justify-between items-center">
                      <span className="font-medium">{mc.number}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {mc.type.toLowerCase()} {mc.isDefault && '(Default)'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">No MC Numbers Assigned</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                To add or modify MC numbers, please contact support or your Super Admin.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" {...register('phone')} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" {...register('address')} />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...register('city')} />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" maxLength={2} {...register('state')} />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input id="zip" {...register('zip')} />
              {errors.zip && (
                <p className="text-sm text-destructive">{errors.zip.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting || updateMutation.isPending
                ? 'Saving...'
                : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

