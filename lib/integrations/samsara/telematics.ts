/**
 * Samsara Telematics
 * 
 * Methods for managing diagnostics, stats, trips, and camera media.
 */

import { samsaraRequest, unavailableEndpoints } from './client';
import { SamsaraVehicleDiagnostic, SamsaraVehicleStats, SamsaraTrip, SamsaraCameraMedia } from './types';

/**
 * Get diagnostics / fault codes for vehicles
 */
export async function getSamsaraVehicleDiagnostics(
    vehicleIds?: string[],
    companyId?: string
): Promise<SamsaraVehicleDiagnostic[] | null> {
    try {
        const MAX_IDS_PER_REQUEST = 50;
        if (vehicleIds && vehicleIds.length > MAX_IDS_PER_REQUEST) {
            const allResults: SamsaraVehicleDiagnostic[] = [];
            for (let i = 0; i < vehicleIds.length; i += MAX_IDS_PER_REQUEST) {
                const batchResult = await getSamsaraVehicleDiagnostics(vehicleIds.slice(i, i + MAX_IDS_PER_REQUEST), companyId);
                if (batchResult) allResults.push(...batchResult);
            }
            return allResults.length > 0 ? allResults : null;
        }

        const params = new URLSearchParams();
        params.append('types', 'faultCodes');
        if (vehicleIds && vehicleIds.length > 0) params.append('vehicleIds', vehicleIds.join(','));

        const statsResult = await samsaraRequest<any>(`/fleet/vehicles/stats?${params.toString()}`, {}, companyId);
        const dataArray = Array.isArray(statsResult) ? statsResult : (statsResult?.data && Array.isArray(statsResult.data) ? statsResult.data : []);

        if (dataArray && dataArray.length > 0) {
            return dataArray.map((entry: any) => {
                const vehicleId = entry.id || entry.vehicleId || entry.vehicle?.id;
                if (!vehicleId) return null;

                let faultCodesArray: any[] = [];
                let milStatus: any = null;
                let checkEngineLights: any = null;

                if (entry.faultCodes) {
                    if (entry.faultCodes.j1939) {
                        const j1939 = entry.faultCodes.j1939;
                        if (Array.isArray(j1939.diagnosticTroubleCodes)) {
                            faultCodesArray = j1939.diagnosticTroubleCodes.map((dtc: any) => ({
                                code: dtc.spnId ? `SPN${dtc.spnId}` : dtc.code,
                                description: dtc.spnDescription || dtc.fmiDescription || dtc.description,
                                severity: (j1939.checkEngineLights?.stopIsOn || dtc.milStatus === 1) ? 'critical' :
                                    (j1939.checkEngineLights?.warningIsOn || j1939.checkEngineLights?.emissionsIsOn) ? 'high' : 'medium',
                                active: dtc.occurrenceCount > 0,
                                occurredAt: entry.time || dtc.time,
                            }));
                        }
                        checkEngineLights = j1939.checkEngineLights;
                        milStatus = checkEngineLights?.warningIsOn || checkEngineLights?.emissionsIsOn || checkEngineLights?.protectIsOn || checkEngineLights?.stopIsOn;
                    } else if (Array.isArray(entry.faultCodes)) {
                        faultCodesArray = entry.faultCodes;
                    }
                }

                const checkEngineLightOn = milStatus === true || milStatus === 'On' || (checkEngineLights && (checkEngineLights.warningIsOn || checkEngineLights.emissionsIsOn));

                return {
                    vehicleId,
                    checkEngineLightOn: checkEngineLightOn || false,
                    faults: faultCodesArray,
                    lastUpdatedTime: entry.time || new Date().toISOString(),
                };
            }).filter((entry: any): entry is SamsaraVehicleDiagnostic => entry !== null);
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Get vehicle stats (speed, fuel, odometer, etc.)
 */
export async function getSamsaraVehicleStats(
    vehicleIds?: string[],
    companyId?: string
): Promise<SamsaraVehicleStats[] | null> {
    if (process.env.SAMSARA_STATS_ENABLED === 'false') return null;

    try {
        const request1Types = ['ecuSpeedMph', 'engineStates', 'engineRpm'];
        const params1 = new URLSearchParams();
        params1.append('types', request1Types.join(','));
        if (vehicleIds && vehicleIds.length > 0) params1.append('vehicleIds', vehicleIds.join(','));

        const result1 = await samsaraRequest<any>(`/fleet/vehicles/stats?${params1.toString()}`, {}, companyId);

        const request2Types = ['fuelPercents', 'obdOdometerMeters'];
        const params2 = new URLSearchParams();
        params2.append('types', request2Types.join(','));
        if (vehicleIds && vehicleIds.length > 0) params2.append('vehicleIds', vehicleIds.join(','));

        const result2 = await samsaraRequest<any>(`/fleet/vehicles/stats?${params2.toString()}`, {}, companyId);

        const stats1 = Array.isArray(result1) ? result1 : (result1?.data || []);
        const stats2 = Array.isArray(result2) ? result2 : (result2?.data || []);

        const statsMap = new Map<string, any>();
        stats1.forEach((entry: any) => {
            const vehicleId = entry?.id || entry?.vehicleId;
            if (vehicleId) statsMap.set(vehicleId, { ...entry, vehicleId });
        });

        stats2.forEach((entry: any) => {
            const vehicleId = entry?.id || entry?.vehicleId;
            if (vehicleId) {
                const existing = statsMap.get(vehicleId) || {};
                statsMap.set(vehicleId, {
                    ...existing,
                    ...entry,
                    vehicleId,
                    fuelPercents: entry.fuelPercents ?? existing.fuelPercents,
                    obdOdometerMeters: entry.obdOdometerMeters ?? existing.obdOdometerMeters,
                });
            }
        });

        return Array.from(statsMap.values());
    } catch (error) {
        return null;
    }
}

/**
 * Get recent trips for vehicles
 */
export async function getSamsaraTrips(
    vehicleIds?: string[],
    driverIds?: string[],
    companyId?: string,
    timeRange?: { startTime: string; endTime: string }
): Promise<SamsaraTrip[] | null> {
    if (process.env.SAMSARA_TRIPS_ENABLED === 'false') return null;

    if ((!vehicleIds || vehicleIds.length === 0) && (!driverIds || driverIds.length === 0)) return null;

    const limit = parseInt(process.env.SAMSARA_TRIPS_LIMIT || '100', 10); // Check more trips for historical loads

    // Use provided time range or default to last 24 hours
    const { startTime, endTime } = timeRange || (() => {
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        return { startTime: start.toISOString(), endTime: end.toISOString() };
    })();

    if (vehicleIds && vehicleIds.length > 0) {
        const allTrips: SamsaraTrip[] = [];
        for (let i = 0; i < vehicleIds.length; i += 50) {
            const batch = vehicleIds.slice(i, i + 50);
            // Use the calculated headers
            const params = new URLSearchParams({ vehicleIds: batch.join(','), startTime, endTime, limit: String(limit) });

            try {
                const result = await samsaraRequest<any>(`/trips?${params.toString()}`, {}, companyId);
                if (result) {
                    const trips = Array.isArray(result) ? result : (result.data || []);
                    allTrips.push(...trips);
                }
            } catch (error) {
                break;
            }
        }
        if (allTrips.length > 0) return allTrips;
    } else if (driverIds && driverIds.length > 0) {
        // Use the calculated headers
        const params = new URLSearchParams({ driverIds: driverIds.join(','), startTime, endTime, limit: String(limit) });
        const result = await samsaraRequest<any>(`/trips?${params.toString()}`, {}, companyId);
        if (result) return Array.isArray(result) ? result : (result.data || []);
    }

    return null;
}

/**
 * Get latest camera media (stills) for vehicles
 */
export async function getSamsaraCameraMedia(companyId?: string): Promise<SamsaraCameraMedia[] | null> {
    if (process.env.SAMSARA_CAMERA_MEDIA_ENABLED === 'false') return null;
    const requestedTypes = process.env.SAMSARA_CAMERA_MEDIA_TYPES || ['forwardFacing', 'driverFacing'].join(',');

    if (unavailableEndpoints.has('/fleet/cameras/media') && unavailableEndpoints.has('/safety/media')) return null;

    try {
        const mediaResult = await samsaraRequest<any>(`/fleet/cameras/media?types=${encodeURIComponent(requestedTypes)}`, {}, companyId);
        if (mediaResult) {
            const data = Array.isArray(mediaResult) ? mediaResult : mediaResult.data;
            if (data) return data;
        }
    } catch (error) {
        unavailableEndpoints.add('/fleet/cameras/media');
    }

    try {
        const endTime = new Date().toISOString();
        const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const result = await samsaraRequest<{ data?: SamsaraCameraMedia[] }>(`/safety/media?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`, {}, companyId);
        if (result?.data) return result.data;
    } catch (error) {
        unavailableEndpoints.add('/safety/media');
    }

    return null;
}
