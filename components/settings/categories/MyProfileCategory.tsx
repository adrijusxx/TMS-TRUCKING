'use client';

import UserProfileSettings from '@/components/settings/UserProfileSettings';
import EmployeeGeneralSettings from '@/components/settings/EmployeeGeneralSettings';
import EmployeeNotificationsSettings from '@/components/settings/EmployeeNotificationsSettings';
import EmployeeSecuritySettings from '@/components/settings/EmployeeSecuritySettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import YokomobileIntegration from '@/components/settings/integrations/YokomobileIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings, Bell, Eye, Shield, Phone } from 'lucide-react';

export default function MyProfileCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">My Profile</h2>
        <p className="text-muted-foreground">
          Update your personal information, notification preferences, appearance settings, and security options like password changes. Role-specific settings are available based on your assigned role.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <ProfileSection title="Profile" icon={User}>
            <UserProfileSettings />
          </ProfileSection>

          <ProfileSection title="Preferences" icon={Settings}>
            <EmployeeGeneralSettings />
          </ProfileSection>

          <ProfileSection title="Security" icon={Shield}>
            <EmployeeSecuritySettings />
          </ProfileSection>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProfileSection title="Notifications" icon={Bell}>
            <EmployeeNotificationsSettings />
          </ProfileSection>

          <ProfileSection title="Appearance" icon={Eye}>
            <AppearanceSettings />
          </ProfileSection>

          <ProfileSection title="VoIP" icon={Phone}>
            <YokomobileIntegration />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
