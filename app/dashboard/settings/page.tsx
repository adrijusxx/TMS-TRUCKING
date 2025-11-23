'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin } = usePermissions();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // Redirect based on role
    if (isAdmin) {
      router.replace('/dashboard/settings/admin');
    } else {
      router.replace('/dashboard/settings/employee');
    }
  }, [session, status, isAdmin, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to settings...</p>
      </div>
    </div>
  );
}

