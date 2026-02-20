'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import CompanyOrganizationCategory from '@/components/settings/categories/CompanyOrganizationCategory';
import TeamUsersCategory from '@/components/settings/categories/TeamUsersCategory';
import SystemConfigCategory from '@/components/settings/categories/SystemConfigCategory';
import CustomizationsCategory from '@/components/settings/categories/CustomizationsCategory';
import IntegrationsCategory from '@/components/settings/categories/IntegrationsCategory';
import NotificationsCategory from '@/components/settings/categories/NotificationsCategory';
import SecurityPrivacyCategory from '@/components/settings/categories/SecurityPrivacyCategory';
import BillingSubscriptionCategory from '@/components/settings/categories/BillingSubscriptionCategory';
import DataManagementCategory from '@/components/settings/categories/DataManagementCategory';
import DeletedItemsCategory from '@/components/settings/categories/DeletedItemsCategory';
import AuditHistoryCategory from '@/components/settings/categories/AuditHistoryCategory';
import ScheduledJobsCategory from '@/components/settings/categories/ScheduledJobsCategory';

import MyProfileCategory from '@/components/settings/categories/MyProfileCategory';

// Map old tab names to new category names for backward compatibility
const tabMapping: Record<string, string> = {
  'profile': 'profile',
  'company': 'company',
  'general': 'system',
  'users': 'team',
  'team': 'team',
  'billing': 'billing',
  'permissions': 'security',
  'security': 'security',
  'notifications': 'notifications',
  'integrations': 'integrations',
  'custom-fields': 'system',
  'appearance': 'system',
  'branding': 'company',
  'data-management': 'data-management',
  'deleted-items': 'deleted-items',
  'audit-history': 'audit-history',
  'customizations': 'customizations',
  'scheduled-jobs': 'scheduled-jobs',
};

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const { isAdmin } = usePermissions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const normalizedTab = tabParam ? (tabMapping[tabParam] || tabParam) : 'company';
  const [activeTab, setActiveTab] = useState(normalizedTab);

  // Update active tab when tabParam changes
  useEffect(() => {
    if (tabParam) {
      const mapped = tabMapping[tabParam] || tabParam;
      setActiveTab(mapped);
    } else {
      setActiveTab('company');
    }
  }, [tabParam]);

  // Redirect non-admin users immediately
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/api/auth/signin');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard/settings/employee');
      return;
    }
  }, [session, status, isAdmin, router]);

  // Don't render anything if not admin or still loading
  if (status === 'loading' || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderCategoryContent = () => {
    switch (activeTab) {
      case 'profile':
        return <MyProfileCategory />;
      case 'company':
        return <CompanyOrganizationCategory />;
      case 'team':
        return <TeamUsersCategory />;
      case 'system':
        return <SystemConfigCategory />;
      case 'customizations':
        return <CustomizationsCategory />;
      case 'integrations':
        return <IntegrationsCategory />;
      case 'notifications':
        return <NotificationsCategory />;
      case 'security':
        return <SecurityPrivacyCategory />;
      case 'billing':
        return <BillingSubscriptionCategory />;
      case 'data-management':
        return <DataManagementCategory />;
      case 'deleted-items':
        return <DeletedItemsCategory />;
      case 'audit-history':
        return <AuditHistoryCategory />;
      case 'scheduled-jobs':
        return <ScheduledJobsCategory />;
      default:
        return <CompanyOrganizationCategory />;
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Settings', href: '/dashboard/settings/admin' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
        </div>

        <div className="space-y-6">
          {renderCategoryContent()}
        </div>
      </div>
    </>
  );
}

