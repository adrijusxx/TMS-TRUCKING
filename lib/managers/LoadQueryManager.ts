/**
 * LoadQueryManager - Handles building query filters for loads API
 * Refactored to use sub-modules to comply with 400-line limit
 */

import { NextRequest } from 'next/server';
import { Session } from 'next-auth';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getLoadFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { LoadQueryParams } from './load-query/types';

// Re-export sub-modules
export * from './load-query/types';
export * from './load-query/parsing';
export * from './load-query/selection';
export * from './load-query/post-processing';

/**
 * Build the base where clause with MC and role filters
 */
export async function buildBaseWhereClause(
  session: Session,
  request: NextRequest
): Promise<Record<string, unknown>> {
  // Build MC Filter
  const mcWhere = await buildMcNumberWhereClause(session, request);

  // Apply role-based filtering
  const roleFilter = await getLoadFilter(
    createFilterContext(
      session.user.id,
      session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER',
      session.user.companyId!
    )
  );

  // Parse includeDeleted parameter (admins only)
  const includeDeleted = parseIncludeDeleted(request);
  const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

  // Merge filters
  return {
    ...mcWhere,
    ...roleFilter,
    ...(deletedFilter && { ...deletedFilter }),
  };
}

/**
 * Apply query parameter filters to where clause
 */
export function applyQueryFilters(
  where: Record<string, unknown>,
  params: LoadQueryParams
): void {
  // MC Number filter override
  if (params.mcNumberIdFilter) {
    if (params.mcNumberIdFilter === 'null' || params.mcNumberIdFilter === 'unassigned') {
      where.mcNumberId = null;
    } else {
      where.mcNumberId = params.mcNumberIdFilter;
    }
  }

  // Missing documents filter
  applyMissingDocumentsFilter(where, params.hasMissingDocuments);

  // Status filter
  applyStatusFilter(where, params.statusParams);

  // Ready for Settlement filter
  if (params.readyForSettlement !== null) {
    where.readyForSettlement = params.readyForSettlement;
  }

  // Entity ID filters
  applyEntityIdFilters(where, params);

  // Location filters
  applyLocationFilters(where, params);

  // Date filters
  applyDateFilters(where, params);

  // Search filter
  applySearchFilter(where, params.search);
}

/**
 * Apply missing documents filter
 */
function applyMissingDocumentsFilter(
  where: Record<string, unknown>,
  hasMissingDocuments: string | null
): void {
  if (hasMissingDocuments === 'true') {
    where.AND = (where.AND as unknown[]) || [];
    (where.AND as unknown[]).push({
      OR: [
        { documents: { none: { type: 'BOL', deletedAt: null } } },
        { documents: { none: { type: 'POD', deletedAt: null } } },
        { documents: { none: { type: 'RATE_CONFIRMATION', deletedAt: null } } },
      ],
    });
  } else if (hasMissingDocuments === 'false') {
    where.AND = (where.AND as unknown[]) || [];
    (where.AND as unknown[]).push({
      AND: [
        { documents: { some: { type: 'BOL', deletedAt: null } } },
        { documents: { some: { type: 'POD', deletedAt: null } } },
        { documents: { some: { type: 'RATE_CONFIRMATION', deletedAt: null } } },
      ],
    });
  }
}

/**
 * Apply status filter with IN_TRANSIT expansion
 */
function applyStatusFilter(
  where: Record<string, unknown>,
  statusParams: string[]
): void {
  if (statusParams.length === 0) return;

  const statuses = statusParams.filter((s) => s !== 'all');
  if (statuses.length === 1) {
    const status = statuses[0];
    if (status === 'IN_TRANSIT') {
      where.status = {
        in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
      };
    } else {
      where.status = status;
    }
  } else if (statuses.length > 1) {
    const validStatuses: string[] = [];
    for (const status of statuses) {
      if (status === 'IN_TRANSIT') {
        validStatuses.push('ASSIGNED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY');
      } else {
        validStatuses.push(status);
      }
    }
    where.status = { in: [...new Set(validStatuses)] };
  }
}

