'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

/**
 * Hook to get the current user's role and admin status
 * Reads from NextAuth session
 * 
 * @returns { isAdmin: boolean, role: string } - User's role information
 */
export function useCurrentRole(): { isAdmin: boolean; role: string } {
  const { data: session } = useSession();
  
  const role = (session?.user?.role || 'CUSTOMER') as UserRole;
  const isAdmin = role === 'ADMIN';
  
  return {
    isAdmin,
    role,
  };
}



























