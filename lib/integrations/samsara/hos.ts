/**
 * Samsara HOS (Hours of Service)
 * 
 * Methods for managing drivers and HOS logs.
 */

import { samsaraRequest } from './client';
import { SamsaraDriver, SamsaraHOSLog } from './types';

/**
 * Get all drivers
 */
export async function getSamsaraDrivers(companyId?: string): Promise<SamsaraDriver[] | null> {
    const result = await samsaraRequest<SamsaraDriver[] | { data?: SamsaraDriver[] }>(
        '/fleet/drivers',
        {},
        companyId
    );

    if (!result) return null;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;

    return null;
}

/**
 * Get driver by ID
 */
export async function getSamsaraDriver(driverId: string, companyId?: string): Promise<SamsaraDriver | null> {
    const drivers = await getSamsaraDrivers(companyId);
    if (!drivers) return null;
    return drivers.find((d) => d.id === driverId) || null;
}

/**
 * Get HOS (Hours of Service) status for drivers
 */
export async function getSamsaraHOSStatuses(
    driverIds?: string[]
): Promise<SamsaraDriver['hosStatuses'] | null> {
    const params = new URLSearchParams();
    if (driverIds && driverIds.length > 0) {
        params.append('driverIds', driverIds.join(','));
    }

    const endpoint = `/fleet/hos_authentication_logs${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await samsaraRequest<{ data: SamsaraDriver[] }>(endpoint);

    if (!result || !result.data) return null;

    return result.data.flatMap((driver) => driver.hosStatuses || []);
}

/**
 * Get HOS logs for a specific driver
 */
export async function getSamsaraHOSLogs(
    driverId: string,
    startTime: string,
    endTime?: string
): Promise<SamsaraHOSLog[] | null> {
    const params = new URLSearchParams({
        driverId,
        startTime,
        ...(endTime && { endTime }),
    });

    const result = await samsaraRequest<{ data: SamsaraHOSLog[] }>(
        `/fleet/hos_logs?${params.toString()}`
    );

    return result?.data || null;
}

/**
 * Sync driver HOS data (Placeholder for implementation)
 */
export async function syncSamsaraHOSToDriver(
    samsaraDriverId: string,
    ourDriverId: string
): Promise<boolean> {
    try {
        const hosStatuses = await getSamsaraHOSStatuses([samsaraDriverId]);
        if (!hosStatuses || hosStatuses.length === 0) return false;

        const currentStatus = hosStatuses[0];
        const statusMap: Record<string, string> = {
            'offDuty': 'OFF_DUTY',
            'driving': 'DRIVING',
            'onDuty': 'ON_DUTY',
            'onDutyNotDriving': 'ON_DUTY',
            'sleeper': 'SLEEPER_BERTH',
        };

        const ourStatus = statusMap[currentStatus.status] || 'OFF_DUTY';
        console.log(`Would sync HOS for driver ${ourDriverId}:`, {
            status: ourStatus,
            shiftStart: currentStatus.shiftStart,
            shiftRemaining: currentStatus.shiftRemaining,
        });

        return true;
    } catch (error) {
        console.error('Samsara HOS sync error:', error);
        return false;
    }
}

/**
 * Get driver-submitted documents from Samsara
 */
export async function getSamsaraDocuments(
    companyId?: string,
    startTime?: string,
    endTime?: string
): Promise<any[] | null> {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);

    const result = await samsaraRequest<any>(
        `/fleet/documents?${params.toString()}`,
        {},
        companyId
    );

    if (!result) return null;
    return Array.isArray(result) ? result : (result.data || []);
}