/**
 * Apply entity ID filters (customer, driver, truck)
 */
function applyEntityIdFilters(
  where: Record<string, unknown>,
  params: LoadQueryParams
): void {
  if (params.customerIdParams.length > 0) {
    where.customerId = params.customerIdParams.length === 1
      ? params.customerIdParams[0]
      : { in: params.customerIdParams };
  }

  if (params.driverIdParams.length > 0) {
    where.driverId = params.driverIdParams.length === 1
      ? params.driverIdParams[0]
      : { in: params.driverIdParams };
  }

  if (params.truckIdParams.length > 0) {
    where.truckId = params.truckIdParams.length === 1
      ? params.truckIdParams[0]
      : { in: params.truckIdParams };
  }

  if (params.dispatcherId) {
    where.dispatcherId = params.dispatcherId;
  }
}

/**
 * Apply location filters
 */
function applyLocationFilters(
  where: Record<string, unknown>,
  params: LoadQueryParams
): void {
  if (params.pickupCity) {
    where.pickupCity = { contains: params.pickupCity, mode: 'insensitive' };
  }
  if (params.pickupState) {
    where.pickupState = { contains: params.pickupState, mode: 'insensitive' };
  }
  if (params.deliveryCity) {
    where.deliveryCity = { contains: params.deliveryCity, mode: 'insensitive' };
  }
  if (params.deliveryState) {
    where.deliveryState = { contains: params.deliveryState, mode: 'insensitive' };
  }
  if (params.truckNumber) {
    where.truck = { truckNumber: { contains: params.truckNumber, mode: 'insensitive' } };
  }
  if (params.miles) {
    where.totalMiles = { gte: parseFloat(params.miles) };
  }
  if (params.revenue) {
    where.revenue = { gte: parseFloat(params.revenue) };
  }
}

/**
 * Apply date filters including quick filters
 */
