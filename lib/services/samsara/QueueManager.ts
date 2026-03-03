import { prisma } from '@/lib/prisma';
import { ApproveQueuedDeviceParams, ApproveQueuedDeviceResult, SamsaraDevice } from './types';
import { SamsaraMatchingService } from './MatchingService';

export class SamsaraQueueManager {
    private matchingService: SamsaraMatchingService;

    constructor() {
        this.matchingService = new SamsaraMatchingService();
    }

    /**
     * Add device to pending review queue
     */
    async addToQueue(companyId: string, device: SamsaraDevice, deviceType: 'TRUCK' | 'TRAILER') {
        const yearValue = device.year ? (typeof device.year === 'string' ? parseInt(device.year, 10) : device.year) : null;
        const validYear = yearValue && !isNaN(yearValue) ? yearValue : null;

        const existingQueueItem = await prisma.samsaraDeviceQueue.findUnique({
            where: { samsaraId: device.id },
        });

        if (existingQueueItem) {
            // Update metadata (name/VIN/etc may have changed in Samsara) but keep status
            await prisma.samsaraDeviceQueue.update({
                where: { id: existingQueueItem.id },
                data: {
                    name: device.name || existingQueueItem.name,
                    vin: device.vin || existingQueueItem.vin,
                    licensePlate: device.licensePlate || existingQueueItem.licensePlate,
                    make: device.make || existingQueueItem.make,
                    model: device.model || existingQueueItem.model,
                    year: validYear ?? existingQueueItem.year,
                },
            });
            return;
        }

        await prisma.samsaraDeviceQueue.create({
            data: {
                companyId,
                samsaraId: device.id,
                deviceType,
                name: device.name || `Unknown-${device.id.slice(0, 8)}`,
                vin: device.vin,
                licensePlate: device.licensePlate,
                make: device.make,
                model: device.model,
                year: validYear,
                status: 'PENDING',
            },
        });
    }

    /**
     * Approve a queued device
     */
    async approveQueuedDevice(
        queueId: string,
        userId: string,
        additionalData?: ApproveQueuedDeviceParams
    ): Promise<ApproveQueuedDeviceResult> {
        const queueItem = await prisma.samsaraDeviceQueue.findUnique({ where: { id: queueId } });
        if (!queueItem) return { success: false, error: 'Queue item not found' };
        if (queueItem.status === 'REJECTED') return { success: false, error: 'Item was rejected — use Re-queue first' };

        try {
            if (queueItem.deviceType === 'TRUCK') {
                return await this.approveTruck(queueId, userId, queueItem, additionalData);
            } else {
                return await this.approveTrailer(queueId, userId, queueItem, additionalData);
            }
        } catch (error: any) {
            return this.handleApprovalError(error, queueItem, additionalData, userId);
        }
    }

    private async approveTruck(queueId: string, userId: string, queueItem: any, additionalData?: ApproveQueuedDeviceParams): Promise<ApproveQueuedDeviceResult> {
        const truckNumber = additionalData?.truckNumber || queueItem.name;
        const now = new Date();

        const existingTruck = await this.findExistingTruck(queueItem, truckNumber);

        if (existingTruck) {
            if (existingTruck.samsaraId === queueItem.samsaraId) {
                await this.markQueueLinked(queueId, userId, existingTruck.id, 'TRUCK');
                return { success: true, recordId: existingTruck.id, action: 'linked' };
            }

            if (existingTruck.samsaraId) {
                return { success: false, error: `Truck "${existingTruck.truckNumber}" is already linked to a different Samsara device. Use the Link action to connect this device to a different truck.` };
            }

            await this.linkTruck(existingTruck.id, queueItem);
            await this.markQueueLinked(queueId, userId, existingTruck.id, 'TRUCK');
            return { success: true, recordId: existingTruck.id, action: 'linked' };
        }

        if (this.isGateway(queueItem.name)) {
            return { success: false, error: 'Gateway device detected' };
        }

        const truck = await this.createNewTruck(queueItem, truckNumber, additionalData);
        await this.markQueueApproved(queueId, userId, truck.id, 'TRUCK');
        return { success: true, recordId: truck.id, action: 'created' };
    }

    private async approveTrailer(queueId: string, userId: string, queueItem: any, additionalData?: ApproveQueuedDeviceParams): Promise<ApproveQueuedDeviceResult> {
        const trailerNumber = additionalData?.trailerNumber || queueItem.name;
        const now = new Date();

        const existingTrailer = await this.findExistingTrailer(queueItem, trailerNumber);

        if (existingTrailer) {
            if (existingTrailer.samsaraId === queueItem.samsaraId) {
                await this.markQueueLinked(queueId, userId, existingTrailer.id, 'TRAILER');
                return { success: true, recordId: existingTrailer.id, action: 'linked' };
            }

            if (existingTrailer.samsaraId) {
                return { success: false, error: `Trailer "${existingTrailer.trailerNumber}" is already linked to a different Samsara device. Use the Link action to connect this device to a different trailer.` };
            }

            await this.linkTrailer(existingTrailer.id, queueItem);
            await this.markQueueLinked(queueId, userId, existingTrailer.id, 'TRAILER');
            return { success: true, recordId: existingTrailer.id, action: 'linked' };
        }

        const trailer = await this.createNewTrailer(queueItem, trailerNumber, additionalData);
        await this.markQueueApproved(queueId, userId, trailer.id, 'TRAILER');
        return { success: true, recordId: trailer.id, action: 'created' };
    }

