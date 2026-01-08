import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

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
