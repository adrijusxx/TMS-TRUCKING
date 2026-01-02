/**
 * Load Location Tracking Service
 * 
 * Polls Samsara for truck locations and automatically updates load status
 * when drivers arrive at pickup/delivery stops based on geofence proximity.
 */

import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';
import { LoadStatus } from '@prisma/client';

// Geofence radius in km (default: 0.5km / ~500m)
const DEFAULT_GEOFENCE_RADIUS_KM = 0.5;

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
    }>;
    // Fallback for single pickup/delivery loads
    pickupLat?: number | null;
    pickupLng?: number | null;
    deliveryLat?: number | null;
    deliveryLng?: number | null;
}

/**
 * Calculate haversine distance between two coordinates in km
 */
function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Check if truck is within geofence of a stop
 */
function isTruckNearStop(
    truckLat: number,
    truckLng: number,
    stopLat: number,
    stopLng: number,
    radiusKm: number = DEFAULT_GEOFENCE_RADIUS_KM
): boolean {
    const distance = haversineDistance(truckLat, truckLng, stopLat, stopLng);
    return distance <= radiusKm;
}

/**
 * Determine the next status based on current status and truck proximity
 */
function determineNextStatus(
    currentStatus: LoadStatus,
    nearPickup: boolean,
    nearDelivery: boolean
): LoadStatus | null {
    // Status transition logic based on location
    switch (currentStatus) {
        case 'ASSIGNED':
        case 'EN_ROUTE_PICKUP':
            if (nearPickup) return 'AT_PICKUP';
            break;
        case 'AT_PICKUP':
        case 'LOADED':
            // If truck left pickup area and is now near delivery
            if (nearDelivery) return 'AT_DELIVERY';
            // If truck left pickup area but not at delivery yet
            if (!nearPickup) return 'EN_ROUTE_DELIVERY';
            break;
        case 'EN_ROUTE_DELIVERY':
            if (nearDelivery) return 'AT_DELIVERY';
            break;
        // AT_DELIVERY -> DELIVERED requires manual confirmation (POD)
        // DELIVERED and beyond are not auto-updated
    }
    return null;
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
                truck: true,
                stops: {
                    orderBy: { sequence: 'asc' },
                },
            },
        });

        return loads.map((load: any) => ({
            loadId: load.id,
            loadNumber: load.loadNumber,
            currentStatus: load.status,
            truckSamsaraId: load.truck?.samsaraVehicleId || null,
            companyId: load.companyId,
            stops: (load.stops || []).map((stop: any) => ({
                id: stop.id,
                stopType: stop.stopType,
                sequence: stop.sequence,
                status: stop.status,
                lat: null, // Stops don't have lat/lng directly - would need geocoding
                lng: null,
                city: stop.city,
                state: stop.state,
            })),
            // Use main load pickup/delivery for geofence (simplified approach)
            pickupLat: null, // Would need geocoding service
            pickupLng: null,
            deliveryLat: null,
            deliveryLng: null,
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
        location?: { latitude: number; longitude: number }
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
            return true;
        } catch (error) {
            console.error(`[LoadLocationTracking] Failed to update load ${loadId}:`, error);
            return false;
        }
    }

    /**
     * Geocode an address to lat/lng using Google Maps API
     */
    private async geocodeAddress(
        address: string,
        city: string,
        state: string,
        zip?: string
    ): Promise<{ lat: number; lng: number } | null> {
        try {
            const apiKey = process.env.GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                console.debug('[LoadLocationTracking] Google Maps API key not configured');
                return null;
            }

            const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();
            if (data.status !== 'OK' || !data.results?.[0]) return null;

            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        } catch (error) {
            console.debug('[LoadLocationTracking] Geocoding failed:', error);
            return null;
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

            // Get unique Samsara vehicle IDs
            const samsaraIds = loads
                .map((l) => l.truckSamsaraId)
                .filter((id): id is string => !!id);

            if (samsaraIds.length === 0) {
                console.log('[LoadLocationTracking] No trucks with Samsara IDs found');
                return { processed, updated, errors };
            }

            // Fetch all truck locations at once from Samsara
            const truckLocations = await this.getTruckLocations(samsaraIds);

            // Process each load
            for (const load of loads) {
                if (!load.truckSamsaraId) continue;

                const truckLocation = truckLocations.get(load.truckSamsaraId);
                if (!truckLocation?.location) continue;

                const { latitude: truckLat, longitude: truckLng } = truckLocation.location;

                // Get first pickup stop and last delivery stop for geofence comparison
                const pickupStop = load.stops.find((s) => s.stopType === 'PICKUP');
                const deliveryStop = [...load.stops].reverse().find((s) => s.stopType === 'DELIVERY');

                let nearPickup = false;
                let nearDelivery = false;

                // Check proximity to pickup
                if (pickupStop && pickupStop.city && pickupStop.state) {
                    // Geocode pickup address
                    const pickupCoords = await this.geocodeAddress(
                        '', pickupStop.city, pickupStop.state
                    );
                    if (pickupCoords) {
                        nearPickup = isTruckNearStop(
                            truckLat, truckLng,
                            pickupCoords.lat, pickupCoords.lng,
                            this.geofenceRadiusKm
                        );
                    }
                }

                // Check proximity to delivery
                if (deliveryStop && deliveryStop.city && deliveryStop.state) {
                    const deliveryCoords = await this.geocodeAddress(
                        '', deliveryStop.city, deliveryStop.state
                    );
                    if (deliveryCoords) {
                        nearDelivery = isTruckNearStop(
                            truckLat, truckLng,
                            deliveryCoords.lat, deliveryCoords.lng,
                            this.geofenceRadiusKm
                        );
                    }
                }

                // Determine status change based on proximity
                const newStatus = determineNextStatus(load.currentStatus, nearPickup, nearDelivery);
                if (newStatus && newStatus !== load.currentStatus) {
                    const success = await this.updateLoadStatus(load.loadId, newStatus, { latitude: truckLat, longitude: truckLng });
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
 * Process location tracking for all companies with Samsara integration
 */
export async function processAllCompanies(): Promise<{
    companies: number;
    totalProcessed: number;
    totalUpdated: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let companies = 0;
    let totalProcessed = 0;
    let totalUpdated = 0;

    try {
        // Get all companies with active Samsara integration
        const companiesWithSamsara = await prisma.integration.findMany({
            where: {
                provider: 'SAMSARA',
                isActive: true,
            },
            select: { companyId: true },
        });

        companies = companiesWithSamsara.length;

        for (const { companyId } of companiesWithSamsara) {
            const service = new LoadLocationTrackingService(companyId);
            const result = await service.processAllActiveLoads();
            totalProcessed += result.processed;
            totalUpdated += result.updated;
            errors.push(...result.errors);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(msg);
        console.error('[LoadLocationTracking] Error processing companies:', error);
    }

    return { companies, totalProcessed, totalUpdated, errors };
}
