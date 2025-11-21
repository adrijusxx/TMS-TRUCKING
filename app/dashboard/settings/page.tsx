'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanySettings from '@/components/settings/CompanySettings';
import RolePermissions from '@/components/settings/RolePermissions';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import IntegrationsSettings from '@/components/settings/IntegrationsSettings';
import UserManagement from '@/components/settings/UserManagement';
import SubscriptionBilling from '@/components/settings/SubscriptionBilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Bell, Plug, Shield, FileText, Users, Palette, CreditCard, Settings as SettingsIcon, Eye } from 'lucide-react';
import AppearanceSettings from '@/components/settings/AppearanceSettings';

// Placeholder components for new tabs
function SecurityPrivacySettings() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5" />
          Security & Privacy
        </h2>
        <p className="text-muted-foreground mb-6">
          Manage security settings and privacy preferences
        </p>
      </div>
      <RolePermissions />
    </div>
  );
}

function CustomFieldsSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Custom Fields
        </CardTitle>
        <CardDescription>
          Create and manage custom fields for your TMS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Custom fields management coming soon...</p>
      </CardContent>
    </Card>
  );
}

function CompanyBrandingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Company & Branding
        </CardTitle>
        <CardDescription>
          Customize your company branding and appearance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Company branding customization coming soon. Company information can be managed in the General tab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


// Map old tab names to new ones for backward compatibility
const tabMapping: Record<string, string> = {
  'company': 'general',
  'users': 'team',
  'billing': 'billing',
  'permissions': 'security',
  'notifications': 'notifications',
  'integrations': 'integrations',
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  
  const normalizedTab = tabParam ? (tabMapping[tabParam] || tabParam) : 'general';
  const [activeTab, setActiveTab] = useState(normalizedTab);

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
    router.push(`/dashboard/settings?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company settings
        </p>
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
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security & Privacy
          </TabsTrigger>
          <TabsTrigger value="custom-fields">
            <FileText className="h-4 w-4 mr-2" />
            Custom Fields
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Eye className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Company & Branding
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing & Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h2>
              <p className="text-muted-foreground mt-1">
                Basic company details
              </p>
            </div>
            <CompanySettings />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityPrivacySettings />
        </TabsContent>

        <TabsContent value="custom-fields" className="space-y-6">
          <CustomFieldsSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage users and team members
              </p>
            </div>
            <Tabs defaultValue="drivers" className="space-y-4">
              <TabsList>
                <TabsTrigger value="drivers">Drivers</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch Department</TabsTrigger>
                <TabsTrigger value="accounting">Accounting Department</TabsTrigger>
                <TabsTrigger value="safety">Safety Department</TabsTrigger>
                <TabsTrigger value="hr">HR Department</TabsTrigger>
              </TabsList>

              <TabsContent value="drivers">
                <UserManagement 
                  roleFilter="DRIVER" 
                  title="Drivers" 
                  description="Manage drivers in your organization" 
                />
              </TabsContent>

              <TabsContent value="dispatch">
                <UserManagement 
                  roleFilter="DISPATCHER" 
                  title="Dispatch Department" 
                  description="Manage dispatchers in your organization" 
                />
              </TabsContent>

              <TabsContent value="accounting">
                <UserManagement 
                  roleFilter="ACCOUNTANT" 
                  title="Accounting Department" 
                  description="Manage accountants and accounting staff" 
                />
              </TabsContent>

              <TabsContent value="safety">
                <UserManagement 
                  roleFilter="SAFETY" 
                  title="Safety Department" 
                  description="Manage safety department staff (Admins with safety access)" 
                />
              </TabsContent>

              <TabsContent value="hr">
                <UserManagement 
                  roleFilter="HR" 
                  title="HR Department" 
                  description="Manage HR department staff (Admins with HR access)" 
                />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <CompanyBrandingSettings />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <SubscriptionBilling />
        </TabsContent>
      </Tabs>
    </div>
  );
}

