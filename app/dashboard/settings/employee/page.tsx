'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import MyProfileCategory from '@/components/settings/categories/MyProfileCategory';

// Map old tab names to new ones for backward compatibility
const tabMapping: Record<string, string> = {
  'general': 'profile',
  'notifications': 'profile',
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

  // Redirect old tabs to profile
  useEffect(() => {
    if (tabParam && tabMapping[tabParam] === 'profile' && tabParam !== 'profile') {
      router.replace('/dashboard/settings/employee?tab=profile', { scroll: false });
    }
  }, [tabParam, router]);

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

        {normalizedTab === 'profile' && <MyProfileCategory />}
      </div>
    </>
  );
}

