'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare, Smartphone, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

const notificationsSchema = z.object({
  // Email Notifications
  emailEnabled: z.boolean(),
  emailOnLoadCreated: z.boolean(),
  emailOnLoadAssigned: z.boolean(),
  emailOnLoadDelivered: z.boolean(),
  emailOnInvoiceGenerated: z.boolean(),
  emailOnSettlementReady: z.boolean(),
  emailOnDriverAdvanceRequest: z.boolean(),
  emailOnExpenseSubmitted: z.boolean(),
  
  // SMS Notifications
  smsEnabled: z.boolean(),
  smsApiKey: z.string().optional(),
  smsApiSecret: z.string().optional(),
  smsFromNumber: z.string().optional(),
  smsOnLoadAssigned: z.boolean(),
  smsOnLoadDelivered: z.boolean(),
  smsOnSettlementReady: z.boolean(),
  
  // Push Notifications
  pushEnabled: z.boolean(),
  pushOnLoadAssigned: z.boolean(),
  pushOnLoadDelivered: z.boolean(),
  pushOnSettlementReady: z.boolean(),
  
  // Webhook Notifications
  webhookEnabled: z.boolean(),
  webhookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  webhookSecret: z.string().optional(),
  webhookOnLoadCreated: z.boolean(),
  webhookOnLoadDelivered: z.boolean(),
  webhookOnInvoiceGenerated: z.boolean(),
  
  // Notification Preferences
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

type NotificationsSettings = z.infer<typeof notificationsSchema>;

async function fetchNotificationsSettings() {
  const response = await fetch(apiUrl('/api/settings/notifications'));
  if (!response.ok) throw new Error('Failed to fetch notification settings');
  return response.json();
}

async function updateNotificationsSettings(data: NotificationsSettings) {
  const response = await fetch(apiUrl('/api/settings/notifications'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update notification settings');
  }
  return response.json();
}

async function testNotification(type: 'email' | 'sms' | 'push' | 'webhook') {
  const response = await fetch(apiUrl('/api/settings/notifications/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send test notification');
  }
  return response.json();
}

export default function NotificationsSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['notifications-settings'],
    queryFn: fetchNotificationsSettings,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<NotificationsSettings>({
    resolver: zodResolver(notificationsSchema),
    values: settingsData?.data || {
      emailEnabled: true,
      emailOnLoadCreated: true,
      emailOnLoadAssigned: true,
      emailOnLoadDelivered: true,
      emailOnInvoiceGenerated: true,
      emailOnSettlementReady: true,
      emailOnDriverAdvanceRequest: true,
      emailOnExpenseSubmitted: true,
      smsEnabled: false,
      smsApiKey: '',
      smsApiSecret: '',
      smsFromNumber: '',
      smsOnLoadAssigned: true,
      smsOnLoadDelivered: true,
      smsOnSettlementReady: false,
      pushEnabled: true,
      pushOnLoadAssigned: true,
      pushOnLoadDelivered: true,
      pushOnSettlementReady: true,
      webhookEnabled: false,
      webhookUrl: '',
      webhookSecret: '',
      webhookOnLoadCreated: false,
      webhookOnLoadDelivered: false,
      webhookOnInvoiceGenerated: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateNotificationsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-settings'] });
      toast.success('Notification settings updated successfully');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const testMutation = useMutation({
    mutationFn: testNotification,
    onSuccess: () => {
      toast.success('Test notification sent successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleTest = async (type: 'email' | 'sms' | 'push' | 'webhook') => {
    setTesting(type);
    try {
      await testMutation.mutateAsync(type);
    } finally {
      setTesting(null);
    }
  };

  const onSubmit = (data: NotificationsSettings) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('emailEnabled')}
                onCheckedChange={(checked) => setValue('emailEnabled', checked)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest('email')}
                disabled={testing === 'email' || !watch('emailEnabled')}
              >
                {testing === 'email' ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure email notification preferences
          </CardDescription>
        </CardHeader>
        {watch('emailEnabled') && (
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Load Created</Label>
                <p className="text-sm text-muted-foreground">Notify when a new load is created</p>
              </div>
              <Switch
                checked={watch('emailOnLoadCreated')}
                onCheckedChange={(checked) => setValue('emailOnLoadCreated', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Load Assigned</Label>
                <p className="text-sm text-muted-foreground">Notify when a load is assigned to a driver</p>
              </div>
              <Switch
                checked={watch('emailOnLoadAssigned')}
                onCheckedChange={(checked) => setValue('emailOnLoadAssigned', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Load Delivered</Label>
                <p className="text-sm text-muted-foreground">Notify when a load is delivered</p>
              </div>
              <Switch
                checked={watch('emailOnLoadDelivered')}
                onCheckedChange={(checked) => setValue('emailOnLoadDelivered', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Invoice Generated</Label>
                <p className="text-sm text-muted-foreground">Notify when an invoice is generated</p>
              </div>
              <Switch
                checked={watch('emailOnInvoiceGenerated')}
                onCheckedChange={(checked) => setValue('emailOnInvoiceGenerated', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Settlement Ready</Label>
                <p className="text-sm text-muted-foreground">Notify when a settlement is ready for review</p>
              </div>
              <Switch
                checked={watch('emailOnSettlementReady')}
                onCheckedChange={(checked) => setValue('emailOnSettlementReady', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Driver Advance Request</Label>
                <p className="text-sm text-muted-foreground">Notify when a driver requests an advance</p>
              </div>
              <Switch
                checked={watch('emailOnDriverAdvanceRequest')}
                onCheckedChange={(checked) => setValue('emailOnDriverAdvanceRequest', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expense Submitted</Label>
                <p className="text-sm text-muted-foreground">Notify when an expense is submitted for approval</p>
              </div>
              <Switch
                checked={watch('emailOnExpenseSubmitted')}
                onCheckedChange={(checked) => setValue('emailOnExpenseSubmitted', checked)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle>SMS Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('smsEnabled')}
                onCheckedChange={(checked) => setValue('smsEnabled', checked)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest('sms')}
                disabled={testing === 'sms' || !watch('smsEnabled')}
              >
                {testing === 'sms' ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure SMS notification settings (requires SMS provider API)
          </CardDescription>
        </CardHeader>
        {watch('smsEnabled') && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smsApiKey">SMS API Key</Label>
                <Input
                  id="smsApiKey"
                  type="password"
                  placeholder="Enter API key"
                  {...register('smsApiKey')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smsApiSecret">SMS API Secret</Label>
                <Input
                  id="smsApiSecret"
                  type="password"
                  placeholder="Enter API secret"
                  {...register('smsApiSecret')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smsFromNumber">From Number</Label>
              <Input
                id="smsFromNumber"
                placeholder="+1234567890"
                {...register('smsFromNumber')}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Load Assigned</Label>
                  <p className="text-sm text-muted-foreground">Send SMS when load is assigned</p>
                </div>
                <Switch
                  checked={watch('smsOnLoadAssigned')}
                  onCheckedChange={(checked) => setValue('smsOnLoadAssigned', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Load Delivered</Label>
                  <p className="text-sm text-muted-foreground">Send SMS when load is delivered</p>
                </div>
                <Switch
                  checked={watch('smsOnLoadDelivered')}
                  onCheckedChange={(checked) => setValue('smsOnLoadDelivered', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Settlement Ready</Label>
                  <p className="text-sm text-muted-foreground">Send SMS when settlement is ready</p>
                </div>
                <Switch
                  checked={watch('smsOnSettlementReady')}
                  onCheckedChange={(checked) => setValue('smsOnSettlementReady', checked)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Push Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('pushEnabled')}
                onCheckedChange={(checked) => setValue('pushEnabled', checked)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest('push')}
                disabled={testing === 'push' || !watch('pushEnabled')}
              >
                {testing === 'push' ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Browser and mobile push notifications
          </CardDescription>
        </CardHeader>
        {watch('pushEnabled') && (
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Load Assigned</Label>
                <p className="text-sm text-muted-foreground">Send push notification when load is assigned</p>
              </div>
              <Switch
                checked={watch('pushOnLoadAssigned')}
                onCheckedChange={(checked) => setValue('pushOnLoadAssigned', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Load Delivered</Label>
                <p className="text-sm text-muted-foreground">Send push notification when load is delivered</p>
              </div>
              <Switch
                checked={watch('pushOnLoadDelivered')}
                onCheckedChange={(checked) => setValue('pushOnLoadDelivered', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Settlement Ready</Label>
                <p className="text-sm text-muted-foreground">Send push notification when settlement is ready</p>
              </div>
              <Switch
                checked={watch('pushOnSettlementReady')}
                onCheckedChange={(checked) => setValue('pushOnSettlementReady', checked)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Webhook Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              <CardTitle>Webhook Notifications</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('webhookEnabled')}
                onCheckedChange={(checked) => setValue('webhookEnabled', checked)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest('webhook')}
                disabled={testing === 'webhook' || !watch('webhookEnabled')}
              >
                {testing === 'webhook' ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Send notifications to external webhooks
          </CardDescription>
        </CardHeader>
        {watch('webhookEnabled') && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://example.com/webhook"
                {...register('webhookUrl')}
              />
              {errors.webhookUrl && (
                <p className="text-sm text-destructive">{errors.webhookUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="Optional secret for webhook verification"
                {...register('webhookSecret')}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Load Created</Label>
                  <p className="text-sm text-muted-foreground">Send webhook when load is created</p>
                </div>
                <Switch
                  checked={watch('webhookOnLoadCreated')}
                  onCheckedChange={(checked) => setValue('webhookOnLoadCreated', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Load Delivered</Label>
                  <p className="text-sm text-muted-foreground">Send webhook when load is delivered</p>
                </div>
                <Switch
                  checked={watch('webhookOnLoadDelivered')}
                  onCheckedChange={(checked) => setValue('webhookOnLoadDelivered', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Invoice Generated</Label>
                  <p className="text-sm text-muted-foreground">Send webhook when invoice is generated</p>
                </div>
                <Switch
                  checked={watch('webhookOnInvoiceGenerated')}
                  onCheckedChange={(checked) => setValue('webhookOnInvoiceGenerated', checked)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            Suppress non-urgent notifications during specified hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Only send urgent notifications during quiet hours
              </p>
            </div>
            <Switch
              checked={watch('quietHoursEnabled')}
              onCheckedChange={(checked) => setValue('quietHoursEnabled', checked)}
            />
          </div>

          {watch('quietHoursEnabled') && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart">Start Time</Label>
                <Input
                  id="quietHoursStart"
                  type="time"
                  {...register('quietHoursStart')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd">End Time</Label>
                <Input
                  id="quietHoursEnd"
                  type="time"
                  {...register('quietHoursEnd')}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}





