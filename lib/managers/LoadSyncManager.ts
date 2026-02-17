import { prisma } from '@/lib/prisma';
import { Load, LoadStop } from '@prisma/client';

/**
 * LoadSyncManager
 * 
 * Handles synchronization between Load stops and the Load summary header fields.
 * As per the "Zero Data Leak" and "Source of Truth" doctrine, the header fields
 * (pickupCity, deliveryCity, etc.) should reflect the first and last stops.
 */
export class LoadSyncManager {
    /**
     * Synchronize a load's header fields from its stops.
     * This should be called after any stop modification.
     */
    static async syncHeaderFromStops(loadId: string, tx?: any) {
        const db = tx || prisma;

        const stops = await db.loadStop.findMany({
            where: { loadId },
            orderBy: { sequence: 'asc' }
        });

        if (stops.length === 0) return;

        const firstStop = stops[0];
        const lastStop = stops[stops.length - 1];

        await db.load.update({
            where: { id: loadId },
            data: {
                // Pickup Header
                pickupCity: firstStop.city || null,
                pickupState: firstStop.state || null,
                pickupZip: firstStop.zip || null,
                pickupDate: firstStop.earliestArrival || firstStop.latestArrival || null,
                pickupLocation: firstStop.company || null,
                pickupAddress: firstStop.address || null,
                pickupCompany: firstStop.company || null,

                // Delivery Header
                deliveryCity: lastStop.city || null,
                deliveryState: lastStop.state || null,
                deliveryZip: lastStop.zip || null,
                deliveryDate: lastStop.latestArrival || lastStop.earliestArrival || null,
                deliveryLocation: lastStop.company || null,
                deliveryAddress: lastStop.address || null,
                deliveryCompany: lastStop.company || null,
            }
        });
    }

    /**
     * Utility to get the first/last stop for a load
     */
    static async getStopsSummary(loadId: string) {
        const stops = await prisma.loadStop.findMany({
            where: { loadId },
            orderBy: { sequence: 'asc' }
        });

        return {
            pickup: stops[0] || null,
            delivery: stops[stops.length - 1] || null,
            count: stops.length
        };
    }
}
