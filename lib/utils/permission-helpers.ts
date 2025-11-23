import { type UserRole, type Permission, hasPermission } from '@/lib/permissions';
import { canViewField, filterSensitiveFields, shouldHideField } from '@/lib/filters/sensitive-field-filter';
import { createFilterContext, type RoleFilterContext } from '@/lib/filters/role-data-filter';

/**
 * Permission helper utilities
 */

/**
 * Check if a role can view a specific field
 * Re-exports from sensitive-field-filter for convenience
 */
export { canViewField, shouldHideField };

/**
 * Filter sensitive fields from data based on role
 * Re-exports from sensitive-field-filter for convenience
 */
export { filterSensitiveFields };

/**
 * Get role data filter context
 */
export function getRoleDataFilter(
  role: UserRole,
  userId: string,
  companyId: string,
  mcNumberId?: string
): RoleFilterContext {
  return createFilterContext(userId, role, companyId, mcNumberId);
}

/**
 * Check if user has permission to perform an action
 * This is a convenience wrapper that can be used in both client and server code
 */
export function canPerformAction(role: UserRole, permission: Permission): boolean {
  return hasPermission(role, permission);
}

/**
 * Check if user can view financial data
 */
export function canViewFinancialData(role: UserRole): boolean {
  return (
    hasPermission(role, 'invoices.view') ||
    hasPermission(role, 'settlements.view') ||
    hasPermission(role, 'expenses.view') ||
    role === 'ADMIN'
  );
}

/**
 * Check if user can view personal information
 */
export function canViewPersonalInfo(role: UserRole): boolean {
  return (
    hasPermission(role, 'drivers.edit') ||
    hasPermission(role, 'users.edit') ||
    role === 'ADMIN'
  );
}

/**
 * Check if user can manage settings
 */
export function canManageSettings(role: UserRole): boolean {
  return (
    hasPermission(role, 'settings.edit') ||
    hasPermission(role, 'settings.security') ||
    hasPermission(role, 'company.edit') ||
    role === 'ADMIN'
  );
}

/**
 * Get list of fields that should be hidden for a role
 */
export function getHiddenFieldsForRole(role: UserRole): string[] {
  const hiddenFields: string[] = [];

  if (!canViewFinancialData(role)) {
    hiddenFields.push(
      'revenue',
      'driverPay',
      'totalPay',
      'margins',
      'pricing',
      'rate',
      'ratePerMile',
      'netProfit',
      'totalExpenses',
      'cost',
      'profit',
      'margin',
      'commission',
      'escrowBalance',
      'advanceLimit',
      'settlementAmount',
      'deductionAmount',
      'expenseAmount',
      'invoiceAmount',
      'paymentAmount'
    );
  }

  if (!canViewPersonalInfo(role)) {
    hiddenFields.push(
      'ssn',
      'socialSecurityNumber',
      'driverLicenseNumber',
      'licenseNumber',
      'personalInfo',
      'dateOfBirth',
      'dob',
      'homeAddress',
      'personalAddress',
      'personalPhone',
      'emergencyContact',
      'bankAccount',
      'routingNumber',
      'accountNumber'
    );
  }

  if (!canManageSettings(role)) {
    hiddenFields.push(
      'companyFinancials',
      'companySettings',
      'userManagement',
      'settings',
      'securitySettings',
      'apiKeys',
      'integrationKeys',
      'webhookSecrets'
    );
  }

  return hiddenFields;
}

/**
 * Filter object to remove hidden fields based on role
 */
export function removeHiddenFields<T extends Record<string, any>>(
  data: T,
  role: UserRole
): Partial<T> {
  const hiddenFields = getHiddenFieldsForRole(role);
  const filtered: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!hiddenFields.includes(key)) {
      // Recursively filter nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        filtered[key as keyof T] = removeHiddenFields(value, role) as T[keyof T];
      } else {
        filtered[key as keyof T] = value;
      }
    }
  }

  return filtered;
}

/**
 * Check if a field should be visible in UI based on role
 */
export function isFieldVisible(fieldName: string, role: UserRole): boolean {
  return canViewField(fieldName, role);
}



