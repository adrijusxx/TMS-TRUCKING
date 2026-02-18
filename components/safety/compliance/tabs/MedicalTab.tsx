'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { apiUrl } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { toast } from 'sonner';

interface MedicalTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function MedicalTab({ driver, onSave }: MedicalTabProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/medical-card`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create medical card');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Medical card created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['medical-card', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to create medical card'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/medical-card`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update medical card');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Medical card updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['medical-card', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to update medical card'),
  });

  const { register, handleSubmit } = useForm({
    defaultValues: driver.medicalCard
      ? {
          cardNumber: driver.medicalCard.cardNumber,
          expirationDate: new Date(driver.medicalCard.expirationDate).toISOString().split('T')[0],
          issueDate: driver.medicalCard.issueDate
            ? new Date(driver.medicalCard.issueDate).toISOString().split('T')[0]
            : '',
          medicalExaminerName: driver.medicalCard.medicalExaminerName || '',
          medicalExaminerCertificateNumber: driver.medicalCard.medicalExaminerCertificateNumber || '',
          waiverInformation: driver.medicalCard.waiverInformation || '',
        }
      : {},
  });

  const onSubmit = (data: any) => {
    if (driver.medicalCard) {
      updateMutation.mutate({ id: driver.medicalCard.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Card</CardTitle>
        <CardDescription>Manage driver medical card information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Card Number</Label>
              <Input {...register('cardNumber', { required: true })} />
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
              <Label>Medical Examiner Name</Label>
              <Input {...register('medicalExaminerName')} />
            </div>
            <div>
              <Label>Examiner Certificate Number</Label>
              <Input {...register('medicalExaminerCertificateNumber')} />
            </div>
            <div>
              <Label>Waiver Information</Label>
              <Textarea {...register('waiverInformation')} />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : driver.medicalCard ? 'Update' : 'Create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
