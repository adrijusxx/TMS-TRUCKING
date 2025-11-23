'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Globe, Info } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

async function fetchGeneralSettings() {
  const response = await fetch(apiUrl('/api/settings/general'));
  if (!response.ok) throw new Error('Failed to fetch general settings');
  return response.json();
}

export default function EmployeeGeneralSettings() {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['general-settings'],
    queryFn: fetchGeneralSettings,
  });

  const settings = settingsData?.data;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>General Preferences</CardTitle>
          </div>
          <CardDescription>
            Your personal preferences and company information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <div className="text-sm text-muted-foreground">
                {settings?.timezone || 'Not set'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Format</label>
              <div className="text-sm text-muted-foreground">
                {settings?.dateFormat || 'Not set'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Format</label>
              <div className="text-sm text-muted-foreground">
                {settings?.timeFormat || 'Not set'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <div className="text-sm text-muted-foreground">
                {settings?.currencySymbol} {settings?.currency || 'Not set'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>
            Read-only company settings (contact an administrator to change)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Hours</label>
              <div className="text-sm text-muted-foreground">
                {settings?.businessHoursStart} - {settings?.businessHoursEnd}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Days</label>
              <div className="text-sm text-muted-foreground">
                {settings?.businessDays?.length || 0} days per week
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



