import { filterSensitiveFields } from '@/lib/filters/sensitive-field-filter';

/**
 * Calculate statistics from loads
 */
export function calculateLoadStats(
    sums: { _sum: Record<string, number | null> }
) {
    const revenueSum = Number(sums._sum.revenue ?? 0);
    const driverPaySum = Number(sums._sum.driverPay ?? 0);
    const totalMilesSum = Number(sums._sum.totalMiles ?? 0);
    const emptyMilesSum = Number(sums._sum.emptyMiles ?? 0);
    const loadedMilesSum = Number(sums._sum.loadedMiles ?? 0);

    // If loadedMiles is not tracked in half the records, fallback to derivation
    // In a mature system, loadedMiles should always be set during creation/update
    const derivedLoadedMiles = loadedMilesSum > 0
        ? loadedMilesSum
        : Math.max(totalMilesSum - emptyMilesSum, 0);

    const rpmLoadedMiles = derivedLoadedMiles > 0 ? revenueSum / derivedLoadedMiles : null;
    const rpmTotalMiles = totalMilesSum > 0 ? revenueSum / totalMilesSum : null;

    return {
        totalPay: revenueSum, // Backward compatibility for UI
        totalLoadPay: revenueSum,
        driverGross: driverPaySum,
        totalMiles: totalMilesSum,
        loadedMiles: derivedLoadedMiles,
        emptyMiles: emptyMilesSum,
        rpmLoadedMiles,
        rpmTotalMiles,
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
