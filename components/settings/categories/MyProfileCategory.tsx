'use client';

import UserProfileSettings from '@/components/settings/UserProfileSettings';
import EmployeeGeneralSettings from '@/components/settings/EmployeeGeneralSettings';
import EmployeeNotificationsSettings from '@/components/settings/EmployeeNotificationsSettings';
import EmployeeSecuritySettings from '@/components/settings/EmployeeSecuritySettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import DispatcherSettings from '@/components/settings/role-specific/DispatcherSettings';
import AccountantSettings from '@/components/settings/role-specific/AccountantSettings';
import DriverSettings from '@/components/settings/role-specific/DriverSettings';
import SafetySettings from '@/components/settings/role-specific/SafetySettings';
import FleetSettings from '@/components/settings/role-specific/FleetSettings';
import YokomobileIntegration from '@/components/settings/integrations/YokomobileIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings, Bell, Eye, Shield, Phone, Package, DollarSign, Truck, AlertTriangle, Wrench } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function MyProfileCategory() {
  const { role } = usePermissions();

  const getRoleSection = () => {
    switch (role) {
      case 'DISPATCHER':
        return { name: 'Dispatch Settings', Icon: Package, component: <DispatcherSettings /> };
      case 'ACCOUNTANT':
        return { name: 'Accounting Settings', Icon: DollarSign, component: <AccountantSettings /> };
      case 'DRIVER':
        return { name: 'Driver Settings', Icon: Truck, component: <DriverSettings /> };
      case 'SAFETY':
        return { name: 'Safety Settings', Icon: AlertTriangle, component: <SafetySettings /> };
      case 'FLEET':
        return { name: 'Fleet Settings', Icon: Wrench, component: <FleetSettings /> };
      default:
        return null;
    }
  };

  const roleSection = getRoleSection();

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

          {roleSection && (
            <ProfileSection title={roleSection.name} icon={roleSection.Icon}>
              {roleSection.component}
            </ProfileSection>
          )}
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
