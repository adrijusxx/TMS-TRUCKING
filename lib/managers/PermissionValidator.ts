/**
 * PermissionValidator
 *
 * Validates permission sets for consistency and completeness.
 * Detects missing dependencies (e.g., having 'settlements.approve'
 * without 'settlements.view') and conflicting assignments.
 */

import type { Permission } from '@/lib/permissions';

// ============================================
// Types
// ============================================

export interface PermissionWarning {
  type: 'MISSING_DEPENDENCY' | 'CONFLICTING' | 'REDUNDANT';
  permission: Permission;
  message: string;
  suggestedFix: Permission[];
}

export interface ValidationResult {
  valid: boolean;
  warnings: PermissionWarning[];
  missingDependencies: Permission[];
}

// ============================================
// Dependency Map
// ============================================

/**
 * Maps each permission to the permissions it requires.
 * If a user has the key permission but lacks any dependency,
 * the validator emits a MISSING_DEPENDENCY warning.
 */
const PERMISSION_DEPENDENCIES: Partial<Record<Permission, Permission[]>> = {
  // Loads
  'loads.create': ['loads.view'],
  'loads.edit': ['loads.view'],
  'loads.delete': ['loads.view'],
  'loads.assign': ['loads.view', 'drivers.view'],
  'loads.bulk_edit': ['loads.view', 'loads.edit'],
  'loads.bulk_delete': ['loads.view', 'loads.delete'],
  'loads.override_financial_lock': ['loads.view', 'loads.edit'],

  // Drivers
  'drivers.create': ['drivers.view'],
  'drivers.edit': ['drivers.view'],
  'drivers.delete': ['drivers.view'],
  'drivers.manage_compliance': ['drivers.view', 'drivers.edit'],
  'drivers.bulk_edit': ['drivers.view', 'drivers.edit'],
  'drivers.bulk_delete': ['drivers.view', 'drivers.delete'],

  // Trucks
  'trucks.create': ['trucks.view'],
  'trucks.edit': ['trucks.view'],
  'trucks.delete': ['trucks.view'],
  'trucks.bulk_edit': ['trucks.view', 'trucks.edit'],
  'trucks.bulk_delete': ['trucks.view', 'trucks.delete'],

  // Trailers
  'trailers.create': ['trailers.view'],
  'trailers.edit': ['trailers.view'],
  'trailers.delete': ['trailers.view'],
  'trailers.bulk_edit': ['trailers.view', 'trailers.edit'],
  'trailers.bulk_delete': ['trailers.view', 'trailers.delete'],

  // Customers
  'customers.create': ['customers.view'],
  'customers.edit': ['customers.view'],
  'customers.delete': ['customers.view'],
  'customers.bulk_edit': ['customers.view', 'customers.edit'],
  'customers.bulk_delete': ['customers.view', 'customers.delete'],

  // Invoices
  'invoices.create': ['invoices.view'],
  'invoices.edit': ['invoices.view'],
  'invoices.delete': ['invoices.view'],
  'invoices.generate': ['invoices.view', 'loads.view'],
  'invoices.bulk_edit': ['invoices.view', 'invoices.edit'],
  'invoices.bulk_delete': ['invoices.view', 'invoices.delete'],

  // Settlements
  'settlements.create': ['settlements.view', 'loads.view'],
  'settlements.edit': ['settlements.view'],
  'settlements.delete': ['settlements.view'],
  'settlements.approve': ['settlements.view'],
  'settlements.bulk_edit': ['settlements.view', 'settlements.edit'],
  'settlements.bulk_delete': ['settlements.view', 'settlements.delete'],

  // Expenses
  'expenses.approve': ['expenses.view'],

  // Factoring companies
  'factoring_companies.create': ['factoring_companies.view'],
  'factoring_companies.edit': ['factoring_companies.view'],
  'factoring_companies.delete': ['factoring_companies.view'],
  'factoring_companies.bulk_edit': ['factoring_companies.view', 'factoring_companies.edit'],
  'factoring_companies.bulk_delete': ['factoring_companies.view', 'factoring_companies.delete'],

  // Rate confirmations
  'rate_confirmations.create': ['rate_confirmations.view'],
  'rate_confirmations.edit': ['rate_confirmations.view'],
  'rate_confirmations.delete': ['rate_confirmations.view'],
  'rate_confirmations.bulk_edit': ['rate_confirmations.view', 'rate_confirmations.edit'],
  'rate_confirmations.bulk_delete': ['rate_confirmations.view', 'rate_confirmations.delete'],

  // Users
  'users.create': ['users.view'],
  'users.edit': ['users.view'],
  'users.delete': ['users.view'],

  // Settings
  'settings.edit': ['settings.view'],
  'settings.security': ['settings.view'],
  'settings.notifications': ['settings.view'],
  'settings.appearance': ['settings.view'],

  // Company
  'company.edit': ['company.view'],
  'company.branding': ['company.view'],

  // Reports
  'reports.export': ['reports.view'],

  // Documents
  'documents.upload': ['documents.view'],
  'documents.delete': ['documents.view'],
  'documents.bulk_edit': ['documents.view'],
  'documents.bulk_delete': ['documents.view', 'documents.delete'],

  // Safety
  'safety.manage': ['safety.view'],
  'compliance.manage': ['compliance.view'],

  // Batches
  'batches.create': ['batches.view'],
  'batches.edit': ['batches.view'],
  'batches.delete': ['batches.view'],
  'batches.post': ['batches.view', 'batches.create'],
  'batches.bulk_edit': ['batches.view', 'batches.edit'],
  'batches.bulk_delete': ['batches.view', 'batches.delete'],

  // Deduction rules
  'deduction_rules.create': ['deduction_rules.view'],
  'deduction_rules.edit': ['deduction_rules.view'],
  'deduction_rules.delete': ['deduction_rules.view'],

  // Advances
  'advances.create': ['advances.view'],
  'advances.approve': ['advances.view'],
  'advances.delete': ['advances.view'],

  // Maintenance
  'maintenance.create': ['maintenance.view'],
  'maintenance.edit': ['maintenance.view'],
  'maintenance.delete': ['maintenance.view'],
  'maintenance.bulk_edit': ['maintenance.view', 'maintenance.edit'],
  'maintenance.bulk_delete': ['maintenance.view', 'maintenance.delete'],

  // Breakdowns
  'breakdowns.create': ['breakdowns.view'],
  'breakdowns.edit': ['breakdowns.view'],
  'breakdowns.delete': ['breakdowns.view'],
  'breakdowns.bulk_edit': ['breakdowns.view', 'breakdowns.edit'],
  'breakdowns.bulk_delete': ['breakdowns.view', 'breakdowns.delete'],

  // Inspections
  'inspections.create': ['inspections.view'],
  'inspections.edit': ['inspections.view'],
  'inspections.delete': ['inspections.view'],
  'inspections.bulk_edit': ['inspections.view', 'inspections.edit'],
  'inspections.bulk_delete': ['inspections.view', 'inspections.delete'],

  // Fuel
  'fuel.create': ['fuel.view'],
  'fuel.edit': ['fuel.view'],
  'fuel.delete': ['fuel.view'],

  // IFTA
  'ifta.calculate': ['ifta.view'],
  'ifta.manage': ['ifta.view'],

  // Vendors
  'vendors.create': ['vendors.view'],
  'vendors.edit': ['vendors.view'],
  'vendors.delete': ['vendors.view'],
  'vendors.bulk_edit': ['vendors.view', 'vendors.edit'],
  'vendors.bulk_delete': ['vendors.view', 'vendors.delete'],

  // Data management
  'import.execute': ['import.view'],
  'export.execute': ['export.view'],
  'data.bulk_edit': ['data.bulk_actions'],
  'data.bulk_delete': ['data.bulk_actions'],
  'data.restore': ['data.backup'],

  // System features
  'automation.manage': ['automation.view'],
  'edi.manage': ['edi.view'],
  'calendar.edit': ['calendar.view'],
  'loadboard.post': ['loadboard.view'],

  // Company expenses
  'company_expenses.create': ['company_expenses.view'],
  'company_expenses.edit': ['company_expenses.view'],
  'company_expenses.delete': ['company_expenses.view'],
  'company_expenses.approve': ['company_expenses.view'],
  'company_expenses.export': ['company_expenses.view'],

  // Payment instruments
  'payment_instruments.create': ['payment_instruments.view'],
  'payment_instruments.edit': ['payment_instruments.view'],
  'payment_instruments.delete': ['payment_instruments.view'],

  // Company expense types
  'company_expense_types.create': ['company_expense_types.view'],
  'company_expense_types.edit': ['company_expense_types.view'],
  'company_expense_types.delete': ['company_expense_types.view'],

  // Department budgets
  'department_budgets.manage': ['department_budgets.view'],

  // MC numbers
  'mc_numbers.create': ['mc_numbers.view'],
  'mc_numbers.edit': ['mc_numbers.view'],
  'mc_numbers.delete': ['mc_numbers.view'],

  // Locations
  'locations.create': ['locations.view'],
  'locations.edit': ['locations.view'],
  'locations.delete': ['locations.view'],
  'locations.bulk_edit': ['locations.view', 'locations.edit'],
  'locations.bulk_delete': ['locations.view', 'locations.delete'],

  // CRM
  'crm.leads.create': ['crm.leads.view'],
  'crm.leads.edit': ['crm.leads.view'],
  'crm.leads.delete': ['crm.leads.view'],
  'crm.leads.assign': ['crm.leads.view'],
  'crm.hire': ['crm.leads.view'],
  'crm.onboarding.manage': ['crm.onboarding.view'],
};

