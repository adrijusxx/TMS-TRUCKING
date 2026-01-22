'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserProfileSettings from '@/components/settings/UserProfileSettings';
import EmployeeGeneralSettings from '@/components/settings/EmployeeGeneralSettings';
import EmployeeNotificationsSettings from '@/components/settings/EmployeeNotificationsSettings';
import EmployeeSecuritySettings from '@/components/settings/EmployeeSecuritySettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import DispatcherSettings from '@/components/settings/role-specific/DispatcherSettings';
import AccountantSettings from '@/components/settings/role-specific/AccountantSettings';
import DriverSettings from '@/components/settings/role-specific/DriverSettings';
import HRSettings from '@/components/settings/role-specific/HRSettings';
import SafetySettings from '@/components/settings/role-specific/SafetySettings';
import FleetSettings from '@/components/settings/role-specific/FleetSettings';
import { User, Settings, Bell, Eye, Shield, Package, DollarSign, Truck, Users, AlertTriangle, Wrench, Phone } from 'lucide-react';
import type { UserRole } from '@/lib/permissions';
import { usePermissions } from '@/hooks/usePermissions';

import YokomobileIntegration from '@/components/settings/integrations/YokomobileIntegration';

export default function MyProfileCategory() {
  const { role } = usePermissions();

  // Get role-specific tab name and component
  const getRoleSpecificTab = () => {
    switch (role) {
      case 'DISPATCHER':
        return { name: 'Dispatch', value: 'dispatch', Icon: Package, component: <DispatcherSettings /> };
      case 'ACCOUNTANT':
        return { name: 'Accounting', value: 'accounting', Icon: DollarSign, component: <AccountantSettings /> };
      case 'DRIVER':
        return { name: 'Driver', value: 'driver', Icon: Truck, component: <DriverSettings /> };
      case 'HR':
        return { name: 'HR', value: 'hr', Icon: Users, component: <HRSettings /> };
      case 'SAFETY':
        return { name: 'Safety', value: 'safety', Icon: AlertTriangle, component: <SafetySettings /> };
      case 'FLEET':
        return { name: 'Fleet', value: 'fleet', Icon: Wrench, component: <FleetSettings /> };
      default:
        return null;
    }
  };

  const roleSpecificTab = getRoleSpecificTab();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">My Profile</h2>
        <p className="text-muted-foreground">
          Manage your account information, preferences, and settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="voip">
            <Phone className="h-4 w-4 mr-2" />
            VoIP
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Eye className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          {roleSpecificTab && (
            <TabsTrigger value={roleSpecificTab.value}>
              <roleSpecificTab.Icon className="h-4 w-4 mr-2" />
              {roleSpecificTab.name}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <UserProfileSettings />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <EmployeeGeneralSettings />
        </TabsContent>

        <TabsContent value="voip" className="space-y-6">
          <YokomobileIntegration />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <EmployeeNotificationsSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <EmployeeSecuritySettings />
        </TabsContent>

        {roleSpecificTab && (
          <TabsContent value={roleSpecificTab.value} className="space-y-6">
            {roleSpecificTab.component}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

