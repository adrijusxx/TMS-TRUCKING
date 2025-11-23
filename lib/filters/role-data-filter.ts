import { type UserRole } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

/**
 * Role-based data filtering utilities
 * These functions return Prisma where clauses to filter data based on user role and assignments
 */

export interface RoleFilterContext {
  userId: string;
  role: UserRole;
  companyId: string;
  mcNumberId?: string;
}

/**
 * Get load filter based on role and assignments
 * DISPATCHER: Loads where dispatcherId = userId OR loads for drivers where assignedDispatcherId = userId
 * DRIVER: Loads where driverId = driver.id
 * ACCOUNTANT: All loads (filtered by MC number if applicable)
 * FLEET: All loads (filtered by MC number if applicable)
 * SAFETY: All loads (filtered by MC number if applicable)
 * HR: Loads for drivers they manage
 */
export async function getLoadFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role, companyId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  // Note: MC number filtering for loads is handled separately via buildMcNumberWhereClause
  // Loads use mcNumber (string field), not mcNumberId (relation)

  switch (role) {
    case 'DISPATCHER': {
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
 * DISPATCHER: Drivers where assignedDispatcherId = userId
 * HR: Drivers where hrManagerId = userId
 * SAFETY: Drivers where safetyManagerId = userId
 * FLEET: All drivers (filtered by MC number if applicable)
 */
export async function getDriverFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role, companyId, mcNumberId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  // Add MC number filter if provided
  if (mcNumberId) {
    baseFilter.mcNumberId = mcNumberId;
  }

  switch (role) {
    case 'DISPATCHER':
      return {
        ...baseFilter,
        assignedDispatcherId: userId,
      };

    case 'HR':
      return {
        ...baseFilter,
        hrManagerId: userId,
      };

    case 'SAFETY':
      return {
        ...baseFilter,
        safetyManagerId: userId,
      };

    case 'FLEET':
    case 'ACCOUNTANT':
    case 'ADMIN':
    case 'DRIVER':
    case 'CUSTOMER':
    default:
      // These roles see all drivers (filtered by MC number if applicable)
      return baseFilter;
  }
}

/**
 * Get truck filter based on role and assignments
 * FLEET: All trucks (filtered by MC number if applicable)
 * SAFETY: All trucks (filtered by MC number if applicable)
 * Others: All trucks (filtered by MC number if applicable)
 */
export function getTruckFilter(context: RoleFilterContext): any {
  const { companyId, mcNumberId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  // Add MC number filter if provided
  if (mcNumberId) {
    baseFilter.mcNumberId = mcNumberId;
  }

  // For now, all roles see all trucks (filtered by MC number)
  // Can be extended later if needed
  return baseFilter;
}

/**
 * Get trailer filter based on role and assignments
 * Similar to truck filter
 */
export function getTrailerFilter(context: RoleFilterContext): any {
  const { companyId, mcNumberId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  // Add MC number filter if provided
  if (mcNumberId) {
    baseFilter.mcNumberId = mcNumberId;
  }

  // For now, all roles see all trailers (filtered by MC number)
  return baseFilter;
}

/**
 * Get customer filter based on role
 * Most roles see all customers (filtered by MC number if applicable)
 */
export function getCustomerFilter(context: RoleFilterContext): any {
  const { companyId, mcNumberId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  // Add MC number filter if provided
  if (mcNumberId) {
    baseFilter.mcNumberId = mcNumberId;
  }

  return baseFilter;
}

/**
 * Get invoice filter based on role
 * ACCOUNTANT: All invoices (filtered by MC number if applicable)
 * Others: Based on load access
 */
export async function getInvoiceFilter(context: RoleFilterContext): Promise<any> {
  const { userId, role, companyId, mcNumberId } = context;

  const baseFilter: any = {
    companyId,
    deletedAt: null,
  };

  // Add MC number filter if provided
  if (mcNumberId) {
    baseFilter.mcNumberId = mcNumberId;
  }

  // Accountants see all invoices
  if (role === 'ACCOUNTANT' || role === 'ADMIN') {
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
  if (role === 'ACCOUNTANT' || role === 'ADMIN') {
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
 */
export function createFilterContext(
  userId: string,
  role: UserRole,
  companyId: string,
  mcNumberId?: string
): RoleFilterContext {
  return {
    userId,
    role,
    companyId,
    mcNumberId,
  };
}

