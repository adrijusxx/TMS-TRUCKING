'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FleetMonitoringSettings } from '@/lib/managers/fleet-monitoring/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MonitoringSettingsDialog({ open, onOpenChange }: Props) {
  const [settings, setSettings] = useState<FleetMonitoringSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch('/api/fleet/monitoring/settings')
        .then((r) => r.json())
        .then((r) => { if (r.success) setSettings(r.data); });
    }
  }, [open]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await fetch('/api/fleet/monitoring/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Monitoring Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Dormant Truck Threshold (days)</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={settings.dormantTruckDays}
              onChange={(e) =>
                setSettings({ ...settings, dormantTruckDays: parseInt(e.target.value) || 3 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Trucks with no load for this many days are flagged as dormant.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Dormant Trailer Threshold (days)</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={settings.dormantTrailerDays}
              onChange={(e) =>
                setSettings({ ...settings, dormantTrailerDays: parseInt(e.target.value) || 3 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Driver Idle Alert Threshold (hours)</Label>
            <Input
              type="number"
              min={4}
              max={168}
              value={settings.driverIdleAlertHours}
              onChange={(e) =>
                setSettings({ ...settings, driverIdleAlertHours: parseInt(e.target.value) || 48 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Drivers idle longer than this will trigger notifications.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label>Enable Automated Alerts</Label>
            <Switch
              checked={settings.enableAlerts}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableAlerts: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
