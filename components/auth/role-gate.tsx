'use client';

import { ReactNode } from 'react';
import { useCurrentRole } from '@/hooks/use-current-role';

interface RoleGateProps {
  /**
   * Array of role names that are allowed to see the children
   * Example: ['ADMIN', 'DISPATCHER']
   */
  allowedRoles: string[];
  /**
   * Content to render if user has the required role
   */
  children: ReactNode;
}

/**
 * RoleGate component - Conditionally renders children based on user role
 * 
 * Only renders children if the current user's role is in the allowedRoles array.
 * Returns null (renders nothing) if the user doesn't have the required role.
 * 
 * @example
 * <RoleGate allowedRoles={['ADMIN']}>
 *   <Button>Delete All</Button>
 * </RoleGate>
 */
export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { role } = useCurrentRole();
  
  // Check if user's role is in the allowed roles array
  if (!allowedRoles.includes(role)) {
    return null;
  }
  
  return <>{children}</>;
}





























