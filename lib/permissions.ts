export type Permission =
  | 'loads.view'
  | 'loads.create'
  | 'loads.edit'
  | 'loads.delete'
  | 'loads.assign'
  | 'drivers.view'
  | 'drivers.create'
  | 'drivers.edit'
  | 'drivers.delete'
  | 'trucks.view'
  | 'trucks.create'
  | 'trucks.edit'
  | 'trucks.delete'
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.generate'
  | 'settlements.view'
  | 'settlements.create'
  | 'settlements.edit'
  | 'settlements.delete'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'settings.view'
  | 'settings.edit'
  | 'company.edit'
  | 'analytics.view'
  | 'reports.view'
  | 'documents.view'
  | 'documents.upload'
  | 'documents.delete';

export type UserRole = 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';

// Default permissions for each role
export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access
    'loads.view',
    'loads.create',
    'loads.edit',
    'loads.delete',
    'loads.assign',
    'drivers.view',
    'drivers.create',
    'drivers.edit',
    'drivers.delete',
    'trucks.view',
    'trucks.create',
    'trucks.edit',
    'trucks.delete',
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'invoices.generate',
    'settlements.view',
    'settlements.create',
    'settlements.edit',
    'settlements.delete',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'company.edit',
    'analytics.view',
    'reports.view',
    'documents.view',
    'documents.upload',
    'documents.delete',
  ],
  DISPATCHER: [
    // Load management and dispatch
    'loads.view',
    'loads.create',
    'loads.edit',
    'loads.assign',
    'drivers.view',
    'trucks.view',
    'customers.view',
    'customers.create',
    'customers.edit',
    'invoices.view',
    'invoices.generate',
    'settlements.view',
    'documents.view',
    'documents.upload',
    'analytics.view',
    'reports.view',
  ],
  ACCOUNTANT: [
    // Financial management
    'loads.view',
    'customers.view',
    'customers.edit',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'invoices.generate',
    'settlements.view',
    'settlements.create',
    'settlements.edit',
    'settlements.delete',
    'documents.view',
    'documents.upload',
    'analytics.view',
    'reports.view',
  ],
  DRIVER: [
    // Driver-specific access
    'loads.view', // Only their assigned loads
    'documents.view',
    'documents.upload',
  ],
  CUSTOMER: [
    // Customer portal access
    'loads.view', // Only their loads
    'documents.view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Get all available permissions (for permission management UI)
 */
export function getAllPermissions(): Permission[] {
  return [
    'loads.view',
    'loads.create',
    'loads.edit',
    'loads.delete',
    'loads.assign',
    'drivers.view',
    'drivers.create',
    'drivers.edit',
    'drivers.delete',
    'trucks.view',
    'trucks.create',
    'trucks.edit',
    'trucks.delete',
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'invoices.generate',
    'settlements.view',
    'settlements.create',
    'settlements.edit',
    'settlements.delete',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'company.edit',
    'analytics.view',
    'reports.view',
    'documents.view',
    'documents.upload',
    'documents.delete',
  ];
}

