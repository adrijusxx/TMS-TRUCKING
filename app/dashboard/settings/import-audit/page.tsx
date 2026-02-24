'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import ImportAuditDashboard from '@/components/import-export/ImportAuditDashboard';

export default function ImportAuditPage() {
  const { data: session, status } = useSession();
  const { isAdmin } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !isAdmin) {
      router.replace('/dashboard');
    }
  }, [session, status, isAdmin, router]);

  if (status === 'loading' || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Settings', href: '/dashboard/settings/admin' },
          { label: 'Import Audit' },
        ]}
      />
      <ImportAuditDashboard />
    </>
  );
}
