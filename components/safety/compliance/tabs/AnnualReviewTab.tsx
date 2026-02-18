'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { apiUrl, formatDate } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { toast } from 'sonner';

interface AnnualReviewTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function AnnualReviewTab({ driver, onSave }: AnnualReviewTabProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        apiUrl(`/api/safety/driver-compliance/${driver.driverId}/annual-review`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create annual review');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Annual review created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['annual-review', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to create annual review'),
  });

  const { register, handleSubmit, watch, setValue } = useForm();

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      completed: data.completed === 'true' || data.completed === true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Reviews</CardTitle>
        <CardDescription>Manage annual review records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.annualReviews.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Recent Reviews</div>
              {driver.annualReviews.map((review) => (
                <div key={review.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formatDate(review.reviewDate)}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {formatDate(review.dueDate)} - {review.status}
                      </div>
                      {review.reviewNotes && (
                        <div className="text-xs text-muted-foreground mt-1">{review.reviewNotes}</div>
                      )}
                    </div>
                    <Badge>{review.status === 'COMPLETED' ? 'Completed' : 'Pending'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Review Date</Label>
                <Input type="date" {...register('reviewDate', { required: true })} />
              </div>
              <div>
                <Label>Next Review Date</Label>
                <Input type="date" {...register('nextReviewDate')} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={watch('status') || ''} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Completed</Label>
                <Select value={watch('completed') || ''} onValueChange={(v) => setValue('completed', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reviewer Name</Label>
                <Input {...register('reviewerName')} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea {...register('notes')} />
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Review'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
