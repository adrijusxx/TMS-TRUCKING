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
          Set organization-wide password policies, session timeouts, login attempt limits, and audit log retention. These are default settings for all users. To configure security for individual users, go to Team &amp; Users and edit the user profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SecurityPrivacySettings />
        </div>

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





