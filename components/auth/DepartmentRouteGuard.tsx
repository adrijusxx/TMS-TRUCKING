'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { getDepartmentForRoute } from '@/lib/department-access';

interface DepartmentRouteGuardProps {
  children: React.ReactNode;
}

export default function DepartmentRouteGuard({ children }: DepartmentRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { can, isLoading } = usePermissions();

  useEffect(() => {
    if (!session?.user || isLoading) {
      return;
    }

    // Only check department access for routes that require it (not dashboard home)
    if (pathname && pathname !== '/dashboard' && pathname.startsWith('/dashboard/')) {
      const requiredPermission = getDepartmentForRoute(pathname);

      if (requiredPermission && !can(requiredPermission)) {
        router.push('/dashboard');
      }
    }
  }, [pathname, session, router, can, isLoading]);

  return <>{children}</>;
}
