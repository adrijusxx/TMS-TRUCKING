import { prisma } from '@/lib/prisma';

/**
 * Role-based data filtering utilities
 * These functions return Prisma where clauses to filter data based on user role and assignments
 *
 * NOTE: These filters handle role-based access (e.g., dispatcher sees their loads)
 * MC filtering should be applied separately using buildMcNumberWhereClause
 * The filters returned here should be combined with MC filters in API routes
 *
 * The `role` field accepts either legacy UserRole enum strings (e.g., 'DISPATCHER')
 * or new roleSlug strings (e.g., 'dispatcher'). Both are matched case-insensitively.
 */

interface RoleFilterContext {
  userId: string;
  role: string; // UserRole enum or roleSlug
  companyId: string;
  mcNumberId?: string | { in: string[] }; // Can be single ID or array for multi-MC
}

/**
 * Get load filter based on role and assignments
 * 
 * Role-based filtering:
 * - DISPATCHER: Loads where dispatcherId = userId OR loads for drivers where assignedDispatcherId = userId
 * - DRIVER: Loads where driverId = driver.id
 * - HR: Loads for drivers they manage
 * - ACCOUNTANT/FLEET/SAFETY/ADMIN: All loads (within company)
 * 
 * NOTE: MC filtering is NOT included here - apply it separately using buildMcNumberWhereClause
 * This filter only handles role-based access control
 */