    private async findExistingTruck(queueItem: any, truckNumber: string) {
        const allTrucks = await prisma.truck.findMany({
            where: { companyId: queueItem.companyId, deletedAt: null },
            select: { id: true, truckNumber: true, vin: true, samsaraId: true },
        });

        if (queueItem.vin) {
            const byVin = allTrucks.find(t => t.vin?.toUpperCase() === queueItem.vin?.toUpperCase());
            if (byVin) return byVin;
        }

        const normTarget = this.matchingService.normalize(truckNumber);
        const numTarget = truckNumber.replace(/\D/g, '');

        return allTrucks.find(t => {
            const normNum = this.matchingService.normalize(t.truckNumber);
            const tNum = t.truckNumber.replace(/\D/g, '');
            return (normTarget && normNum === normTarget) || (numTarget && numTarget.length >= 2 && tNum === numTarget);
        }) || null;
    }

    private async findExistingTrailer(queueItem: any, trailerNumber: string) {
        const allTrailers = await prisma.trailer.findMany({
            where: { companyId: queueItem.companyId, deletedAt: null },
            select: { id: true, trailerNumber: true, vin: true, samsaraId: true },
        });

        if (queueItem.vin) {
            const byVin = allTrailers.find(t => t.vin?.toUpperCase() === queueItem.vin?.toUpperCase());
            if (byVin) return byVin;
        }

        const normTarget = this.matchingService.normalize(trailerNumber);
        const numTarget = trailerNumber.replace(/\D/g, '');

        return allTrailers.find(t => {
            const normNum = this.matchingService.normalize(t.trailerNumber);
            const tNum = t.trailerNumber.replace(/\D/g, '');
            return (normTarget && normNum === normTarget) || (numTarget && numTarget.length >= 2 && tNum === numTarget);
        }) || null;
    }

    private async createNewTruck(queueItem: any, truckNumber: string, additionalData?: ApproveQueuedDeviceParams) {
        return prisma.truck.create({
            data: {
                companyId: queueItem.companyId,
                truckNumber,
                vin: queueItem.vin || `PENDING-${queueItem.samsaraId}-${Date.now()}`,
                make: queueItem.make || 'Unknown',
                model: queueItem.model || 'Unknown',
                year: queueItem.year || new Date().getFullYear(),
                licensePlate: queueItem.licensePlate || 'PENDING',
                state: 'TX',
                equipmentType: (additionalData?.equipmentType as any) || 'DRY_VAN',
                capacity: 45000,
                registrationExpiry: new Date(Date.now() + 31536000000),
                insuranceExpiry: new Date(Date.now() + 31536000000),
                inspectionExpiry: new Date(Date.now() + 31536000000),
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
                mcNumberId: additionalData?.mcNumberId,
            },
        });
    }

    private async createNewTrailer(queueItem: any, trailerNumber: string, additionalData?: ApproveQueuedDeviceParams) {
        return prisma.trailer.create({
            data: {
                companyId: queueItem.companyId,
                trailerNumber,
                vin: queueItem.vin,
                make: queueItem.make || 'Unknown',
                model: queueItem.model || 'Unknown',
                year: queueItem.year,
                licensePlate: queueItem.licensePlate,
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
                mcNumberId: additionalData?.mcNumberId,
            },
        });
    }

    private async linkTruck(id: string, queueItem: any, updateInfo = true) {
        await prisma.truck.update({
            where: { id },
            data: {
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
                ...(updateInfo ? {
                    make: queueItem.make || undefined,
                    model: queueItem.model || undefined,
                    year: queueItem.year || undefined,
                    vin: queueItem.vin || undefined,
                } : {}),
            },
        });
    }

    private async linkTrailer(id: string, queueItem: any, updateInfo = true) {
        await prisma.trailer.update({
            where: { id },
            data: {
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
                ...(updateInfo ? {
                    make: queueItem.make || undefined,
                    model: queueItem.model || undefined,
                    year: queueItem.year || undefined,
                    vin: queueItem.vin || undefined,
                } : {}),
            },
        });
    }

    private async markQueueLinked(id: string, userId: string, recordId: string, type: 'TRUCK' | 'TRAILER') {
        await prisma.samsaraDeviceQueue.update({
            where: { id },
            data: { status: 'LINKED', matchedRecordId: recordId, matchedType: type, reviewedAt: new Date(), reviewedBy: { connect: { id: userId } } },
        });
    }

