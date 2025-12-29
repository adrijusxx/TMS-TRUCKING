'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users, FileText, Shield } from 'lucide-react';

export default function HRSettings() {
  const [enableEmployeeManagement, setEnableEmployeeManagement] = useState(true);
  const [showComplianceReports, setShowComplianceReports] = useState(true);
  const [requireDocumentApproval, setRequireDocumentApproval] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>HR Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure your HR management preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Employee Management</Label>
              <p className="text-sm text-muted-foreground">
                Enable employee management features
              </p>
            </div>
            <Switch
              checked={enableEmployeeManagement}
              onCheckedChange={setEnableEmployeeManagement}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Compliance Reports</Label>
              <p className="text-sm text-muted-foreground">
                Display compliance and training reports
              </p>
            </div>
            <Switch
              checked={showComplianceReports}
              onCheckedChange={setShowComplianceReports}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Document Approval</Label>
              <p className="text-sm text-muted-foreground">
                Require approval for driver document updates
              </p>
            </div>
            <Switch
              checked={requireDocumentApproval}
              onCheckedChange={setRequireDocumentApproval}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





