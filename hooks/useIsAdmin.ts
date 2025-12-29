'use client';

import { useSession } from 'next-auth/react';

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === 'ADMIN';
}




