import { NextRequest } from 'next/server';
import { LoadQueryParams } from './types';

/**
 * Parse query parameters from request URL
 */
export function parseQueryParams(request: NextRequest): LoadQueryParams {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');

    // Update limit cap to 500 to support settlement generation workflows
    // Default is still 20
    const limitRequest = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(limitRequest, 500);

    // Parse multi-column sorting
    // Format: sortBy=pickupDate,deliveryDate&sortOrder=asc,desc
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';

    const sortByFields = sortByParam.split(',').map(s => s.trim()).filter(Boolean);
    const sortOrders = sortOrderParam.split(',').map(s => s.trim().toLowerCase() as 'asc' | 'desc');

    const sortFields: Array<{ field: string; order: 'asc' | 'desc' }> = sortByFields.map((field, index) => ({
        field,
        order: sortOrders[index] === 'asc' ? 'asc' : 'desc',
    }));

    const readyForSettlementParam = searchParams.get('readyForSettlement');

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        sortBy: sortByFields[0] || 'createdAt',
        sortOrder: sortOrders[0] || 'desc',
        sortFields,
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
        pickupDateStart: searchParams.get('pickupDateStart'),
        pickupDateEnd: searchParams.get('pickupDateEnd'),
        deliveryDate: searchParams.get('deliveryDate'),
        deliveryDateStart: searchParams.get('deliveryDateStart'),
        deliveryDateEnd: searchParams.get('deliveryDateEnd'),
        createdAt: searchParams.get('createdAt'),
        createdAfter: searchParams.get('createdAfter'),
        createdBefore: searchParams.get('createdBefore'),
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
        readyForSettlement: readyForSettlementParam === 'true' ? true : readyForSettlementParam === 'false' ? false : null,
    };
}

/** Maps frontend column IDs to valid Prisma Load field names */
const SORT_FIELD_MAP: Record<string, string> = {
    miles: 'totalMiles',
    customer: 'customerId',
    driver: 'driverId',
    truck: 'truckId',
};

/**
 * Build orderBy clause for Prisma query (supports multi-column sorting)
 */
export function buildOrderByClause(params: LoadQueryParams): Array<Record<string, 'asc' | 'desc'>> {
    if (params.sortFields.length === 0) {
        return [{ createdAt: 'desc' }];
    }
    return params.sortFields.map(({ field, order }) => {
        const mappedField = SORT_FIELD_MAP[field] || field;
        return { [mappedField]: order };
    });
}
