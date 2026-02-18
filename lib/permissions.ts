export type Permission =
  // Load permissions
  | 'loads.view'
  | 'loads.create'
  | 'loads.edit'
  | 'loads.delete'
  | 'loads.assign'
  | 'loads.bulk_edit'
  | 'loads.bulk_delete'
  // Driver permissions
  | 'drivers.view'
  | 'drivers.create'
  | 'drivers.edit'
  | 'drivers.delete'
  | 'drivers.manage_compliance'
  | 'drivers.bulk_edit'
  | 'drivers.bulk_delete'
  // Fleet permissions
  | 'trucks.view'
  | 'trucks.create'
  | 'trucks.edit'
  | 'trucks.delete'
  | 'trucks.bulk_edit'
  | 'trucks.bulk_delete'
  | 'trailers.view'
  | 'trailers.create'
  | 'trailers.edit'
  | 'trailers.delete'
  | 'trailers.bulk_edit'
  | 'trailers.bulk_delete'
  // Customer permissions
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  | 'customers.bulk_edit'
  | 'customers.bulk_delete'
  // Financial permissions
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.generate'
  | 'invoices.bulk_edit'
  | 'invoices.bulk_delete'
  | 'settlements.view'
  | 'settlements.create'
  | 'settlements.edit'
  | 'settlements.delete'
  | 'settlements.approve'
  | 'settlements.bulk_edit'
  | 'settlements.bulk_delete'
  | 'expenses.view'
  | 'expenses.approve'
  | 'factoring_companies.view'
  | 'factoring_companies.create'
  | 'factoring_companies.edit'
  | 'factoring_companies.delete'
  | 'factoring_companies.bulk_edit'
  | 'factoring_companies.bulk_delete'
  | 'rate_confirmations.view'
  | 'rate_confirmations.create'
  | 'rate_confirmations.edit'
  | 'rate_confirmations.delete'
  | 'rate_confirmations.bulk_edit'
  | 'rate_confirmations.bulk_delete'
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
  | 'documents.bulk_edit'
  | 'documents.bulk_delete'
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
  | 'batches.bulk_edit'
  | 'batches.bulk_delete'
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
  | 'maintenance.bulk_edit'
  | 'maintenance.bulk_delete'
  | 'breakdowns.view'
  | 'breakdowns.create'
  | 'breakdowns.edit'
  | 'breakdowns.delete'
  | 'breakdowns.bulk_edit'
  | 'breakdowns.bulk_delete'
  | 'inspections.view'
  | 'inspections.create'
  | 'inspections.edit'
  | 'inspections.delete'
  | 'inspections.bulk_edit'
  | 'inspections.bulk_delete'
  | 'fuel.view'
  | 'fuel.create'
  | 'fuel.edit'
  | 'fuel.delete'
  | 'vendors.view'
  | 'vendors.create'
  | 'vendors.edit'
  | 'vendors.delete'
  | 'vendors.bulk_edit'
  | 'vendors.bulk_delete'
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
  | 'locations.bulk_edit'
  | 'locations.bulk_delete'
  // Extended Data Management
  | 'data.bulk_actions'
  | 'data.bulk_edit'
  | 'data.bulk_delete'
  | 'data.import'
  | 'data.export'
  | 'data.column_visibility'
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
  | 'departments.settings.view'
  | 'departments.crm.view'
  // CRM / Recruiting permissions
  | 'crm.leads.view'
  | 'crm.leads.create'
  | 'crm.leads.edit'
  | 'crm.leads.delete'
  | 'crm.leads.assign'
  | 'crm.hire'
  | 'crm.onboarding.view'
  | 'crm.onboarding.manage'
  | 'crm.templates.manage';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER' | 'HR' | 'SAFETY' | 'FLEET';

