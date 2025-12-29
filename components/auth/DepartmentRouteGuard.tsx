'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hasRouteAccess } from '@/lib/department-access';
import type { UserRole } from '@/lib/permissions';

interface DepartmentRouteGuardProps {
  children: React.ReactNode;
}

export default function DepartmentRouteGuard({ children }: DepartmentRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    // Only check department access for routes that require it (not dashboard home)
    if (pathname && pathname !== '/dashboard' && pathname.startsWith('/dashboard/')) {
      const role = (session.user.role || 'CUSTOMER') as UserRole;
      const hasAccess = hasRouteAccess(role, pathname);

      if (!hasAccess) {
        // Redirect to dashboard home if access is denied
        router.push('/dashboard');
      }
    }
  }, [pathname, session, router]);

  return <>{children}</>;
}

