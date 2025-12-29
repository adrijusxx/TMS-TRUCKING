'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Truck, Smartphone, MapPin } from 'lucide-react';

export default function DriverSettings() {
  const [enableMobileNotifications, setEnableMobileNotifications] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [autoUpdateStatus, setAutoUpdateStatus] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <CardTitle>Driver Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure your driver app preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mobile Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on mobile device
              </p>
            </div>
            <Switch
              checked={enableMobileNotifications}
              onCheckedChange={setEnableMobileNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Share Location</Label>
              <p className="text-sm text-muted-foreground">
                Allow real-time location sharing
              </p>
            </div>
            <Switch
              checked={shareLocation}
              onCheckedChange={setShareLocation}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Update Status</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update load status based on location
              </p>
            </div>
            <Switch
              checked={autoUpdateStatus}
              onCheckedChange={setAutoUpdateStatus}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





