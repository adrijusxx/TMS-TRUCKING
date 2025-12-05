/**
 * LoadQueryManager - Handles building query filters for loads API
 * Extracted from app/api/loads/route.ts to comply with 400-line limit
 */

import { NextRequest } from 'next/server';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getLoadFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

export interface LoadQueryParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
  statusParams: string[];
  customerIdParams: string[];
  driverIdParams: string[];
  truckIdParams: string[];
  search: string | null;
  pickupCity: string | null;
  pickupState: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  pickupDate: string | null;
  startDate: string | null;
  endDate: string | null;
  revenue: string | null;
  miles: string | null;
  truckNumber: string | null;
  dispatcherId: string | null;
  mcNumberIdFilter: string | null;
  createdToday: boolean;
  pickupToday: boolean;
  createdLast24h: boolean;
  hasMissingDocuments: string | null;
}

/**
 * Parse query parameters from request URL
 */
export function parseQueryParams(request: NextRequest): LoadQueryParams {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    statusParams: searchParams.getAll('status'),
    customerIdParams: searchParams.getAll('customerId'),
    driverIdParams: searchParams.getAll('driverId'),
    truckIdParams: searchParams.getAll('truckId'),
    search: searchParams.get('search'),
    pickupCity: searchParams.get('pickupCity'),
    pickupState: searchParams.get('pickupState'),
    deliveryCity: searchParams.get('deliveryCity'),
    deliveryState: searchParams.get('deliveryState'),
    pickupDate: searchParams.get('pickupDate'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    revenue: searchParams.get('revenue'),
    miles: searchParams.get('miles'),
    truckNumber: searchParams.get('truckNumber'),
    dispatcherId: searchParams.get('dispatcherId'),
    mcNumberIdFilter: searchParams.get('mcNumberId'),
    createdToday: searchParams.get('createdToday') === 'true',
    pickupToday: searchParams.get('pickupToday') === 'true',
    createdLast24h: searchParams.get('createdLast24h') === 'true',
    hasMissingDocuments: searchParams.get('hasMissingDocuments'),
  };
}

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
        in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY'],
      };
    } else {
      where.status = status;
    }
  } else if (statuses.length > 1) {
    const validStatuses: string[] = [];
    for (const status of statuses) {
      if (status === 'IN_TRANSIT') {
        validStatuses.push('ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY', 'AT_DELIVERY');
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
    where.assignedDispatcherId = params.dispatcherId;
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
  // Single pickup date
  if (params.pickupDate) {
    const date = new Date(params.pickupDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.pickupDate = { gte: date, lt: nextDay };
  }

  // Date range filter
  if (params.startDate && params.endDate) {
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

/**
 * Load select clause for list queries
 */
export const loadListSelect = {
  id: true,
  loadNumber: true,
  status: true,
  dispatchStatus: true,
  pickupLocation: true,
  pickupCity: true,
  pickupState: true,
  pickupDate: true,
  deliveryLocation: true,
  deliveryCity: true,
  deliveryState: true,
  deliveryDate: true,
  revenue: true,
  driverPay: true,
  totalPay: true,
  totalMiles: true,
  loadedMiles: true,
  emptyMiles: true,
  trailerNumber: true,
  shipmentId: true,
  stopsCount: true,
  serviceFee: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  customer: {
    select: { id: true, name: true, customerNumber: true },
  },
  driver: {
    select: {
      id: true,
      driverNumber: true,
      user: { select: { firstName: true, lastName: true, phone: true } },
    },
  },
  truck: {
    select: { id: true, truckNumber: true },
  },
  dispatcher: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
  mcNumber: {
    select: { id: true, number: true, companyName: true },
  },
  stops: {
    select: { id: true, stopType: true, sequence: true, city: true, state: true },
    orderBy: { sequence: 'asc' as const },
  },
  documents: {
    where: { deletedAt: null },
    select: { id: true, type: true, title: true, fileName: true, fileUrl: true },
    orderBy: { createdAt: 'desc' as const },
    take: 5,
  },
  statusHistory: {
    select: { createdBy: true, createdAt: true },
    orderBy: { createdAt: 'asc' as const },
    take: 1,
  },
  rateConfirmation: {
    select: { id: true, rateConfNumber: true },
  },
};

/**
 * Calculate statistics from loads
 */
export function calculateLoadStats(
  sums: { _sum: Record<string, number | null> },
  allLoadsForStats: Array<{ totalMiles: number | null; loadedMiles: number | null; emptyMiles: number | null }>
) {
  const revenueSum = Number(sums._sum.revenue ?? 0);
  const totalPaySum = Number(sums._sum.totalPay ?? 0);
  const driverPaySum = Number(sums._sum.driverPay ?? 0);
  const totalMilesSum = Number(sums._sum.totalMiles ?? 0);
  const emptyMilesSum = Number(sums._sum.emptyMiles ?? 0);
  const serviceFeeSum = Number(sums._sum.serviceFee ?? 0);

  // Calculate loaded miles
  let calculatedLoadedMilesSum = 0;
  for (const load of allLoadsForStats) {
    const totalMiles = Number(load.totalMiles ?? 0);
    const loadedMiles = Number(load.loadedMiles ?? 0);
    const emptyMiles = Number(load.emptyMiles ?? 0);
    const calculatedLoadedMiles = loadedMiles > 0 ? loadedMiles : Math.max(totalMiles - emptyMiles, 0);
    calculatedLoadedMilesSum += calculatedLoadedMiles;
  }

  const derivedLoadedMiles = calculatedLoadedMilesSum;
  const rpmLoadedMiles = derivedLoadedMiles > 0 ? revenueSum / derivedLoadedMiles : null;
  const rpmTotalMiles = totalMilesSum > 0 ? revenueSum / totalMilesSum : null;

  return {
    totalPay: totalPaySum,
    totalLoadPay: revenueSum,
    driverGross: driverPaySum,
    totalMiles: totalMilesSum,
    loadedMiles: derivedLoadedMiles,
    emptyMiles: emptyMilesSum,
    rpmLoadedMiles,
    rpmTotalMiles,
    serviceFee: serviceFeeSum,
  };
}

/**
 * Add document status to loads
 */
export function addDocumentStatus<T extends { documents?: Array<{ type: string }> }>(
  loads: T[]
): Array<T & { missingDocuments: string[]; hasMissingDocuments: boolean }> {
  const REQUIRED_DOCUMENTS = ['BOL', 'POD', 'RATE_CONFIRMATION'] as const;
  
  return loads.map((load) => {
    const documentTypes = load.documents?.map((doc) => doc.type) || [];
    const missingDocuments = REQUIRED_DOCUMENTS.filter(
      (type) => !documentTypes.includes(type)
    );
    
    return {
      ...load,
      missingDocuments,
      hasMissingDocuments: missingDocuments.length > 0,
    };
  });
}

/**
 * Filter loads for sensitive fields based on role
 */
export function filterLoadsForRole<T extends Record<string, any>>(
  loads: T[],
  role: 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER'
): T[] {
  return loads.map((load) => filterSensitiveFields(load, role)) as T[];
}



