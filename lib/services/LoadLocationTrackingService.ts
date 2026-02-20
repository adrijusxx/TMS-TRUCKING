/**
 * Load Location Tracking Service
 *
 * Polls Samsara for truck locations and automatically updates load status
 * when drivers arrive at pickup/delivery stops based on geofence proximity.
 */

import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';
import { geocodeAddress } from '@/lib/maps/google-maps';
import { haversineDistanceKm } from '@/lib/utils/geo';
import { LoadStatus } from '@prisma/client';
import { DetentionManager } from '../managers/DetentionManager';

// Geofence radius in km (default: 0.5km / ~500m)
const DEFAULT_GEOFENCE_RADIUS_KM = 0.5;
// Buffer for leaving geofence to prevent drift flip-flopping (e.g. 1.2x radius)
const EXIT_RADIUS_MULTIPLIER = 1.2;

interface TruckLocation {
    vehicleId: string;
    location: {
        latitude: number;
        longitude: number;
    } | null;
}

interface StopCoordinates {
    loadId: string;
    loadNumber: string;
    currentStatus: LoadStatus;
    truckSamsaraId: string | null;
    companyId: string;
    stops: Array<{
        id: string;
        stopType: 'PICKUP' | 'DELIVERY';
        sequence: number;
        status: string;
        lat: number | null;
        lng: number | null;
        city: string;
        state: string;
        address: string;
    }>;
}

/**
 * Determine the next status based on current status and truck proximity
 */
function determineNextStatus(
    currentStatus: LoadStatus,
    nearPickup: boolean,
    nearDelivery: boolean,
    approachingPickup: boolean,
    approachingDelivery: boolean
): LoadStatus | null {
    switch (currentStatus) {
        case 'ASSIGNED':
        case 'EN_ROUTE_PICKUP':
            if (approachingPickup) return 'AT_PICKUP';
            break;
        case 'AT_PICKUP':
        case 'LOADED':
            if (approachingDelivery) return 'AT_DELIVERY';
            if (!nearPickup) return 'EN_ROUTE_DELIVERY';
            break;
        case 'EN_ROUTE_DELIVERY':
            if (approachingDelivery) return 'AT_DELIVERY';
            break;
    }
    return null;
}

/**
 * Resolve stop coordinates — use cached lat/lng from DB, fall back to geocoding
 */
async function resolveStopCoords(
    stop: StopCoordinates['stops'][0]
): Promise<{ lat: number; lng: number } | null> {
    // Use stored coordinates if available (from schema migration)
    if (stop.lat != null && stop.lng != null) {
        return { lat: stop.lat, lng: stop.lng };
    }

    // Fall back to cached geocoding
    if (!stop.city || !stop.state) return null;
    const fullAddress = [stop.address, stop.city, stop.state].filter(Boolean).join(', ');
    const result = await geocodeAddress(fullAddress);
    return result ? { lat: result.lat, lng: result.lng } : null;
}

export class LoadLocationTrackingService {
    private companyId: string;
    private geofenceRadiusKm: number;

    constructor(companyId: string, geofenceRadiusKm?: number) {
        this.companyId = companyId;
        this.geofenceRadiusKm = geofenceRadiusKm ?? DEFAULT_GEOFENCE_RADIUS_KM;
    }

    /**
     * Get all active loads with assigned trucks for this company
     */
    private async getActiveLoadsWithTrucks(): Promise<StopCoordinates[]> {
        const activeStatuses: LoadStatus[] = [
            'ASSIGNED',
            'EN_ROUTE_PICKUP',
            'AT_PICKUP',
            'LOADED',
            'EN_ROUTE_DELIVERY',
        ];

        const loads = await prisma.load.findMany({
            where: {
                companyId: this.companyId,
                status: { in: activeStatuses },
                truckId: { not: null },
                deletedAt: null,
            },
            include: {
                truck: { select: { samsaraId: true } },
                stops: {
                    orderBy: { sequence: 'asc' },
                    select: {
                        id: true, stopType: true, sequence: true, status: true,
                        lat: true, lng: true, city: true, state: true, address: true,
                    },
                },
            },
        });

        return loads.map((load: any) => ({
            loadId: load.id,
            loadNumber: load.loadNumber,
            currentStatus: load.status,
            truckSamsaraId: load.truck?.samsaraId || null,
            companyId: load.companyId,
            stops: (load.stops || []).map((stop: any) => ({
                id: stop.id,
                stopType: stop.stopType,
                sequence: stop.sequence,
                status: stop.status,
                lat: stop.lat ?? null,
                lng: stop.lng ?? null,
                city: stop.city,
                state: stop.state,
                address: stop.address || '',
            })),
        }));
    }

    /**
     * Get truck locations from Samsara
     */
    private async getTruckLocations(samsaraIds: string[]): Promise<Map<string, TruckLocation>> {
        const locations = await getSamsaraVehicleLocations(samsaraIds, this.companyId);
        const locationMap = new Map<string, TruckLocation>();

        if (locations) {
            locations.forEach((loc) => {
                locationMap.set(loc.vehicleId, {
                    vehicleId: loc.vehicleId,
                    location: loc.location ? {
                        latitude: loc.location.latitude,
                        longitude: loc.location.longitude,
                    } : null,
                });
            });
        }

        return locationMap;
    }

