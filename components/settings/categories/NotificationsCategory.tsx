'use client';

import NotificationsSettings from '@/components/settings/NotificationsSettings';

export default function NotificationsCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Notifications</h2>
        <p className="text-muted-foreground">
          Control how and when your team gets notified. Configure email, SMS, push notifications, and webhook integrations for load updates, settlements, driver alerts, and more. Set quiet hours below.
        </p>
      </div>

      <NotificationsSettings />
    </div>
  );
}
