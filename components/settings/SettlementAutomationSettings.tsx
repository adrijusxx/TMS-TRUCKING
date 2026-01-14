'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const settlementSettingsSchema = z.object({
  // Pay Period Configuration
  payPeriodStartDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  payPeriodEndDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  
  // Automation Settings
  enableAutoGeneration: z.boolean(),
  autoGenerationDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  autoGenerationTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  
  // Email Settings
  autoEmailSettlements: z.boolean(),
  emailToDrivers: z.boolean(),
  emailToAccounting: z.boolean(),
});

type SettlementSettings = z.infer<typeof settlementSettingsSchema>;

async function fetchSettlementSettings() {
  const response = await fetch(apiUrl('/api/settings/settlement-automation'));
  if (!response.ok) throw new Error('Failed to fetch settlement settings');
  return response.json();
}

async function updateSettlementSettings(data: SettlementSettings) {
  const response = await fetch(apiUrl('/api/settings/settlement-automation'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update settlement settings');
  }
  return response.json();
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function SettlementAutomationSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settlement-automation-settings'],
    queryFn: fetchSettlementSettings,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<SettlementSettings>({
    resolver: zodResolver(settlementSettingsSchema) as any,
    values: settingsData?.data || {
      payPeriodStartDay: 'monday',
      payPeriodEndDay: 'sunday',
      enableAutoGeneration: false,
      autoGenerationDay: 'monday',
      autoGenerationTime: '00:00',
      autoEmailSettlements: false,
      emailToDrivers: true,
      emailToAccounting: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSettlementSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement-automation-settings'] });
      toast.success('Settlement automation settings updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const onSubmit = (data: SettlementSettings) => {
    setError(null);
    updateMutation.mutate(data);
  };

  const enableAutoGeneration = watch('enableAutoGeneration');
  const autoEmailSettlements = watch('autoEmailSettlements');

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Pay Period Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Pay Period Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure when your pay period starts and ends (e.g., Monday to Sunday)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payPeriodStartDay">Pay Period Start Day</Label>
              <Select
                value={watch('payPeriodStartDay')}
                onValueChange={(value) => setValue('payPeriodStartDay', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payPeriodEndDay">Pay Period End Day</Label>
              <Select
                value={watch('payPeriodEndDay')}
                onValueChange={(value) => setValue('payPeriodEndDay', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current Configuration:</strong> Pay period runs from{' '}
              {DAYS_OF_WEEK.find((d) => d.value === watch('payPeriodStartDay'))?.label} to{' '}
              {DAYS_OF_WEEK.find((d) => d.value === watch('payPeriodEndDay'))?.label}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Automation Settings</CardTitle>
          </div>
          <CardDescription>
            Configure automatic settlement generation schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableAutoGeneration">Enable Automatic Generation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate settlements on a schedule
              </p>
            </div>
            <Switch
              id="enableAutoGeneration"
              checked={watch('enableAutoGeneration')}
              onCheckedChange={(checked) => setValue('enableAutoGeneration', checked)}
            />
          </div>

          {enableAutoGeneration && (
            <div className="space-y-4 pl-6 border-l-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="autoGenerationDay">Generation Day</Label>
                  <Select
                    value={watch('autoGenerationDay')}
                    onValueChange={(value) => setValue('autoGenerationDay', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autoGenerationTime">Generation Time</Label>
                  <input
                    id="autoGenerationTime"
                    type="time"
                    {...register('autoGenerationTime')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Schedule:</strong> Settlements will be automatically generated every{' '}
                  {DAYS_OF_WEEK.find((d) => d.value === watch('autoGenerationDay'))?.label} at{' '}
                  {watch('autoGenerationTime')} for the previous pay period.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Email Settings</CardTitle>
          </div>
          <CardDescription>
            Configure automatic email notifications for settlements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoEmailSettlements">Auto-Email Settlements</Label>
              <p className="text-sm text-muted-foreground">
                Automatically email settlement statements when generated
              </p>
            </div>
            <Switch
              id="autoEmailSettlements"
              checked={watch('autoEmailSettlements')}
              onCheckedChange={(checked) => setValue('autoEmailSettlements', checked)}
            />
          </div>

          {autoEmailSettlements && (
            <div className="space-y-4 pl-6 border-l-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailToDrivers">Email to Drivers</Label>
                  <p className="text-sm text-muted-foreground">
                    Send settlement PDF to driver email addresses
                  </p>
                </div>
                <Switch
                  id="emailToDrivers"
                  checked={watch('emailToDrivers')}
                  onCheckedChange={(checked) => setValue('emailToDrivers', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailToAccounting">Email to Accounting</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notification to accounting team
                  </p>
                </div>
                <Switch
                  id="emailToAccounting"
                  checked={watch('emailToAccounting')}
                  onCheckedChange={(checked) => setValue('emailToAccounting', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}

























