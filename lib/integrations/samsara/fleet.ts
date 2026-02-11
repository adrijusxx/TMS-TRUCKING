/**
 * Samsara Fleet Management
 * 
 * Methods for managing vehicles, assets, and locations.
 */

import { samsaraRequest } from './client';
import { SamsaraVehicle } from './types';

/**
 * Get all vehicles in the fleet
 */
export async function getSamsaraVehicles(companyId?: string): Promise<SamsaraVehicle[] | null> {
    const result = await samsaraRequest<SamsaraVehicle[] | { data?: SamsaraVehicle[] }>(
        '/fleet/vehicles',
        {},
        companyId
    );

    if (!result) return null;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;

    return null;
}

/**
 * Get all assets (trailers) in the fleet
 */
export async function getSamsaraAssets(companyId?: string): Promise<SamsaraVehicle[] | null> {
    try {
        const result = await samsaraRequest<SamsaraVehicle[] | { data?: SamsaraVehicle[] }>(
            '/fleet/assets',
            {},
            companyId
        );

        if (!result) return null;
        if (Array.isArray(result)) return result;
        if (Array.isArray(result.data)) return result.data;

        return null;
    } catch (error) {
        console.debug('[Samsara] Assets endpoint not available');
        return null;
    }
}

/**
 * Get vehicle by ID
 */
export async function getSamsaraVehicle(vehicleId: string): Promise<SamsaraVehicle | null> {
    const vehicles = await getSamsaraVehicles();
    if (!vehicles) return null;
    return vehicles.find((v) => v.id === vehicleId) || null;
}

/**
 * Get asset location and speed data using the stream endpoint
 */
export async function getSamsaraAssetLocationAndSpeed(
    vehicleIds?: string[],
    companyId?: string
): Promise<Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> | null> {
    if (!vehicleIds || vehicleIds.length === 0) return null;

    const MAX_IDS_PER_REQUEST = 50;

    if (vehicleIds.length > MAX_IDS_PER_REQUEST) {
        const allResults: Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> = [];
        for (let i = 0; i < vehicleIds.length; i += MAX_IDS_PER_REQUEST) {
            const batch = vehicleIds.slice(i, i + MAX_IDS_PER_REQUEST);
            const batchResult = await getSamsaraAssetLocationAndSpeed(batch, companyId);
            if (batchResult) allResults.push(...batchResult);
        }
        return allResults.length > 0 ? allResults : null;
    }

    try {
        const params = new URLSearchParams();
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);
        params.append('startTime', startTime.toISOString());
        params.append('endTime', endTime.toISOString());
        params.append('includeSpeed', 'true');
        params.append('includeReverseGeo', 'true');
        params.append('ids', vehicleIds.join(','));
        params.append('limit', '512');

        const result = await samsaraRequest<{
            data?: Array<{
                id: string;
                location: {
                    latitude: number;
                    longitude: number;
                    speed?: { value: number; unit: string };
                    heading?: number;
                    address?: string;
                };
                time: string;
            }>;
        }>(
            `/assets/location-and-speed/stream?${params.toString()}`,
            {},
            companyId
        );

        if (!result || !result.data || result.data.length === 0) return null;

        const locationMap = new Map<string, { vehicleId: string; location: SamsaraVehicle['location'] }>();
        result.data.forEach((entry) => {
            if (!entry.id || !entry.location) return;
            const speedMph = entry.location.speed?.value
                ? (entry.location.speed.unit === 'mph' ? entry.location.speed.value : entry.location.speed.value * 0.621371)
                : undefined;

            locationMap.set(entry.id, {
                vehicleId: entry.id,
                location: {
                    latitude: entry.location.latitude,
                    longitude: entry.location.longitude,
                    speedMilesPerHour: speedMph,
                    heading: entry.location.heading,
                    address: entry.location.address,
                },
            });
        });

        return Array.from(locationMap.values());
    } catch (error) {
        return null;
    }
}

/**
 * Get vehicle locations in real-time
 */
export async function getSamsaraVehicleLocations(
    vehicleIds?: string[],
    companyId?: string
): Promise<Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> | null> {
    if (vehicleIds && vehicleIds.length > 0) {
        const streamResult = await getSamsaraAssetLocationAndSpeed(vehicleIds, companyId);
        if (streamResult && streamResult.length > 0) return streamResult;
    }

    const MAX_IDS_PER_REQUEST = 50;
    if (vehicleIds && vehicleIds.length > MAX_IDS_PER_REQUEST) {
        const allResults: Array<{ vehicleId: string; location: SamsaraVehicle['location'] }> = [];
        for (let i = 0; i < vehicleIds.length; i += MAX_IDS_PER_REQUEST) {
            const batchResult = await getSamsaraVehicleLocations(vehicleIds.slice(i, i + MAX_IDS_PER_REQUEST), companyId);
            if (batchResult) allResults.push(...batchResult);
        }
        return allResults.length > 0 ? allResults : null;
    }

    const params = new URLSearchParams();
    if (vehicleIds && vehicleIds.length > 0) params.append('vehicleIds', vehicleIds.join(','));
    params.append('types', 'currentLocation');

    let result = await samsaraRequest<{ data: SamsaraVehicle[] }>(
        `/fleet/vehicles/locations?${params.toString()}`,
        {},
        companyId
    );

    if (!result || !result.data) {
        const simpleParams = new URLSearchParams();
        if (vehicleIds && vehicleIds.length > 0) simpleParams.append('vehicleIds', vehicleIds.join(','));
        result = await samsaraRequest<{ data: SamsaraVehicle[] }>(
            `/fleet/vehicles/locations${simpleParams.toString() ? `?${simpleParams.toString()}` : ''}`,
            {},
            companyId
        );
    }

    if (!result || !result.data) return null;

    if (Array.isArray(result.data)) {
        if (result.data.length > 0 && 'vehicleId' in result.data[0]) {
            return result.data.map((entry: any) => ({ vehicleId: entry.vehicleId, location: entry.location }));
        }
        return result.data.map((vehicle: any) => ({ vehicleId: vehicle.id, location: vehicle.location || vehicle.gps }));
    }

    return [];
}
