export type Permission =
  // Load permissions
  | 'loads.view'
  | 'loads.create'
  | 'loads.edit'
  | 'loads.delete'
  | 'loads.assign'
  // Driver permissions
  | 'drivers.view'
  | 'drivers.create'
  | 'drivers.edit'
  | 'drivers.delete'
  | 'drivers.manage_compliance'
  // Fleet permissions
  | 'trucks.view'
  | 'trucks.create'
  | 'trucks.edit'
  | 'trucks.delete'
  | 'trailers.view'
  | 'trailers.create'
  | 'trailers.edit'
  | 'trailers.delete'
  // Customer permissions
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  // Financial permissions
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.generate'
  | 'settlements.view'
  | 'settlements.create'
  | 'settlements.edit'
  | 'settlements.delete'
  | 'settlements.approve'
  | 'expenses.view'
  | 'expenses.approve'
  // User management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  // Settings & Configuration
  | 'settings.view'
  | 'settings.edit'
  | 'settings.security'
  | 'settings.notifications'
  | 'settings.appearance'
  | 'company.view'
  | 'company.edit'
  | 'company.branding'
  // Analytics & Reports
  | 'analytics.view'
  | 'reports.view'
  | 'reports.export'
  // Documents
  | 'documents.view'
  | 'documents.upload'
  | 'documents.delete'
  // Safety & Compliance
  | 'safety.view'
  | 'safety.manage'
  | 'compliance.view'
  | 'compliance.manage'
  // Accounting & Batches
  | 'batches.view'
  | 'batches.create'
  | 'batches.edit'
  | 'batches.delete'
  | 'batches.post'
  | 'deduction_rules.view'
  | 'deduction_rules.create'
  | 'deduction_rules.edit'
  | 'deduction_rules.delete'
  | 'advances.view'
  | 'advances.create'
  | 'advances.approve'
  | 'advances.delete'
  // Fleet Operations
  | 'maintenance.view'
  | 'maintenance.create'
  | 'maintenance.edit'
  | 'maintenance.delete'
  | 'breakdowns.view'
  | 'breakdowns.create'
  | 'breakdowns.edit'
  | 'breakdowns.delete'
  | 'inspections.view'
  | 'inspections.create'
  | 'inspections.edit'
  | 'inspections.delete'
  | 'fuel.view'
  | 'fuel.create'
  | 'fuel.edit'
  | 'fuel.delete'
  | 'vendors.view'
  | 'vendors.create'
  | 'vendors.edit'
  | 'vendors.delete'
  // Extended Fleet Operations
  | 'fleet.reports'
  | 'fleet.costs'
  | 'fleet.communications'
  | 'fleet.hotspots'
  | 'fleet.on_call'
  // Data Management
  | 'import.view'
  | 'import.execute'
  | 'export.view'
  | 'export.execute'
  | 'mc_numbers.view'
  | 'mc_numbers.create'
  | 'mc_numbers.edit'
  | 'mc_numbers.delete'
  | 'locations.view'
  | 'locations.create'
  | 'locations.edit'
  | 'locations.delete'
  // Extended Data Management
  | 'data.bulk_actions'
  | 'data.backup'
  | 'data.restore'
  // System Features
  | 'automation.view'
  | 'automation.manage'
  | 'edi.view'
  | 'edi.manage'
  | 'calendar.view'
  | 'calendar.edit'
  | 'loadboard.view'
  | 'loadboard.post'
  // Safety Operations
  | 'safety.incidents.view'
  | 'safety.incidents.create'
  | 'safety.incidents.edit'
  | 'safety.incidents.delete'
  | 'safety.drug_tests.view'
  | 'safety.drug_tests.create'
  | 'safety.drug_tests.edit'
  | 'safety.mvr.view'
  | 'safety.mvr.create'
  | 'safety.mvr.edit'
  | 'safety.medical_cards.view'
  | 'safety.medical_cards.create'
  | 'safety.medical_cards.edit'
  | 'safety.hos.view'
  | 'safety.hos.manage'
  | 'safety.dvir.view'
  | 'safety.dvir.create'
  | 'safety.dvir.edit'
  | 'safety.training.view'
  | 'safety.training.manage'
  | 'safety.compliance.view'
  | 'safety.compliance.manage'
  | 'safety.alerts.view'
  | 'safety.alerts.manage'
  // Department Access
  | 'departments.accounting.view'
  | 'departments.fleet.view'
  | 'departments.safety.view'
  | 'departments.hr.view'
  | 'departments.reports.view'
  | 'departments.settings.view';

export type UserRole = 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER' | 'HR' | 'SAFETY' | 'FLEET';

