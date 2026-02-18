'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { apiUrl, formatDate } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { getStatusBadgeColor } from '@/lib/utils/compliance-status';
import { toast } from 'sonner';

interface MVRTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function MVRTab({ driver, onSave }: MVRTabProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/driver-compliance/${driver.driverId}/mvr`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create MVR record');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('MVR record created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['mvr', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to create MVR record'),
  });

  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      nextPullDueDate:
        data.nextPullDueDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MVR Records</CardTitle>
        <CardDescription>Add new Motor Vehicle Record</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.mvr && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Last MVR Pull</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(driver.mvr.pullDate)} - {driver.mvr.state}
                  </div>
                  {driver.mvr.violations.length > 0 && (
                    <div className="text-sm text-destructive mt-1">
                      {driver.mvr.violations.length} violation(s)
                    </div>
                  )}
                </div>
                <Badge className={getStatusBadgeColor(driver.statusSummary.mvr.status)}>
                  {driver.statusSummary.mvr.status}
                </Badge>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pull Date</Label>
                <Input type="date" {...register('pullDate', { required: true })} />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register('state', { required: true })} />
              </div>
              <div>
                <Label>Next Pull Due Date</Label>
                <Input type="date" {...register('nextPullDueDate')} />
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add MVR Record'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