function applyDateFilters(
  where: Record<string, unknown>,
  params: LoadQueryParams
): void {
  // Pickup date range filter (from DateRangeFilter component)
  if (params.pickupDateStart || params.pickupDateEnd) {
    const pickupFilter: Record<string, Date> = {};
    if (params.pickupDateStart) {
      pickupFilter.gte = new Date(params.pickupDateStart);
    }
    if (params.pickupDateEnd) {
      const endDate = new Date(params.pickupDateEnd);
      endDate.setDate(endDate.getDate() + 1); // Include the end date
      pickupFilter.lt = endDate;
    }
    where.pickupDate = pickupFilter;
  } else if (params.pickupDate) {
    // Handle colon-separated range format from DateRangeFilter: "2025-01-01:2025-01-07"
    if (params.pickupDate.includes(':') && /^\d{4}-\d{2}-\d{2}/.test(params.pickupDate)) {
      const [startStr, endStr] = params.pickupDate.split(':');
      const pickupFilter: Record<string, Date> = {};
      if (startStr) {
        pickupFilter.gte = new Date(startStr);
      }
      if (endStr) {
        const endDate = new Date(endStr);
        endDate.setDate(endDate.getDate() + 1);
        pickupFilter.lt = endDate;
      }
      where.pickupDate = pickupFilter;
    } else {
      // Single pickup date (legacy)
      const date = new Date(params.pickupDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.pickupDate = { gte: date, lt: nextDay };
    }
  }

  // Delivery date range filter (from DateRangeFilter component)
  if (params.deliveryDateStart || params.deliveryDateEnd) {
    const deliveryFilter: Record<string, Date> = {};
    if (params.deliveryDateStart) {
      deliveryFilter.gte = new Date(params.deliveryDateStart);
    }
    if (params.deliveryDateEnd) {
      const endDate = new Date(params.deliveryDateEnd);
      endDate.setDate(endDate.getDate() + 1); // Include the end date
      deliveryFilter.lt = endDate;
    }
    where.deliveryDate = deliveryFilter;
  } else if (params.deliveryDate) {
    // Handle colon-separated range format from DateRangeFilter: "2025-01-01:2025-01-07"
    if (params.deliveryDate.includes(':') && /^\d{4}-\d{2}-\d{2}/.test(params.deliveryDate)) {
      const [startStr, endStr] = params.deliveryDate.split(':');
      const deliveryFilter: Record<string, Date> = {};
      if (startStr) {
        deliveryFilter.gte = new Date(startStr);
      }
      if (endStr) {
        const endDate = new Date(endStr);
        endDate.setDate(endDate.getDate() + 1);
        deliveryFilter.lt = endDate;
      }
      where.deliveryDate = deliveryFilter;
    } else {
      // Single delivery date (legacy)
      const date = new Date(params.deliveryDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.deliveryDate = { gte: date, lt: nextDay };
    }
  }

  // CreatedAt date range filter
  if (params.createdAfter || params.createdBefore) {
    const createdFilter: Record<string, Date> = {};
    if (params.createdAfter) {
      createdFilter.gte = new Date(params.createdAfter);
    }
    if (params.createdBefore) {
      const endDate = new Date(params.createdBefore);
      endDate.setDate(endDate.getDate() + 1);
      createdFilter.lt = endDate;
    }
    where.createdAt = createdFilter;
  } else if (params.createdAt) {
    // Handle colon-separated range format from DateRangeFilter
    if (params.createdAt.includes(':') && /^\d{4}-\d{2}-\d{2}/.test(params.createdAt)) {
      const [startStr, endStr] = params.createdAt.split(':');
      const createdFilter: Record<string, Date> = {};
      if (startStr) {
        createdFilter.gte = new Date(startStr);
      }
      if (endStr) {
        const endDate = new Date(endStr);
        endDate.setDate(endDate.getDate() + 1);
        createdFilter.lt = endDate;
      }
      where.createdAt = createdFilter;
    } else {
      // Single created date (legacy)
      const date = new Date(params.createdAt);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: date, lt: nextDay };
    }
  }

  // Generic date range filter (legacy - applies to both pickup and delivery)
  if (params.startDate && params.endDate && !params.pickupDateStart && !params.deliveryDateStart) {
    const dateRangeOr = [
      { pickupDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } },
      { deliveryDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR as unknown[] }, { OR: dateRangeOr }];
      delete where.OR;
    } else {
      where.OR = dateRangeOr;
    }
  }

  // Quick filters
  if (params.createdToday) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.createdAt = { gte: today, lt: tomorrow };
  } else if (params.createdLast24h) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    where.createdAt = { gte: last24h };
  }

  if (params.pickupToday) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.pickupDate = { gte: today, lt: tomorrow };
  }
}

/**
 * Apply search filter
 */
function applySearchFilter(
  where: Record<string, unknown>,
  search: string | null
): void {
  if (!search) return;

  const searchOr = [
    { loadNumber: { contains: search, mode: 'insensitive' } },
    { commodity: { contains: search, mode: 'insensitive' } },
    { pickupCity: { contains: search, mode: 'insensitive' } },
    { pickupState: { contains: search, mode: 'insensitive' } },
    { deliveryCity: { contains: search, mode: 'insensitive' } },
    { deliveryState: { contains: search, mode: 'insensitive' } },
    { customer: { name: { contains: search, mode: 'insensitive' } } },
    { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
    { driver: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
    { truck: { truckNumber: { contains: search, mode: 'insensitive' } } },
    { trailerNumber: { contains: search, mode: 'insensitive' } },
  ];

  if (where.OR) {
    where.AND = [{ OR: where.OR as unknown[] }, { OR: searchOr }];
    delete where.OR;
  } else {
    where.OR = searchOr;
  }
}