// Default permissions for each role
export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to everything
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'expenses.view', 'expenses.approve',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance',
    'company.view', 'company.edit', 'company.branding',
    'analytics.view', 'reports.view', 'reports.export',
    'documents.view', 'documents.upload', 'documents.delete',
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    // Accounting & Batches
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    // Fleet Operations
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    // Extended Fleet Operations
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    // Data Management
    'import.view', 'import.execute',
    'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    // Extended Data Management
    'data.bulk_actions', 'data.backup', 'data.restore',
    // System Features
    'automation.view', 'automation.manage',
    'edi.view', 'edi.manage',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    // Safety Operations
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    // Department Access - All departments enabled by default for admin
    'departments.accounting.view',
    'departments.fleet.view',
    'departments.safety.view',
    'departments.hr.view',
    'departments.reports.view',
    'departments.settings.view',
  ],
  DISPATCHER: [
    // Load management and dispatch operations
    'loads.view', 'loads.create', 'loads.edit', 'loads.assign',
    'drivers.view',
    'trucks.view', 'trailers.view',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.generate',
    'settlements.view',
    'documents.view', 'documents.upload',
    'analytics.view', 'reports.view',
    'settings.view',
    // Basic fleet operations
    'breakdowns.view', 'breakdowns.create',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    // Department Access
    'departments.fleet.view',
    'departments.reports.view',
  ],
  ACCOUNTANT: [
    // Financial management and accounting
    'loads.view',
    'customers.view', 'customers.edit',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'expenses.view', 'expenses.approve',
    'documents.view', 'documents.upload',
    'analytics.view', 'reports.view', 'reports.export',
    'settings.view',
    // Accounting & Batches
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    // Department Access
    'departments.accounting.view',
    'departments.reports.view',
  ],
  DRIVER: [
    // Driver-specific access (only their assigned loads)
    'loads.view',
    'documents.view', 'documents.upload',
    'settings.view',
  ],
  CUSTOMER: [
    // Customer portal access (only their loads)
    'loads.view',
    'documents.view',
  ],
  HR: [
    // Human Resources management
    'users.view', 'users.create', 'users.edit',
    'drivers.view', 'drivers.create', 'drivers.edit',
    'settings.view', 'settings.edit',
    'company.view',
    'documents.view', 'documents.upload',
    'reports.view', 'reports.export',
    'analytics.view',
    // Department Access
    'departments.hr.view',
    'departments.reports.view',
  ],
  SAFETY: [
    // Safety and compliance management
    'drivers.view', 'drivers.edit', 'drivers.manage_compliance',
    'trucks.view', 'trucks.edit',
    'trailers.view', 'trailers.edit',
    'loads.view',
    'documents.view', 'documents.upload',
    'reports.view', 'reports.export',
    'settings.view',
    'safety.view', 'safety.manage',
    'compliance.view', 'compliance.manage',
    'analytics.view',
    // Safety Operations
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    // Department Access
    'departments.safety.view',
    'departments.reports.view',
  ],
  FLEET: [
    // Fleet management - trucks, trailers, maintenance, breakdowns
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'drivers.view', 'drivers.edit',
    'loads.view',
    'documents.view', 'documents.upload',
    'reports.view', 'reports.export',
    'settings.view',
    'analytics.view',
    // Fleet Operations
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    // Extended Fleet Operations
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    // Department Access
    'departments.fleet.view',
    'departments.reports.view',
  ],
};

/**
 * Check if a role has a specific permission (synchronous - uses defaults)
 * For database-backed permissions, use PermissionService.hasPermission() instead
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has a specific permission (async - checks database)
 * This is the preferred method for server-side code
 */
export async function hasPermissionAsync(role: UserRole, permission: Permission): Promise<boolean> {
  try {
    const { PermissionService } = await import('@/lib/services/PermissionService');
    return await PermissionService.hasPermission(role, permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    // Fallback to sync version
    return hasPermission(role, permission);
  }
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
 * Get all permissions for a role (synchronous - uses defaults)
 * For database-backed permissions, use PermissionService.getRolePermissions() instead
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Get all permissions for a role (async - checks database)
 * This is the preferred method for server-side code
 */
export async function getRolePermissionsAsync(role: UserRole): Promise<Permission[]> {
  try {
    const { PermissionService } = await import('@/lib/services/PermissionService');
    return await PermissionService.getRolePermissions(role);
  } catch (error) {
    console.error('Error getting role permissions:', error);
    // Fallback to sync version
    return getRolePermissions(role);
  }
}

/**
 * Get all available permissions (for permission management UI)
 */
export function getAllPermissions(): Permission[] {
  return [
    // Load permissions
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    // Driver permissions
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    // Fleet permissions
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    // Customer permissions
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    // Financial permissions
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'expenses.view', 'expenses.approve',
    // User management
    'users.view', 'users.create', 'users.edit', 'users.delete',
    // Settings & Configuration
    'settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance',
    'company.view', 'company.edit', 'company.branding',
    // Analytics & Reports
    'analytics.view', 'reports.view', 'reports.export',
    // Documents
    'documents.view', 'documents.upload', 'documents.delete',
    // Safety & Compliance
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    // Accounting & Batches
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    // Fleet Operations
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    // Extended Fleet Operations
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    // Data Management
    'import.view', 'import.execute',
    'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    // Extended Data Management
    'data.bulk_actions', 'data.backup', 'data.restore',
    // System Features
    'automation.view', 'automation.manage',
    'edi.view', 'edi.manage',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    // Safety Operations
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    // Department Access
    'departments.accounting.view',
    'departments.fleet.view',
    'departments.safety.view',
    'departments.hr.view',
    'departments.reports.view',
    'departments.settings.view',
  ];
}