    private async markQueueApproved(id: string, userId: string, recordId: string, type: 'TRUCK' | 'TRAILER') {
        await prisma.samsaraDeviceQueue.update({
            where: { id },
            data: { status: 'APPROVED', matchedRecordId: recordId, matchedType: type, reviewedAt: new Date(), reviewedBy: { connect: { id: userId } } },
        });
    }

    private async rejectQueueItem(id: string, userId: string, reason: string) {
        await prisma.samsaraDeviceQueue.update({
            where: { id },
            data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: { connect: { id: userId } }, rejectionReason: reason },
        });
    }

    private isGateway(name: string): boolean {
        const s = name.toLowerCase();
        return s.includes('gateway') || s.includes('deactivated') || /^[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(name);
    }

    private handleApprovalError(error: any, queueItem: any, additionalData: any, userId: string): ApproveQueuedDeviceResult {
        if (error.code === 'P2002') {
            return { success: false, error: 'Conflict: This item already exists' };
        }
        return { success: false, error: error.message };
    }

    async linkQueuedDevice(queueId: string, recordId: string, recordType: 'TRUCK' | 'TRAILER', userId: string, updateInfo = true) {
        const queueItem = await prisma.samsaraDeviceQueue.findUnique({ where: { id: queueId } });
        if (!queueItem) return { success: false, error: 'Queue item not found' };

        try {
            if (recordType === 'TRUCK') await this.linkTruck(recordId, queueItem, updateInfo);
            else await this.linkTrailer(recordId, queueItem, updateInfo);
        } catch (error: any) {
            if (error.code === 'P2002') {
                return {
                    success: false,
                    error: `VIN conflict: another ${recordType.toLowerCase()} already has VIN "${queueItem.vin}". Uncheck "Update vehicle info" or resolve the duplicate first.`,
                };
            }
            throw error;
        }

        await this.markQueueLinked(queueId, userId, recordId, recordType);
        return { success: true };
    }

    async rejectQueuedDevice(queueId: string, userId: string, reason?: string) {
        await this.rejectQueueItem(queueId, userId, reason || 'Manually rejected');
        return { success: true };
    }

    /**
     * Reset a device back to PENDING for re-review (from any status)
     */
    async requeueDevice(queueId: string, userId: string) {
        const item = await prisma.samsaraDeviceQueue.findUnique({ where: { id: queueId } });
        if (!item) return { success: false, error: 'Queue item not found' };
        if (item.status === 'PENDING') return { success: true }; // Already pending

        await prisma.samsaraDeviceQueue.update({
            where: { id: queueId },
            data: {
                status: 'PENDING',
                matchedRecordId: null,
                matchedType: null,
                reviewedAt: new Date(),
                reviewedBy: { connect: { id: userId } },
                rejectionReason: null,
            },
        });
        return { success: true };
    }

    /**
     * Bulk reset queue items to PENDING status
     */
    async bulkResetToPending(queueIds: string[], userId: string) {
        let success = 0;
        let failed = 0;
        for (const id of queueIds) {
            const result = await this.requeueDevice(id, userId);
            if (result.success) success++;
            else failed++;
        }
        return { success, failed };
    }

    /**
     * Auto-link a single queued device by matching name/VIN/plate to existing TMS records
     */
    async autoLinkDevice(queueId: string, userId: string): Promise<{ success: boolean; error?: string }> {
        const item = await prisma.samsaraDeviceQueue.findUnique({ where: { id: queueId } });
        if (!item) return { success: false, error: 'Queue item not found' };
        if (item.status !== 'PENDING') return { success: false, error: 'Only PENDING items can be auto-linked' };

        const device = {
            id: item.samsaraId,
            name: item.name,
            vin: item.vin ?? undefined,
            licensePlate: item.licensePlate ?? undefined,
            make: item.make ?? undefined,
            model: item.model ?? undefined,
            year: item.year ?? undefined,
        };

        const match = await this.matchingService.matchToExistingRecord(
            item.companyId,
            device,
            item.deviceType as 'TRUCK' | 'TRAILER'
        );

        if (!match) return { success: false, error: 'No matching record found' };

        if (match.type === 'TRUCK') await this.linkTruck(match.recordId, item);
        else await this.linkTrailer(match.recordId, item);

        await this.markQueueLinked(queueId, userId, match.recordId, match.type);
        return { success: true };
    }

    /**
     * Bulk auto-link pending devices by matching to existing TMS records
     */
    async bulkAutoLink(queueIds: string[], userId: string) {
        let linked = 0;
        let unmatched = 0;
        let errors = 0;
        for (const id of queueIds) {
            try {
                const result = await this.autoLinkDevice(id, userId);
                if (result.success) linked++;
                else unmatched++;
            } catch {
                errors++;
            }
        }
        return { linked, unmatched, errors };
    }
}