    /**
     * Update load status and record in history
     */
    private async updateLoadStatus(
        loadId: string,
        newStatus: LoadStatus,
        location?: { latitude: number; longitude: number },
        stopId?: string
    ): Promise<boolean> {
        try {
            await prisma.$transaction([
                prisma.load.update({
                    where: { id: loadId },
                    data: {
                        status: newStatus,
                        ...(newStatus === 'AT_PICKUP' && { pickedUpAt: new Date() }),
                    },
                }),
                prisma.loadStatusHistory.create({
                    data: {
                        loadId,
                        status: newStatus,
                        notes: 'Auto-updated via Samsara location tracking',
                        latitude: location?.latitude,
                        longitude: location?.longitude,
                        createdBy: 'SYSTEM',
                    },
                }),
            ]);

            if (stopId && (newStatus === 'AT_PICKUP' || newStatus === 'AT_DELIVERY')) {
                const detentionManager = new DetentionManager();
                await detentionManager.handleGeofenceEntry(stopId);
            }

            return true;
        } catch (error) {
            console.error(`[LoadLocationTracking] Failed to update load ${loadId}:`, error);
            return false;
        }
    }

    /**
     * Process all active loads and update statuses based on truck locations
     */
    async processAllActiveLoads(): Promise<{ processed: number; updated: number; errors: string[] }> {
        const errors: string[] = [];
        let processed = 0;
        let updated = 0;

        try {
            const loads = await this.getActiveLoadsWithTrucks();
            processed = loads.length;

            const samsaraIds = loads
                .map((l) => l.truckSamsaraId)
                .filter((id): id is string => !!id);

            if (samsaraIds.length === 0) {
                console.log('[LoadLocationTracking] No trucks with Samsara IDs found');
                return { processed, updated, errors };
            }

            const truckLocations = await this.getTruckLocations(samsaraIds);

            for (const load of loads) {
                if (!load.truckSamsaraId) continue;

                const truckLocation = truckLocations.get(load.truckSamsaraId);
                if (!truckLocation?.location) continue;

                const { latitude: truckLat, longitude: truckLng } = truckLocation.location;

                const pickupStop = load.stops.find((s) => s.stopType === 'PICKUP');
                const deliveryStop = [...load.stops].reverse().find((s) => s.stopType === 'DELIVERY');

                let nearPickup = false;
                let nearDelivery = false;
                let approachingPickup = false;
                let approachingDelivery = false;

                if (pickupStop) {
                    const coords = await resolveStopCoords(pickupStop);
                    if (coords) {
                        const dist = haversineDistanceKm(truckLat, truckLng, coords.lat, coords.lng);
                        approachingPickup = dist <= this.geofenceRadiusKm;
                        nearPickup = dist <= (this.geofenceRadiusKm * EXIT_RADIUS_MULTIPLIER);
                    }
                }

                if (deliveryStop) {
                    const coords = await resolveStopCoords(deliveryStop);
                    if (coords) {
                        const dist = haversineDistanceKm(truckLat, truckLng, coords.lat, coords.lng);
                        approachingDelivery = dist <= this.geofenceRadiusKm;
                        nearDelivery = dist <= (this.geofenceRadiusKm * EXIT_RADIUS_MULTIPLIER);
                    }
                }

                const newStatus = determineNextStatus(
                    load.currentStatus, nearPickup, nearDelivery,
                    approachingPickup, approachingDelivery
                );

                if (newStatus && newStatus !== load.currentStatus) {
                    let targetStopId: string | undefined;
                    if (newStatus === 'AT_PICKUP' && pickupStop) targetStopId = pickupStop.id;
                    if (newStatus === 'AT_DELIVERY' && deliveryStop) targetStopId = deliveryStop.id;

                    const success = await this.updateLoadStatus(
                        load.loadId, newStatus,
                        { latitude: truckLat, longitude: truckLng },
                        targetStopId
                    );

                    if (success) {
                        updated++;
                        console.log(`[LoadLocationTracking] Updated ${load.loadNumber}: ${load.currentStatus} -> ${newStatus}`);
                    } else {
                        errors.push(`Failed to update ${load.loadNumber}`);
                    }
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(msg);
            console.error('[LoadLocationTracking] Error processing loads:', error);
        }

        return { processed, updated, errors };
    }
}

/**
 * Process location tracking for all companies with Samsara integration.
 * Checks both SamsaraSettings and legacy Integration tables.
 */
export async function processAllCompanies(): Promise<{
    companies: number;
    totalProcessed: number;
    totalUpdated: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let totalProcessed = 0;
    let totalUpdated = 0;

    try {
        // Query both tables and deduplicate by companyId
        const [samsaraSettings, legacyIntegrations] = await Promise.all([
            prisma.samsaraSettings.findMany({ select: { companyId: true } }),
            prisma.integration.findMany({
                where: { provider: 'SAMSARA', isActive: true },
                select: { companyId: true },
            }),
        ]);

        const companyIds = [
            ...new Set([
                ...samsaraSettings.map((s) => s.companyId),
                ...legacyIntegrations.map((i) => i.companyId),
            ]),
        ];

        for (const companyId of companyIds) {
            const service = new LoadLocationTrackingService(companyId);
            const result = await service.processAllActiveLoads();
            totalProcessed += result.processed;
            totalUpdated += result.updated;
            errors.push(...result.errors);
        }

        return { companies: companyIds.length, totalProcessed, totalUpdated, errors };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(msg);
        console.error('[LoadLocationTracking] Error processing companies:', error);
        return { companies: 0, totalProcessed, totalUpdated, errors };
    }
}
