'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Mail, Bell } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Preferences {
  emailOnCritical: boolean;
  emailOnHigh: boolean;
  emailOnMedium: boolean;
  emailOnLow: boolean;
  dailyDigest: boolean;
  expirationWarningDays: number;
}

export default function NotificationPreferences() {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['alert-preferences'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/safety/alerts/preferences'));
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const json = await res.json();
      return json.data as Preferences;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newPrefs: Preferences) => {
      const res = await fetch(apiUrl('/api/safety/alerts/preferences'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-preferences'] });
    },
  });

  const updatePref = (key: keyof Preferences, value: boolean | number) => {
    if (!prefs) return;
    mutation.mutate({ ...prefs, [key]: value });
  };

  if (isLoading || !prefs) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading preferences...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h4>
          <div className="space-y-3 ml-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailCritical">Critical alerts</Label>
              <Switch
                id="emailCritical"
                checked={prefs.emailOnCritical}
                onCheckedChange={(v) => updatePref('emailOnCritical', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailHigh">High priority alerts</Label>
              <Switch
                id="emailHigh"
                checked={prefs.emailOnHigh}
                onCheckedChange={(v) => updatePref('emailOnHigh', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailMedium">Medium priority alerts</Label>
              <Switch
                id="emailMedium"
                checked={prefs.emailOnMedium}
                onCheckedChange={(v) => updatePref('emailOnMedium', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailLow">Low priority alerts</Label>
              <Switch
                id="emailLow"
                checked={prefs.emailOnLow}
                onCheckedChange={(v) => updatePref('emailOnLow', v)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Digest & Warnings
          </h4>
          <div className="space-y-3 ml-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="dailyDigest">Daily email digest</Label>
              <Switch
                id="dailyDigest"
                checked={prefs.dailyDigest}
                onCheckedChange={(v) => updatePref('dailyDigest', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Expiration warning lead time</Label>
              <Select
                value={String(prefs.expirationWarningDays)}
                onValueChange={(v) => updatePref('expirationWarningDays', parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
