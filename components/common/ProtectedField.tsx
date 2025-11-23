'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { isFieldVisible } from '@/lib/utils/permission-helpers';

interface ProtectedFieldProps {
  field: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ProtectedField component - conditionally renders content based on field visibility permissions
 * 
 * @example
 * <ProtectedField field="revenue" fallback={<span>***</span>}>
 *   <span>{formatCurrency(load.revenue)}</span>
 * </ProtectedField>
 */
export function ProtectedField({ field, children, fallback = null }: ProtectedFieldProps) {
  const { role } = usePermissions();

  if (!isFieldVisible(field, role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProtectedField;



