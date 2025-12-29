'use client';

import SecurityPrivacySettings from '@/components/settings/SecurityPrivacySettings';
import RolePermissions from '@/components/settings/RolePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function SecurityPrivacyCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Security & Privacy</h2>
        <p className="text-muted-foreground">
          Manage security settings, role permissions, and privacy controls
        </p>
      </div>

      <div className="space-y-6">
        <SecurityPrivacySettings />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Role Permissions</CardTitle>
            </div>
            <CardDescription>
              Configure permissions for different user roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RolePermissions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





