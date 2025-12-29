'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import MyProfileCategory from '@/components/settings/categories/MyProfileCategory';
import NotificationsCategory from '@/components/settings/categories/NotificationsCategory';

// Map old tab names to new ones for backward compatibility
const tabMapping: Record<string, string> = {
  'general': 'profile',
  'notifications': 'notifications',
  'appearance': 'profile',
  'security': 'profile',
  'profile': 'profile',
};

export default function EmployeeSettingsPage() {
  const { data: session, status } = useSession();
  const { isAdmin } = usePermissions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const normalizedTab = tabParam ? (tabMapping[tabParam] || tabParam) : 'profile';

  // Redirect admin users
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || isAdmin) {
      router.replace('/dashboard/settings/admin');
    }
  }, [session, status, isAdmin, router]);

  if (status === 'loading' || !session || isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (normalizedTab) {
      case 'notifications':
        return <NotificationsCategory />;
      case 'profile':
      default:
        return <MyProfileCategory />;
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Settings', href: '/dashboard/settings/employee' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Settings</h1>
        </div>

        {renderContent()}
      </div>
    </>
  );
}

