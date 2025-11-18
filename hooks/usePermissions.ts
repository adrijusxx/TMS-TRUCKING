'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, type Permission, type UserRole } from '@/lib/permissions';

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user?.role || 'CUSTOMER') as UserRole;

  const can = (permission: Permission): boolean => {
    return hasPermission(role, permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(role, permission));
  };

  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(role, permission));
  };

  return {
    role,
    can,
    canAny,
    canAll,
    isAdmin: role === 'ADMIN',
    isDispatcher: role === 'DISPATCHER',
    isAccountant: role === 'ACCOUNTANT',
    isDriver: role === 'DRIVER',
    isCustomer: role === 'CUSTOMER',
  };
}

