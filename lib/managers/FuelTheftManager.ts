import { prisma } from '@/lib/prisma';
import { getSamsaraVehicleLocations } from '@/lib/integrations/samsara';
import { haversineDistance } from '@/lib/utils/distance';
import { getTelegramNotificationService } from '@/lib/services/TelegramNotificationService';

export class FuelTheftManager {
    /**
     * Audit recent fuel transactions for a truck against its actual GPS location
     */
    async auditRecentTransactions(truckId: string, companyId: string): Promise<void> {
        // 1. Fetch recent fuel entries for this truck (last 24h)
        const entries = await prisma.fuelEntry.findMany({
            where: {
                truckId,
                latitude: { not: null },
                longitude: { not: null },
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            include: {
                truck: true,
                driver: { include: { user: true } }
            }
        });

        if (entries.length === 0) return;

        // 2. Get current/recent GPS from Samsara
        const truck = entries[0].truck;
        if (!truck.samsaraId) return;

        const locations = await getSamsaraVehicleLocations([truck.samsaraId], companyId);
        if (!locations || locations.length === 0) return;

        const truckGPS = locations[0];

        // 3. Compare transaction locations with GPS
        for (const entry of entries) {
            if (!entry.latitude || !entry.longitude) continue;

            if (!truckGPS.location) continue;

            const distance = haversineDistance(
                entry.latitude,
                entry.longitude,
                truckGPS.location.latitude,
                truckGPS.location.longitude
            );

            // If distance > 2.0 km (approx 1.25 miles), flag as anomaly
            if (distance > 2.0) {
                await this.flagTheftAnomaly(entry, distance, truckGPS);
            }
        }
    }

    private async flagTheftAnomaly(entry: any, distance: number, currentGPS: any) {
        // Create Anomaly record
        const anomaly = await prisma.aIAnomaly.create({
            data: {
                companyId: entry.truck.companyId,
                mcNumberId: entry.mcNumberId,
                type: 'FUEL_THEFT_RISK',
                severity: 'CRITICAL',
                title: `Potential Fuel Theft: ${entry.truck.truckNumber}`,
                description: `Fuel transaction (${entry.location}) is ${distance.toFixed(1)}km away from actual truck location.`,
                metadata: {
                    fuelEntryId: entry.id,
                    transactionCoords: { lat: entry.latitude, lng: entry.longitude },
                    truckCoords: { lat: currentGPS.latitude, lng: currentGPS.longitude },
                    distanceKm: distance
                }
            }
        });

        // Notify via Telegram
        const notificationService = getTelegramNotificationService();
        await notificationService.notifyFuelTheft({
            truckNumber: entry.truck.truckNumber,
            driverName: `${entry.driver?.user?.firstName || ''} ${entry.driver?.user?.lastName || ''}`.trim() || 'Unknown Driver',
            location: entry.location || 'Unknown Location',
            distance: distance
        });
    }
}
