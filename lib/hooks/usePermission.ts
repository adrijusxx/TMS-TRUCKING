'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { hasPermission, type Permission } from '@/lib/permissions';

/**
 * Check if the current user has a specific permission.
 * Returns { allowed, loading } so components can render conditionally.
 */
export function usePermission(permission: Permission) {
  const { data: session, status } = useSession();

  const allowed = useMemo(() => {
    if (!session?.user?.role) return false;
    return hasPermission(session.user.role, permission);
  }, [session?.user?.role, permission]);

  return { allowed, loading: status === 'loading' };
}

/**
 * Check if the current user has any of the specified permissions.
 */
export function useAnyPermission(permissions: Permission[]) {
  const { data: session, status } = useSession();

  const allowed = useMemo(() => {
    if (!session?.user?.role) return false;
    return permissions.some((p) => hasPermission(session.user.role, p));
  }, [session?.user?.role, permissions]);

  return { allowed, loading: status === 'loading' };
}

/**
 * Check if the current user has all of the specified permissions.
 */
export function useAllPermissions(permissions: Permission[]) {
  const { data: session, status } = useSession();

  const allowed = useMemo(() => {
    if (!session?.user?.role) return false;
    return permissions.every((p) => hasPermission(session.user.role, p));
  }, [session?.user?.role, permissions]);

  return { allowed, loading: status === 'loading' };
}
