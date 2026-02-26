'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { type Permission } from '@/lib/permissions';
import { hasPermission } from '@/lib/permissions'; // Fallback for loading state

/**
 * Hook to get user permissions from database (client-side)
 * Uses React Query to cache and fetch permissions
 *
 * IMPORTANT: `can`, `canAny`, `canAll` are memoized via useCallback to provide
 * stable references. This prevents infinite re-render loops when these functions
 * are used in useMemo/useEffect dependency arrays (e.g. in DataTableWrapper).
 */
export function usePermissions() {
  const { data: session, status } = useSession();

  const roleSlug = session?.user?.roleSlug || session?.user?.role?.toLowerCase().replace('_', '-') || 'customer';
  const roleId = session?.user?.roleId;
  const roleName = session?.user?.roleName || session?.user?.role || 'Customer';
  const sessionRole = (session?.user?.role || 'CUSTOMER') as string;

  // Fetch effective permissions from API (resolution engine)
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-permissions', session?.user?.id, roleId, roleSlug],
    queryFn: async () => {
      if (!session?.user) return null;

      const response = await fetch('/api/user/permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const result = await response.json();
      return result.data as { roleSlug: string; roleName: string; permissions: Permission[] };
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const isLoading = status === 'loading' || !session || permissionsLoading;
  const permissions = Array.isArray(permissionsData?.permissions) ? permissionsData.permissions : [];

  // Memoize permission-check functions so they are stable references across renders.
  // Deps only change when session/permissions actually change (not every render).
  const can = useCallback((permission: Permission): boolean => {
    if (isLoading) {
      return hasPermission(sessionRole, permission);
    }
    if (roleSlug === 'super-admin') return true;
    if (permissions.length > 0) return permissions.includes(permission);
    return hasPermission(sessionRole, permission);
  }, [isLoading, roleSlug, permissions, sessionRole]);

  const canAny = useCallback((permissionsList: Permission[]): boolean => {
    return permissionsList.some((p) => can(p));
  }, [can]);

  const canAll = useCallback((permissionsList: Permission[]): boolean => {
    return permissionsList.every((p) => can(p));
  }, [can]);

  return {
    /** @deprecated Use roleSlug instead */
    role: sessionRole,
    roleSlug,
    roleId,
    roleName,
    can,
    canAny,
    canAll,
    isAdmin: roleSlug === 'admin' || roleSlug === 'super-admin',
    isDispatcher: roleSlug === 'dispatcher',
    isAccountant: roleSlug === 'accountant',
    isDriver: roleSlug === 'driver',
    isCustomer: roleSlug === 'customer',
    isEmployee: roleSlug !== 'admin' && roleSlug !== 'super-admin',
    isSystemRole: isLoading ? true : (!roleId || ['super-admin', 'admin', 'dispatcher', 'driver', 'customer', 'accountant', 'hr', 'safety', 'fleet'].includes(roleSlug)),
    isLoading,
  };
}
