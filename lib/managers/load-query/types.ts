export interface LoadQueryParams {
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: string;
    sortFields: Array<{ field: string; order: 'asc' | 'desc' }>;
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
    pickupDateStart: string | null;
    pickupDateEnd: string | null;
    deliveryDate: string | null;
    deliveryDateStart: string | null;
    deliveryDateEnd: string | null;
    createdAt: string | null;
    createdAfter: string | null;
    createdBefore: string | null;
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
    readyForSettlement: boolean | null; // Added for settlement generation
}
