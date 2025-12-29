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
import { User, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/utils';

const userProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

async function fetchUserProfile(userId: string) {
  const response = await fetch(apiUrl(`/api/settings/users/${userId}`));
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

async function updateUserProfile(userId: string, data: UserProfileFormData) {
  const response = await fetch(apiUrl(`/api/settings/users/${userId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update profile');
  }
  return response.json();
}

export default function UserProfileSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;
  const canFetch = !!userId;

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: canFetch,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
  });

  useEffect(() => {
    if (userData?.data) {
      reset({
        firstName: userData.data.firstName || '',
        lastName: userData.data.lastName || '',
        email: userData.data.email || '',
        phone: userData.data.phone || '',
      });
    }
  }, [userData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UserProfileFormData) => updateUserProfile(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['general-settings'] });
      toast.success('Profile updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = async (data: UserProfileFormData) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Please sign in to view your profile
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Profile Information</CardTitle>
        </div>
        <CardDescription>
          Update your personal information and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Changing your email will require you to sign in again
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="(555) 123-4567" />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

