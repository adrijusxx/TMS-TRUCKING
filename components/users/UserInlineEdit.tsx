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
import McNumberSelector from '@/components/mc-numbers/McNumberSelector';

interface UserInlineEditProps {
  row: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    mcNumberId?: string | null;
    mcNumber?: { id: string; number: string } | null;
    isActive?: boolean;
  };
  onSave?: () => void;
  onCancel?: () => void;
}

async function updateUser(userId: string, data: any) {
  const response = await fetch(apiUrl(`/api/settings/users/${userId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update user');
  }
  return response.json();
}

export default function UserInlineEdit({ row, onSave, onCancel }: UserInlineEditProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email || '',
      phone: row.phone || '',
      role: row.role || 'DRIVER',
      mcNumberId: row.mcNumberId || row.mcNumber?.id || '',
      isActive: row.isActive ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUser(row.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', row.id] });
      toast.success('User updated successfully');
      onSave?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
      setIsSaving(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      mcNumberId: data.mcNumberId || null,
      isActive: data.isActive,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <Card className="m-4 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
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
              <Label htmlFor="role">Role</Label>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcNumberId">MC Number</Label>
              <McNumberSelector
                value={watch('mcNumberId') || ''}
                onValueChange={(value) => setValue('mcNumberId', value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Active Status</Label>
              <Select
                value={watch('isActive') ? 'true' : 'false'}
                onValueChange={(value) => setValue('isActive', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
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




