'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertTriangle, FileCheck } from 'lucide-react';

export default function SafetySettings() {
  const [enableComplianceTracking, setEnableComplianceTracking] = useState(true);
  const [showSafetyReports, setShowSafetyReports] = useState(true);
  const [requireSafetyApproval, setRequireSafetyApproval] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Safety Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure your safety and compliance preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compliance Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable compliance tracking and monitoring
              </p>
            </div>
            <Switch
              checked={enableComplianceTracking}
              onCheckedChange={setEnableComplianceTracking}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Safety Reports</Label>
              <p className="text-sm text-muted-foreground">
                Display safety incident and compliance reports
              </p>
            </div>
            <Switch
              checked={showSafetyReports}
              onCheckedChange={setShowSafetyReports}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Safety Approval</Label>
              <p className="text-sm text-muted-foreground">
                Require approval for safety-related changes
              </p>
            </div>
            <Switch
              checked={requireSafetyApproval}
              onCheckedChange={setRequireSafetyApproval}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





