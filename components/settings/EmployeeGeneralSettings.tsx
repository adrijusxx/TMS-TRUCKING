'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
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
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Display Preferences</CardTitle>
        </div>
        <CardDescription>
          View your system display preferences (managed by administrator)
        </CardDescription>
      </CardHeader>
      <CardContent>
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
  );
}





