'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

async function fetchPreferences() {
  const response = await fetch(apiUrl('/api/notifications/preferences'));
  if (!response.ok) throw new Error('Failed to fetch preferences');
  return response.json();
}

async function updatePreferences(data: any) {
  const response = await fetch(apiUrl('/api/notifications/preferences'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update preferences');
  }
  return response.json();
}

export default function EmployeeNotificationsSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: fetchPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      toast.success('Notification preferences updated');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });

  const preferences = data?.data;

  const handleToggle = (field: string, value: boolean) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Delivery Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="emailEnabled">Email Notifications</Label>
              </div>
              <Switch
                id="emailEnabled"
                checked={preferences?.emailEnabled ?? true}
                onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="pushEnabled">Push Notifications</Label>
              </div>
              <Switch
                id="pushEnabled"
                checked={preferences?.pushEnabled ?? true}
                onCheckedChange={(checked) => handleToggle('pushEnabled', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Notification Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="loadAssigned">Load Assigned</Label>
              <Switch
                id="loadAssigned"
                checked={preferences?.loadAssigned ?? true}
                onCheckedChange={(checked) => handleToggle('loadAssigned', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="loadDelivered">Load Delivered</Label>
              <Switch
                id="loadDelivered"
                checked={preferences?.loadDelivered ?? true}
                onCheckedChange={(checked) => handleToggle('loadDelivered', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="settlementReady">Settlement Ready</Label>
              <Switch
                id="settlementReady"
                checked={preferences?.settlementReady ?? true}
                onCheckedChange={(checked) => handleToggle('settlementReady', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





