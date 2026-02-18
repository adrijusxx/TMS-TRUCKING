'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { apiUrl } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { toast } from 'sonner';

interface CDLTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function CDLTab({ driver, onSave }: CDLTabProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/cdl`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create CDL record');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('CDL record created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['cdl', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to create CDL record'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/cdl`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update CDL record');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('CDL record updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['cdl', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to update CDL record'),
  });

  const { register, handleSubmit } = useForm({
    defaultValues: driver.cdl
      ? {
          cdlNumber: driver.cdl.cdlNumber,
          expirationDate: new Date(driver.cdl.expirationDate).toISOString().split('T')[0],
          issueDate: driver.cdl.issueDate
            ? new Date(driver.cdl.issueDate).toISOString().split('T')[0]
            : '',
          issueState: driver.cdl.issueState,
          licenseClass: driver.cdl.licenseClass || '',
          endorsements: driver.cdl.endorsements.join(', '),
          restrictions: driver.cdl.restrictions.join(', '),
        }
      : {},
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      endorsements: data.endorsements ? data.endorsements.split(',').map((e: string) => e.trim()) : [],
      restrictions: data.restrictions ? data.restrictions.split(',').map((r: string) => r.trim()) : [],
    };
    if (driver.cdl) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>CDL Record</CardTitle>
        <CardDescription>Manage Commercial Driver's License information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CDL Number</Label>
              <Input {...register('cdlNumber', { required: true })} />
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Input type="date" {...register('expirationDate', { required: true })} />
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input type="date" {...register('issueDate')} />
            </div>
            <div>
              <Label>Issue State</Label>
              <Input {...register('issueState', { required: true })} />
            </div>
            <div>
              <Label>License Class (A, B, C)</Label>
              <Input {...register('licenseClass')} />
            </div>
            <div>
              <Label>Endorsements (comma-separated)</Label>
              <Input {...register('endorsements')} placeholder="H, N, T, X" />
            </div>
            <div>
              <Label>Restrictions (comma-separated)</Label>
              <Input {...register('restrictions')} placeholder="E, L, M, O, Z" />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : driver.cdl ? 'Update' : 'Create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