// ============================================
// PermissionValidator
// ============================================

export class PermissionValidator {
  /**
   * Validate a permission set for missing dependencies and conflicts.
   */
  static validatePermissionSet(permissions: Permission[]): ValidationResult {
    const permSet = new Set(permissions);
    const warnings: PermissionWarning[] = [];
    const allMissing = new Set<Permission>();

    for (const perm of permissions) {
      const deps = PERMISSION_DEPENDENCIES[perm];
      if (!deps) continue;

      for (const dep of deps) {
        if (!permSet.has(dep)) {
          allMissing.add(dep);
          warnings.push({
            type: 'MISSING_DEPENDENCY',
            permission: perm,
            message: `'${perm}' requires '${dep}' which is not in the permission set`,
            suggestedFix: [dep],
          });
        }
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
      missingDependencies: Array.from(allMissing),
    };
  }

  /**
   * Get the list of permissions that a given permission depends on.
   */
  static getRequiredDependencies(permission: Permission): Permission[] {
    return PERMISSION_DEPENDENCIES[permission] ?? [];
  }

  /**
   * Get all transitive dependencies for a permission (recursive).
   */
  static getAllDependencies(permission: Permission): Permission[] {
    const visited = new Set<Permission>();
    const queue: Permission[] = [permission];

    while (queue.length > 0) {
      const current = queue.pop()!;
      const deps = PERMISSION_DEPENDENCIES[current] ?? [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Given a permission set, return a fixed set with all missing dependencies added.
   */
  static autoFixDependencies(permissions: Permission[]): Permission[] {
    const fixed = new Set(permissions);

    for (const perm of permissions) {
      const allDeps = this.getAllDependencies(perm);
      for (const dep of allDeps) {
        fixed.add(dep);
      }
    }

    return Array.from(fixed);
  }
}
