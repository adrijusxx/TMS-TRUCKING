'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { type Permission } from '@/lib/permissions';
import { hasPermission } from '@/lib/permissions'; // Fallback for loading state

/**
 * Hook to get user permissions from database (client-side)
 * Uses React Query to cache and fetch permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession();

  const roleSlug = session?.user?.roleSlug || session?.user?.role?.toLowerCase().replace('_', '-') || 'customer';
  const roleId = session?.user?.roleId;
  const roleName = session?.user?.roleName || session?.user?.role || 'Customer';

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

  // Return default permissions if session is loading or not available
  if (status === 'loading' || !session || permissionsLoading) {
    const defaultRole = (session?.user?.role || 'CUSTOMER') as string;

    return {
      /** @deprecated Use roleSlug instead */
      role: defaultRole,
      roleSlug,
      roleId,
      roleName,
      can: (permission: Permission) => hasPermission(defaultRole, permission),
      canAny: (permissions: Permission[]) => permissions.some((p) => hasPermission(defaultRole, p)),
      canAll: (permissions: Permission[]) => permissions.every((p) => hasPermission(defaultRole, p)),
      isAdmin: roleSlug === 'admin' || roleSlug === 'super-admin',
      isDispatcher: roleSlug === 'dispatcher',
      isAccountant: roleSlug === 'accountant',
      isDriver: roleSlug === 'driver',
      isCustomer: roleSlug === 'customer',
      isEmployee: roleSlug !== 'admin' && roleSlug !== 'super-admin',
      isSystemRole: true, // assume system during loading
      isLoading: true,
    };
  }

  const permissions = Array.isArray(permissionsData?.permissions) ? permissionsData.permissions : [];

  const can = (permission: Permission): boolean => {
    if (roleSlug === 'super-admin') return true;
    if (permissions.length > 0) return permissions.includes(permission);
    // Fallback to static defaults
    return hasPermission(session.user.role || 'CUSTOMER', permission);
  };

  const canAny = (permissionsList: Permission[]): boolean => {
    return permissionsList.some((p) => can(p));
  };

  const canAll = (permissionsList: Permission[]): boolean => {
    return permissionsList.every((p) => can(p));
  };

  return {
    /** @deprecated Use roleSlug instead */
    role: session.user.role || roleSlug.toUpperCase(),
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
    isSystemRole: !roleId || ['super-admin', 'admin', 'dispatcher', 'driver', 'customer', 'accountant', 'hr', 'safety', 'fleet'].includes(roleSlug),
    isLoading: false,
  };
}
