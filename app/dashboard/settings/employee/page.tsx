'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Settings as SettingsIcon, Bell, Eye, Shield, Package, DollarSign, Truck, Users, AlertTriangle, Wrench } from 'lucide-react';
import type { UserRole } from '@/lib/permissions';

// Map old tab names to new ones for backward compatibility
const tabMapping: Record<string, string> = {
  'general': 'general',
  'notifications': 'notifications',
  'appearance': 'appearance',
  'security': 'security',
};

export default function EmployeeSettingsPage() {
  const { data: session, status } = useSession();
  const { isAdmin, role } = usePermissions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  
  const normalizedTab = tabParam ? (tabMapping[tabParam] || tabParam) : 'general';
  const [activeTab, setActiveTab] = useState(normalizedTab);

  // Redirect admin users
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || isAdmin) {
      router.replace('/dashboard/settings/admin');
    }
  }, [session, status, isAdmin, router]);

  useEffect(() => {
    if (tabParam) {
      const mapped = tabMapping[tabParam] || tabParam;
      setActiveTab(mapped);
    } else {
      setActiveTab('general');
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'general') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    router.push(`/dashboard/settings/employee?${params.toString()}`, { scroll: false });
  };

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

  if (status === 'loading' || !session || isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Settings', href: '/dashboard/settings/employee' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">
              <SettingsIcon className="h-4 w-4 mr-2" />
              General
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
              Security & Privacy
            </TabsTrigger>
            {roleSpecificTab && (
              <TabsTrigger value={roleSpecificTab.value}>
                <roleSpecificTab.Icon className="h-4 w-4 mr-2" />
                {roleSpecificTab.name}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">General Settings</h2>
              <p className="text-muted-foreground">
                Manage your personal account settings and preferences
              </p>
            </div>
            <EmployeeGeneralSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-muted-foreground">
                Configure your notification preferences
              </p>
            </div>
            <EmployeeNotificationsSettings />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Appearance</h2>
              <p className="text-muted-foreground">
                Customize your interface appearance and theme
              </p>
            </div>
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Security & Privacy</h2>
              <p className="text-muted-foreground">
                Manage your account security settings
              </p>
            </div>
            <EmployeeSecuritySettings />
          </TabsContent>

          {roleSpecificTab && (
            <TabsContent value={roleSpecificTab.value} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{roleSpecificTab.name} Settings</h2>
                <p className="text-muted-foreground">
                  Configure role-specific settings and preferences
                </p>
              </div>
              {roleSpecificTab.component}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}

