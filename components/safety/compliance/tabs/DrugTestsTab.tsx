'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface DrugTestsTabProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
}

export default function DrugTestsTab({ driver, onSave }: DrugTestsTabProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        apiUrl(`/api/safety/driver-compliance/${driver.driverId}/drug-test`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create drug test');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Drug test created successfully');
      await queryClient.invalidateQueries({ queryKey: ['driver-compliance'] });
      await queryClient.refetchQueries({ queryKey: ['driver-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['drug-tests', driver.driverId] });
      await onSave();
    },
    onError: () => toast.error('Failed to create drug test'),
  });

  const { register, handleSubmit, watch, setValue } = useForm();

  const onSubmit = (data: any) => createMutation.mutate(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug & Alcohol Tests</CardTitle>
        <CardDescription>Add new drug/alcohol test record</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.recentDrugTests.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Recent Tests</div>
              {driver.recentDrugTests.map((test) => (
                <div key={test.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{test.testType}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(test.testDate)} - {test.testResult}
                      </div>
                    </div>
                    <Badge>{test.testResult}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Date</Label>
                <Input type="date" {...register('testDate', { required: true })} />
              </div>
              <div>
                <Label>Test Type</Label>
                <Select value={watch('testType') || ''} onValueChange={(v) => setValue('testType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_EMPLOYMENT">Pre-Employment</SelectItem>
                    <SelectItem value="RANDOM">Random</SelectItem>
                    <SelectItem value="REASONABLE_SUSPICION">Reasonable Suspicion</SelectItem>
                    <SelectItem value="POST_ACCIDENT">Post-Accident</SelectItem>
                    <SelectItem value="RETURN_TO_DUTY">Return to Duty</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow-Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Test Result</Label>
                <Select value={watch('testResult') || ''} onValueChange={(v) => setValue('testResult', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEGATIVE">Negative</SelectItem>
                    <SelectItem value="POSITIVE">Positive</SelectItem>
                    <SelectItem value="REFUSED">Refused</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Testing Facility</Label>
                <Input {...register('testingFacility')} />
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Test'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
