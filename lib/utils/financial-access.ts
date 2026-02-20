/**
 * Financial Access Utilities
 * 
 * Helper functions to check if a user can access/modify financial data
 */

/**
 * Check if user can write/update financial fields
 * Only ADMIN and ACCOUNTANT roles can modify financial data
 */
export function canWriteFinancialFields(role: string): boolean {
  const r = role.toUpperCase().replace('-', '_');
  return r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'ACCOUNTANT';
}

/**
 * Check if user can read financial fields
 * ADMIN, ACCOUNTANT, and DISPATCHER can read (dispatchers are read-only)
 */
function canReadFinancialFields(role: string): boolean {
  const r = role.toUpperCase().replace('-', '_');
  return r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'ACCOUNTANT' || r === 'DISPATCHER';
}

/**
 * List of financial/payroll fields that require ADMIN/ACCOUNTANT to modify
 */
const FINANCIAL_FIELDS = [
  'payType',
  'payRate',
  // 'perDiem', // Removed - use recurring transactions
  'escrowTargetAmount',
  'escrowDeductionPerWeek',
  'escrowBalance',
  'driverTariff', // Can be manually set, so protect it
] as const;

/**
 * Check if a field is a financial field
 */
function isFinancialField(field: string): boolean {
  return (FINANCIAL_FIELDS as readonly string[]).includes(field);
}

/**
 * Check if update data contains any financial fields
 */
export function containsFinancialFields(updateData: Record<string, any>): boolean {
  return Object.keys(updateData).some((key) => isFinancialField(key));
}

/**
 * Extract financial fields from update data
 */
export function extractFinancialFields(updateData: Record<string, any>): Record<string, any> {
  const financial: Record<string, any> = {};
  Object.keys(updateData).forEach((key) => {
    if (isFinancialField(key)) {
      financial[key] = updateData[key];
    }
  });
  return financial;
}

/**
 * Remove financial fields from update data
 */
export function removeFinancialFields(updateData: Record<string, any>): Record<string, any> {
  const nonFinancial: Record<string, any> = {};
  Object.keys(updateData).forEach((key) => {
    if (!isFinancialField(key)) {
      nonFinancial[key] = updateData[key];
    }
  });
  return nonFinancial;
}

