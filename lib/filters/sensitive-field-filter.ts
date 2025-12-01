import { type UserRole, type Permission, hasPermission } from '@/lib/permissions';

/**
 * Sensitive field categories and their required permissions
 */
const SENSITIVE_FIELDS: Record<string, { fields: string[]; permissions: Permission[] }> = {
  financial: {
    fields: [
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
      'paymentAmount',
    ],
    permissions: ['invoices.view', 'settlements.view', 'expenses.view'],
  },
  personal: {
    fields: [
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
      'accountNumber',
    ],
    permissions: ['drivers.edit', 'users.edit'],
  },
  company: {
    fields: [
      'companyFinancials',
      'companySettings',
      'userManagement',
      'settings',
      'securitySettings',
      'apiKeys',
      'integrationKeys',
      'webhookSecrets',
    ],
    permissions: ['settings.edit', 'settings.security', 'company.edit'],
  },
};

/**
 * Check if a role can view a specific field
 */
function canViewField(field: string, role: UserRole): boolean {
  // Admin can view everything
  if (role === 'ADMIN') {
    return true;
  }

  // Check each category
  for (const [category, config] of Object.entries(SENSITIVE_FIELDS)) {
    if (config.fields.includes(field)) {
      // Check if role has any of the required permissions
      return config.permissions.some((permission) => {
        try {
          return hasPermission(role, permission);
        } catch {
          return false;
        }
      });
    }
  }

  // Field is not sensitive, allow viewing
  return true;
}

/**
 * Filter sensitive fields from an object based on role
 */
export function filterSensitiveFields<T extends Record<string, any>>(
  data: T,
  role: UserRole
): Partial<T> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Admin sees everything
  if (role === 'ADMIN') {
    return data;
  }

  const filtered: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (canViewField(key, role)) {
      // Recursively filter nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        filtered[key as keyof T] = filterSensitiveFields(value, role) as T[keyof T];
      } else {
        filtered[key as keyof T] = value;
      }
    }
  }

  return filtered;
}

/**
 * Filter sensitive fields from an array of objects
 */
function filterSensitiveFieldsArray<T extends Record<string, any>>(
  data: T[],
  role: UserRole
): Partial<T>[] {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map((item) => filterSensitiveFields(item, role));
}

/**
 * Get list of sensitive fields that should be hidden for a role
 */
function getHiddenFields(role: UserRole): string[] {
  if (role === 'ADMIN') {
    return [];
  }

  const hiddenFields: string[] = [];

  for (const [category, config] of Object.entries(SENSITIVE_FIELDS)) {
    const hasAnyPermission = config.permissions.some((permission) =>
      hasPermission(role, permission)
    );

    if (!hasAnyPermission) {
      hiddenFields.push(...config.fields);
    }
  }

  return hiddenFields;
}

/**
 * Check if a field path (e.g., "load.revenue" or "driver.ssn") should be hidden
 */
function shouldHideField(fieldPath: string, role: UserRole): boolean {
  if (role === 'ADMIN') {
    return false;
  }

  // Extract the field name (last part of the path)
  const fieldName = fieldPath.split('.').pop() || fieldPath;

  return !canViewField(fieldName, role);
}

