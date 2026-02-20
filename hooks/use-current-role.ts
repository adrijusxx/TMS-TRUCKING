'use client';

import { useSession } from 'next-auth/react';

/**
 * Hook to get the current user's role and admin status
 * Reads from NextAuth session
 */
export function useCurrentRole() {
  const { data: session } = useSession();

  const roleSlug = session?.user?.roleSlug || session?.user?.role?.toLowerCase().replace('_', '-') || 'customer';
  const isAdmin = roleSlug === 'admin' || roleSlug === 'super-admin';

  return {
    isAdmin,
    /** @deprecated Use roleSlug instead */
    role: session?.user?.role || 'CUSTOMER',
    roleSlug,
    roleId: session?.user?.roleId,
    roleName: session?.user?.roleName || session?.user?.role || 'Customer',
  };
}