export async function getLoadFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role, companyId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  const roleNorm = role.toUpperCase().replace('-', '_'); // normalize slug → enum format
  switch (roleNorm) {
    case 'DISPATCHER': {
      // Check company setting for dispatcher load visibility
      const companySettings = await prisma.companySettings.findUnique({
        where: { companyId },
        select: { generalSettings: true },
      });

      const generalSettings = (companySettings?.generalSettings as any) || {};
      const dispatcherSeeAllLoads = generalSettings.dispatcherSeeAllLoads !== false; // Default to true

      // If setting allows dispatchers to see all loads, return base filter (no role restrictions)
      if (dispatcherSeeAllLoads) {
        return baseFilter;
      }

      // Otherwise, apply restrictive filter (only their loads and assigned drivers' loads)
      // Get drivers assigned to this dispatcher
      const assignedDrivers = await prisma.driver.findMany({
        where: {
          assignedDispatcherId: userId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      const assignedDriverIds = assignedDrivers.map((d) => d.id);

      // Dispatcher sees:
      // 1. Loads they dispatched (dispatcherId = userId)
      // 2. Loads for drivers they manage (driverId IN assignedDriverIds)
      if (assignedDriverIds.length > 0) {
        return {
          ...baseFilter,
          OR: [
            { dispatcherId: userId },
            { driverId: { in: assignedDriverIds } },
          ],
        };
      } else {
        return {
          ...baseFilter,
          dispatcherId: userId,
        };
      }
    }

    case 'DRIVER': {
      // Get driver record for this user
      const driver = await prisma.driver.findFirst({
        where: {
          userId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!driver) {
        // No driver record, return filter that matches nothing
        return {
          ...baseFilter,
          id: 'no-driver-found',
        };
      }

      return {
        ...baseFilter,
        driverId: driver.id,
      };
    }

    case 'HR': {
      // Get drivers managed by this HR user
      const managedDrivers = await prisma.driver.findMany({
        where: {
          hrManagerId: userId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      const managedDriverIds = managedDrivers.map((d) => d.id);

      if (managedDriverIds.length > 0) {
        return {
          ...baseFilter,
          driverId: { in: managedDriverIds },
        };
      } else {
        // No managed drivers, return filter that matches nothing
        return {
          ...baseFilter,
          id: 'no-managed-drivers',
        };
      }
    }

    case 'ACCOUNTANT':
    case 'FLEET':
    case 'SAFETY':
    case 'ADMIN':
    case 'CUSTOMER':
    default:
      // These roles see all loads (filtered by MC number if applicable)
      return baseFilter;
  }
}

/**
 * Get driver filter based on role and assignments
 * 
 * Role-based filtering:
 * - DISPATCHER: Drivers where assignedDispatcherId = userId
 * - HR: Drivers where hrManagerId = userId
 * - SAFETY: Drivers where safetyManagerId = userId
 * - FLEET/ACCOUNTANT/ADMIN/DRIVER/CUSTOMER: All drivers (within company)
 * 
 * NOTE: MC filtering should be applied separately using buildMcNumberWhereClause
 * This filter only handles role-based access control
 */
export async function getDriverFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role, companyId } = context;

  const baseFilter: any = {
    deletedAt: null,
  };

  // Only add companyId if provided and not admin placeholder
  if (companyId && companyId !== 'ADMIN_ALL_COMPANIES') {
    baseFilter.companyId = companyId;
  }

  // NOTE: mcNumberId filtering removed - apply separately via buildMcNumberWhereClause

  const driverRoleNorm = role.toUpperCase().replace('-', '_');
  switch (driverRoleNorm) {
    case 'DISPATCHER':
      return {
        ...baseFilter,
        assignedDispatcherId: userId,
      };

    case 'HR':
      // HR should see all drivers (not just ones they manage)
      // This allows HR to manage all driver records
      return baseFilter;

    case 'SAFETY':
      return {
        ...baseFilter,
        safetyManagerId: userId,
      };

    case 'FLEET':
    case 'ACCOUNTANT':
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'DRIVER':
    case 'CUSTOMER':
    default:
      // These roles see all drivers (filtered by MC number if applicable)
      return baseFilter;
  }
}

/**
 * Get truck filter based on role and assignments
 * 
 * Currently all roles see all trucks within their company
 * Can be extended later for role-specific filtering if needed
 * 
 * NOTE: MC filtering should be applied separately using buildMcNumberWhereClause
 * This filter only handles role-based access control
 */
export function getTruckFilter(context: RoleFilterContext): any {
  const { companyId } = context;

  const baseFilter: any = {
    deletedAt: null,
  };

  // Only add companyId if provided and not admin placeholder
  if (companyId && companyId !== 'ADMIN_ALL_COMPANIES') {
    baseFilter.companyId = companyId;
  }

  // NOTE: mcNumberId filtering removed - apply separately via buildMcNumberWhereClause

  return baseFilter;
}

/**
 * Get trailer filter based on role and assignments
 * 
 * Currently all roles see all trailers within their company
 * Similar to truck filter
 * 
 * NOTE: MC filtering should be applied separately using buildMcNumberWhereClause
 * This filter only handles role-based access control
 */
export function getTrailerFilter(context: RoleFilterContext): any {
  const { companyId } = context;

  const baseFilter: any = {
    deletedAt: null,
  };

  // Only add companyId if provided and not admin placeholder
  if (companyId && companyId !== 'ADMIN_ALL_COMPANIES') {
    baseFilter.companyId = companyId;
  }

  // NOTE: mcNumberId filtering removed - apply separately via buildMcNumberWhereClause

  return baseFilter;
}


/**
 * Get invoice filter based on role
 * 
 * Role-based filtering:
 * - ACCOUNTANT/ADMIN: All invoices (within company)
 * - Others: Invoices for loads they have access to
 * 
 * NOTE: MC filtering should be applied separately using buildMcNumberWhereClause
 * This filter only handles role-based access control
 */
export async function getInvoiceFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role, companyId } = context;

  // Invoices don't have companyId - they're linked through Customer
  // Filter through customer relationship
  const baseFilter: any = {
    customer: {
      companyId: companyId === 'ADMIN_ALL_COMPANIES' ? undefined : companyId,
      deletedAt: null,
    },
  };

  // NOTE: mcNumberId filtering removed - apply separately via buildMcNumberWhereClause

  // Accountants and admins see all invoices (filtered by company through customer)
  const invoiceRoleNorm = role.toUpperCase().replace('-', '_');
  if (invoiceRoleNorm === 'ACCOUNTANT' || invoiceRoleNorm === 'ADMIN' || invoiceRoleNorm === 'SUPER_ADMIN') {
    // If viewing all companies (admin), remove company filter
    if (companyId === 'ADMIN_ALL_COMPANIES') {
      return {
        customer: {
          deletedAt: null,
        },
      };
    }
    return baseFilter;
  }

  // For other roles, filter by accessible loads
  const loadFilter = await getLoadFilter(context);
  
  // Get load IDs that match the filter
  const loads = await prisma.load.findMany({
    where: loadFilter,
    select: { id: true },
  });

  const loadIds = loads.map((l) => l.id);

  if (loadIds.length > 0) {
    return {
      ...baseFilter,
      loadId: { in: loadIds },
    };
  } else {
    // No accessible loads, return filter that matches nothing
    return {
      ...baseFilter,
      id: 'no-accessible-loads',
    };
  }
}

/**
 * Get settlement filter based on role
 * ACCOUNTANT: All settlements (filtered by MC number if applicable)
 * Others: Based on driver access
 * 
 * Note: Settlement model doesn't have a direct companyId field.
 * Company filtering is done through driver.companyId relation.
 */
export async function getSettlementFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role } = context;

  const baseFilter: any = {};

  // Note: MC number filtering for settlements is handled separately
  // Settlements are linked to drivers, which use mcNumberId (relation)
  // Company filtering is done through driver.companyId in the driverFilter
  // Settlement model doesn't have deletedAt field, so we don't filter by it

  // Accountants see all settlements (company filtering via driver relation)
  const settlementRoleNorm = role.toUpperCase().replace('-', '_');
  if (settlementRoleNorm === 'ACCOUNTANT' || settlementRoleNorm === 'ADMIN' || settlementRoleNorm === 'SUPER_ADMIN') {
    return baseFilter;
  }

  // For other roles, filter by accessible drivers
  const driverFilter = await getDriverFilter(context);
  
  // Get driver IDs that match the filter
  const drivers = await prisma.driver.findMany({
    where: driverFilter,
    select: { id: true },
  });

  const driverIds = drivers.map((d) => d.id);

  if (driverIds.length > 0) {
    return {
      ...baseFilter,
      driverId: { in: driverIds },
    };
  } else {
    // No accessible drivers, return filter that matches nothing
    return {
      ...baseFilter,
      id: 'no-accessible-drivers',
    };
  }
}

/**
 * Helper to create filter context from session
 * 
 * NOTE: mcNumberId is optional and should typically NOT be passed
 * MC filtering should be done separately using buildMcNumberWhereClause
 * 
 * @deprecated The mcNumberId parameter is deprecated - use buildMcNumberWhereClause separately
 */
export function createFilterContext(
  userId: string,
  role: string,
  companyId: string,
  mcNumberId?: string | { in: string[] }
): RoleFilterContext {
  return {
    userId,
    role,
    companyId,
    mcNumberId,
  };
}

