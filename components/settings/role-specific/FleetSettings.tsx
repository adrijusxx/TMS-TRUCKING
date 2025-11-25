'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Truck, Wrench, AlertCircle } from 'lucide-react';

export default function FleetSettings() {
  const [enableMaintenanceTracking, setEnableMaintenanceTracking] = useState(true);
  const [showFleetReports, setShowFleetReports] = useState(true);
  const [autoScheduleMaintenance, setAutoScheduleMaintenance] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <CardTitle>Fleet Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure your fleet management preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable maintenance and repair tracking
              </p>
            </div>
            <Switch
              checked={enableMaintenanceTracking}
              onCheckedChange={setEnableMaintenanceTracking}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Fleet Reports</Label>
              <p className="text-sm text-muted-foreground">
                Display fleet utilization and maintenance reports
              </p>
            </div>
            <Switch
              checked={showFleetReports}
              onCheckedChange={setShowFleetReports}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Schedule Maintenance</Label>
              <p className="text-sm text-muted-foreground">
                Automatically schedule maintenance based on mileage/hours
              </p>
            </div>
            <Switch
              checked={autoScheduleMaintenance}
              onCheckedChange={setAutoScheduleMaintenance}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