// Default permissions for each role
export const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Full access to everything - explicitly listed for UI compatibility
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    'loads.bulk_edit', 'loads.bulk_delete',
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    'drivers.bulk_edit', 'drivers.bulk_delete',
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trucks.bulk_edit', 'trucks.bulk_delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'trailers.bulk_edit', 'trailers.bulk_delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'customers.bulk_edit', 'customers.bulk_delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'invoices.bulk_edit', 'invoices.bulk_delete',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'settlements.bulk_edit', 'settlements.bulk_delete',
    'expenses.view', 'expenses.approve',
    'factoring_companies.view', 'factoring_companies.create', 'factoring_companies.edit', 'factoring_companies.delete',
    'factoring_companies.bulk_edit', 'factoring_companies.bulk_delete',
    'rate_confirmations.view', 'rate_confirmations.create', 'rate_confirmations.edit', 'rate_confirmations.delete',
    'rate_confirmations.bulk_edit', 'rate_confirmations.bulk_delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance',
    'company.view', 'company.edit', 'company.branding',
    'analytics.view', 'reports.view', 'reports.export',
    'documents.view', 'documents.upload', 'documents.delete',
    'documents.bulk_edit', 'documents.bulk_delete',
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'batches.bulk_edit', 'batches.bulk_delete',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'maintenance.bulk_edit', 'maintenance.bulk_delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'breakdowns.bulk_edit', 'breakdowns.bulk_delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'inspections.bulk_edit', 'inspections.bulk_delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'vendors.bulk_edit', 'vendors.bulk_delete',
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    'import.view', 'import.execute',
    'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'locations.bulk_edit', 'locations.bulk_delete',
    'data.bulk_actions', 'data.bulk_edit', 'data.bulk_delete',
    'data.import', 'data.export', 'data.column_visibility',
    'data.backup', 'data.restore',
    'automation.view', 'automation.manage',
    'edi.view', 'edi.manage',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    'departments.accounting.view',
    'departments.fleet.view',
    'departments.safety.view',
    'departments.hr.view',
    'departments.reports.view',
    'departments.settings.view',
    'departments.crm.view',
    // CRM Permissions
    'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.delete', 'crm.leads.assign', 'crm.hire', 'crm.onboarding.view', 'crm.onboarding.manage', 'crm.templates.manage',
  ],
  ADMIN: [
    // Full access to everything
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    'loads.bulk_edit', 'loads.bulk_delete',
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    'drivers.bulk_edit', 'drivers.bulk_delete',
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trucks.bulk_edit', 'trucks.bulk_delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'trailers.bulk_edit', 'trailers.bulk_delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'customers.bulk_edit', 'customers.bulk_delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'invoices.bulk_edit', 'invoices.bulk_delete',
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
    'data.bulk_actions', 'data.bulk_edit', 'data.bulk_delete',
    'data.import', 'data.export', 'data.column_visibility',
    'data.backup', 'data.restore',
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
    'departments.crm.view',
    // CRM Permissions
    'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.delete', 'crm.leads.assign', 'crm.hire', 'crm.onboarding.view', 'crm.onboarding.manage', 'crm.templates.manage',
  ],
  DISPATCHER: [
    // Load management and dispatch operations
    'loads.view', 'loads.create', 'loads.edit', 'loads.assign',
    'drivers.view',
    'trucks.view', 'trailers.view',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.generate',
    'settlements.view',
    'documents.view', 'documents.upload', 'documents.delete', // Allow deletion for BOL/POD/rate confirmations
    'settings.view',
    // Basic fleet operations (Specific access instead of full department)
    'breakdowns.view',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    // Data Management
    'data.column_visibility',
    // Department Access - RESTRICTED
    // 'departments.fleet.view', // REMOVED: No full fleet dashboard
    // 'departments.reports.view', // REMOVED: No reports access
    'departments.settings.view', // Allow access to settings (profile)
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
    'departments.settings.view', // Allow access to settings (profile)
  ],
  DRIVER: [
    // Driver-specific access (only their assigned loads)
    'loads.view',
    'documents.view', 'documents.upload',
    'settings.view',
    // Department Access
    'departments.settings.view', // Allow access to settings (profile)
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
    'departments.settings.view', // Allow access to settings (profile)
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
    'departments.settings.view', // Allow access to settings (profile)
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
    'departments.settings.view', // Allow access to settings (profile)
  ],
};

/**
 * Check if a role has a specific permission (synchronous - uses defaults)
 * For database-backed permissions, use PermissionService.hasPermission() instead
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === 'SUPER_ADMIN') return true;
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}



/**
 * Check if a role has any of the specified permissions
 */
function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
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
 * Get all available permissions (for permission management UI)
 */
export function getAllPermissions(): Permission[] {
  return [
    // Load permissions
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    'loads.bulk_edit', 'loads.bulk_delete',
    // Driver permissions
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    'drivers.bulk_edit', 'drivers.bulk_delete',
    // Fleet permissions
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trucks.bulk_edit', 'trucks.bulk_delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'trailers.bulk_edit', 'trailers.bulk_delete',
    // Customer permissions
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'customers.bulk_edit', 'customers.bulk_delete',
    // Financial permissions
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'invoices.bulk_edit', 'invoices.bulk_delete',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'settlements.bulk_edit', 'settlements.bulk_delete',
    'expenses.view', 'expenses.approve',
    'factoring_companies.view', 'factoring_companies.create', 'factoring_companies.edit', 'factoring_companies.delete',
    'factoring_companies.bulk_edit', 'factoring_companies.bulk_delete',
    'rate_confirmations.view', 'rate_confirmations.create', 'rate_confirmations.edit', 'rate_confirmations.delete',
    'rate_confirmations.bulk_edit', 'rate_confirmations.bulk_delete',
    // User management
    'users.view', 'users.create', 'users.edit', 'users.delete',
    // Settings & Configuration
    'settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance',
    'company.view', 'company.edit', 'company.branding',
    // Analytics & Reports
    'analytics.view', 'reports.view', 'reports.export',
    // Documents
    'documents.view', 'documents.upload', 'documents.delete',
    'documents.bulk_edit', 'documents.bulk_delete',
    // Safety & Compliance
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    // Accounting & Batches
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'batches.bulk_edit', 'batches.bulk_delete',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    // Fleet Operations
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'maintenance.bulk_edit', 'maintenance.bulk_delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'breakdowns.bulk_edit', 'breakdowns.bulk_delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'inspections.bulk_edit', 'inspections.bulk_delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'vendors.bulk_edit', 'vendors.bulk_delete',
    // Extended Fleet Operations
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    // Data Management
    'import.view', 'import.execute',
    'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'locations.bulk_edit', 'locations.bulk_delete',
    // Extended Data Management
    'data.bulk_actions', 'data.bulk_edit', 'data.bulk_delete',
    'data.import', 'data.export', 'data.column_visibility',
    'data.backup', 'data.restore',
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
    'departments.crm.view',
    // CRM / Recruiting permissions
    'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.delete', 'crm.leads.assign', 'crm.hire', 'crm.onboarding.view', 'crm.onboarding.manage',
  ];
}

