'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Truck, Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function DispatcherSettings() {
  const [autoAssignLoads, setAutoAssignLoads] = useState(false);
  const [showDriverAvailability, setShowDriverAvailability] = useState(true);
  const [enableLoadTemplates, setEnableLoadTemplates] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Dispatch Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure your dispatch workflow preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Assign Loads</Label>
              <p className="text-sm text-muted-foreground">
                Automatically suggest driver assignments
              </p>
            </div>
            <Switch
              checked={autoAssignLoads}
              onCheckedChange={setAutoAssignLoads}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Driver Availability</Label>
              <p className="text-sm text-muted-foreground">
                Display driver availability status
              </p>
            </div>
            <Switch
              checked={showDriverAvailability}
              onCheckedChange={setShowDriverAvailability}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Load Templates</Label>
              <p className="text-sm text-muted-foreground">
                Use saved load templates for quick creation
              </p>
            </div>
            <Switch
              checked={enableLoadTemplates}
              onCheckedChange={setEnableLoadTemplates}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





