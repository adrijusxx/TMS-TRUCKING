'use client';

import NotificationsSettings from '@/components/settings/NotificationsSettings';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function NotificationsCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Notifications</h2>
        <p className="text-muted-foreground">
          Configure notification preferences and settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure email, SMS, push, and webhook notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <CardDescription>
              Set your personal notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferences />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





