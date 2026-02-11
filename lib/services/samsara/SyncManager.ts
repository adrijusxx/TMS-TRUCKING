import { prisma } from '@/lib/prisma';
import { SamsaraApiService } from './ApiService';
import { SamsaraMatchingService } from './MatchingService';
import { SamsaraQueueManager } from './QueueManager';
import { SyncResult, SamsaraDevice, MatchResult } from './types';

export class SamsaraSyncManager {
    private apiService: SamsaraApiService;
    private matchingService: SamsaraMatchingService;
    private queueManager: SamsaraQueueManager;

    constructor() {
        this.apiService = new SamsaraApiService();
        this.matchingService = new SamsaraMatchingService();
        this.queueManager = new SamsaraQueueManager();
    }

    /**
     * Full sync of all Samsara devices
     */
    async syncAllDevices(companyId: string): Promise<SyncResult> {
        const result: SyncResult = { matched: 0, created: 0, updated: 0, queued: 0, errors: [] };

        try {
            const { vehicles, assets } = await this.apiService.fetchData(companyId, result.errors);
            const statsMap = await this.apiService.fetchStatsMap(companyId);

            // Process Vehicles (Trucks)
            for (const vehicle of vehicles || []) {
                try {
                    const stats = statsMap.get(vehicle.id);
                    const device: SamsaraDevice = {
                        id: vehicle.id,
                        name: vehicle.name,
                        vin: vehicle.vin,
                        licensePlate: vehicle.licensePlate,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year,
                        odometerMiles: stats?.odometerMiles,
                        engineHours: stats?.engineHours,
                    };
                    const outcome = await this.processDevice(companyId, device, 'TRUCK');
                    if (outcome === 'matched') result.matched++;
                    else if (outcome === 'updated') result.updated++;
                    else if (outcome === 'queued') result.queued++;
                } catch (e: any) {
                    result.errors.push(`Vehicle ${vehicle.name}: ${e.message}`);
                }
            }

            // Process Assets (Trailers)
            for (const asset of assets || []) {
                try {
                    const device: SamsaraDevice = {
                        id: asset.id,
                        name: asset.name,
                        vin: asset.vin,
                        licensePlate: asset.licensePlate,
                    };
                    const outcome = await this.processDevice(companyId, device, 'TRAILER');
                    if (outcome === 'matched') result.matched++;
                    else if (outcome === 'updated') result.updated++;
                    else if (outcome === 'queued') result.queued++;
                } catch (e: any) {
                    result.errors.push(`Asset ${asset.name}: ${e.message}`);
                }
            }

            return result;
        } catch (error: any) {
            result.errors.push(`Sync failed: ${error.message}`);
            return result;
        }
    }

    private async processDevice(companyId: string, device: SamsaraDevice, type: 'TRUCK' | 'TRAILER'): Promise<'matched' | 'updated' | 'queued' | 'skipped'> {
        // 1. Check if linked
        const linkedId = type === 'TRUCK'
            ? await prisma.truck.findUnique({ where: { samsaraId: device.id }, select: { id: true } })
            : await prisma.trailer.findUnique({ where: { samsaraId: device.id }, select: { id: true } });

        if (linkedId) {
            await this.updateLinkedRecord(linkedId.id, device, type);
            return 'updated';
        }

        // 2. Try match
        const match = await this.matchingService.matchToExistingRecord(companyId, device, type);
        if (match) {
            await this.linkAndUpdateRecord(device, match);
            return 'matched';
        }

        // 3. Queue
        await this.queueManager.addToQueue(companyId, device, type);
        return 'queued';
    }

    private async updateLinkedRecord(id: string, device: SamsaraDevice, type: 'TRUCK' | 'TRAILER') {
        const now = new Date();
        if (type === 'TRUCK') {
            await prisma.truck.update({
                where: { id },
                data: {
                    samsaraSyncedAt: now,
                    samsaraSyncStatus: 'SYNCED',
                    lastOdometerReading: device.odometerMiles,
                    lastOdometerUpdate: device.odometerMiles ? now : undefined,
                    lastEngineHours: device.engineHours,
                },
            });
        } else {
            await prisma.trailer.update({
                where: { id },
                data: { samsaraSyncedAt: now, samsaraSyncStatus: 'SYNCED' },
            });
        }
    }

    private async linkAndUpdateRecord(device: SamsaraDevice, match: MatchResult) {
        const now = new Date();
        const yearValue = device.year ? (typeof device.year === 'string' ? parseInt(device.year, 10) : device.year) : undefined;
        const validYear = yearValue && !isNaN(yearValue) ? yearValue : undefined;

        const data: any = {
            samsaraId: device.id,
            samsaraSyncedAt: now,
            samsaraSyncStatus: 'SYNCED',
            vin: device.vin || undefined,
            make: device.make || undefined,
            model: device.model || undefined,
            year: validYear,
        };

        if (match.type === 'TRUCK') {
            data.lastOdometerReading = device.odometerMiles;
            data.lastOdometerUpdate = device.odometerMiles ? now : undefined;
            data.lastEngineHours = device.engineHours;
            await prisma.truck.update({ where: { id: match.recordId }, data });
        } else {
            await prisma.trailer.update({ where: { id: match.recordId }, data });
        }
    }

    /**
     * Sync odometer readings for all linked trucks
     */
    async syncOdometerReadings(companyId: string): Promise<number> {
        const trucks = await prisma.truck.findMany({
            where: { companyId, deletedAt: null, samsaraId: { not: null } },
            select: { id: true, samsaraId: true },
        });

        if (trucks.length === 0) return 0;

        const statsMap = await this.apiService.fetchStatsMap(companyId);
        let updated = 0;

        for (const truck of trucks) {
            const stats = statsMap.get(truck.samsaraId!);
            if (stats?.odometerMiles !== undefined) {
                await prisma.truck.update({
                    where: { id: truck.id },
                    data: { lastOdometerReading: stats.odometerMiles, lastOdometerUpdate: new Date() },
                });
                updated++;
            }
        }

        return updated;
    }
}
