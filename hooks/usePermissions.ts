'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { type Permission, type UserRole } from '@/lib/permissions';
import { hasPermission } from '@/lib/permissions'; // Fallback for loading state

/**
 * Hook to get user permissions from database (client-side)
 * Uses React Query to cache and fetch permissions
 */
export function usePermissions() {
  const { data: session, status } = useSession();

  // Fetch permissions from API (database-backed)
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-permissions', session?.user?.role],
    queryFn: async () => {
      if (!session?.user) return null;

      const response = await fetch('/api/user/permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const result = await response.json();
      return result.data as { role: UserRole; permissions: Permission[] };
    },
    enabled: !!session?.user, // Only fetch if session exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Return default permissions if session is loading or not available
  if (status === 'loading' || !session || permissionsLoading) {
    const defaultRole = (session?.user?.role || 'CUSTOMER') as UserRole;

    return {
      role: defaultRole,
      can: (permission: Permission) => hasPermission(defaultRole, permission),
      canAny: (permissions: Permission[]) => permissions.some((p) => hasPermission(defaultRole, p)),
      canAll: (permissions: Permission[]) => permissions.every((p) => hasPermission(defaultRole, p)),
      isAdmin: defaultRole === 'ADMIN' || defaultRole === 'SUPER_ADMIN',
      isDispatcher: defaultRole === 'DISPATCHER',
      isAccountant: defaultRole === 'ACCOUNTANT',
      isDriver: defaultRole === 'DRIVER',
      isCustomer: defaultRole === 'CUSTOMER',
      isEmployee: defaultRole !== 'ADMIN',
      isLoading: true,
    };
  }

  const role = (session?.user?.role || 'CUSTOMER') as UserRole;
  const permissions = permissionsData?.permissions || [];

  const can = (permission: Permission): boolean => {
    // Use database permissions if available, otherwise fallback to static
    if (permissions.length > 0) {
      return permissions.includes(permission);
    }
    return hasPermission(role, permission);
  };

  const canAny = (permissionsList: Permission[]): boolean => {
    if (permissions.length > 0) {
      return permissionsList.some((permission) => permissions.includes(permission));
    }
    return permissionsList.some((permission) => hasPermission(role, permission));
  };

  const canAll = (permissionsList: Permission[]): boolean => {
    if (permissions.length > 0) {
      return permissionsList.every((permission) => permissions.includes(permission));
    }
    return permissionsList.every((permission) => hasPermission(role, permission));
  };

  const isEmployee = (): boolean => {
    return role !== 'ADMIN';
  };

  return {
    role,
    can,
    canAny,
    canAll,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isDispatcher: role === 'DISPATCHER',
    isAccountant: role === 'ACCOUNTANT',
    isDriver: role === 'DRIVER',
    isCustomer: role === 'CUSTOMER',
    isEmployee: isEmployee(),
    isLoading: false,
  };
}

