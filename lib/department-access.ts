import type { Permission, UserRole } from './permissions';
import { hasPermission } from './permissions';

/**
 * Department definitions mapping route prefixes to department permissions
 */
const departmentRoutes: Record<string, Permission> = {
  '/dashboard/accounting': 'departments.accounting.view',
  '/dashboard/invoices': 'departments.accounting.view',
  '/dashboard/batches': 'departments.accounting.view',
  '/dashboard/settlements': 'departments.accounting.view',
  '/dashboard/fleet': 'departments.fleet.view',
  '/dashboard/trucks': 'departments.fleet.view',
  '/dashboard/trailers': 'departments.fleet.view',
  '/dashboard/maintenance': 'departments.fleet.view',
  '/dashboard/inspections': 'departments.fleet.view',
  '/dashboard/fuel': 'departments.fleet.view',
  '/dashboard/vendors': 'departments.fleet.view',
  '/dashboard/safety': 'departments.safety.view',
  '/dashboard/hr': 'departments.hr.view',
  '/dashboard/drivers': 'departments.hr.view',
  '/dashboard/reports': 'departments.reports.view',
  '/dashboard/analytics': 'departments.reports.view',
  '/dashboard/settings': 'departments.settings.view',
};

/**
 * Get the department permission required for a given route pathname
 */
export function getDepartmentForRoute(pathname: string): Permission | null {
  // Check each department route prefix
  for (const [routePrefix, permission] of Object.entries(departmentRoutes)) {
    if (pathname === routePrefix || pathname.startsWith(routePrefix + '/')) {
      return permission;
    }
  }
  return null;
}

/**
 * Check if a role has access to a specific department
 */
function hasDepartmentAccess(role: UserRole, department: Permission): boolean {
  return hasPermission(role, department);
}

/**
 * Check if a role has access to a route based on its pathname
 */
export function hasRouteAccess(role: UserRole, pathname: string): boolean {
  const departmentPermission = getDepartmentForRoute(pathname);

  // If no department permission is required, allow access
  if (!departmentPermission) {
    return true;
  }

  // Check if role has the department permission
  return hasDepartmentAccess(role, departmentPermission);
}

/**
 * Check if a role has access to a route based on its pathname (async - checks database)
 */


/**
 * Get all department permissions
 */
function getAllDepartmentPermissions(): Permission[] {
  return [
    'departments.accounting.view',
    'departments.fleet.view',
    'departments.safety.view',
    'departments.hr.view',
    'departments.reports.view',
    'departments.settings.view',
  ];
}

/**
 * Department permission type (subset of Permission)
 */
type DepartmentPermission =
  | 'departments.accounting.view'
  | 'departments.fleet.view'
  | 'departments.safety.view'
  | 'departments.hr.view'
  | 'departments.reports.view'
  | 'departments.settings.view';

/**
 * Department labels for UI display
 */
export const departmentLabels: Record<DepartmentPermission, string> = {
  'departments.accounting.view': 'Accounting Department',
  'departments.fleet.view': 'Fleet Department',
  'departments.safety.view': 'Safety Department',
  'departments.hr.view': 'HR Department',
  'departments.reports.view': 'Reports & Analytics',
  'departments.settings.view': 'Settings',
};

/**
 * Department descriptions for UI display
 */
export const departmentDescriptions: Record<DepartmentPermission, string> = {
  'departments.accounting.view': 'Access to accounting, invoices, batches, and settlements',
  'departments.fleet.view': 'Access to fleet management, trucks, trailers, maintenance, and breakdowns',
  'departments.safety.view': 'Access to safety incidents, compliance, training, and safety management',
  'departments.hr.view': 'Access to HR management, drivers, and user management',
  'departments.reports.view': 'Access to reports, analytics, and data visualization',
  'departments.settings.view': 'Access to system settings and configuration',
};

