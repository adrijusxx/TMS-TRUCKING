'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, type Permission, type UserRole } from '@/lib/permissions';

export function usePermissions() {
  const { data: session, status } = useSession();
  
  // Return default permissions if session is loading or not available
  if (status === 'loading' || !session) {
    const defaultRole = 'CUSTOMER' as UserRole;
    return {
      role: defaultRole,
      can: () => false,
      canAny: () => false,
      canAll: () => false,
      isAdmin: false,
      isDispatcher: false,
      isAccountant: false,
      isDriver: false,
      isCustomer: true,
    };
  }
  
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

  const isEmployee = (): boolean => {
    return role !== 'ADMIN';
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
    isEmployee: isEmployee(),
  };
}

