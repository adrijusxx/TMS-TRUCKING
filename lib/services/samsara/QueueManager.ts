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
        const existingQueueItem = await prisma.samsaraDeviceQueue.findUnique({
            where: { samsaraId: device.id },
        });

        if (existingQueueItem) return;

        const yearValue = device.year ? (typeof device.year === 'string' ? parseInt(device.year, 10) : device.year) : null;

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
                year: yearValue && !isNaN(yearValue) ? yearValue : null,
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
        if (!queueItem || queueItem.status !== 'PENDING') return { success: false, error: 'Invalid or processed item' };

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
                await this.rejectQueueItem(queueId, userId, `Already linked to different device`);
                return { success: true, recordId: existingTruck.id, action: 'rejected' };
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
                await this.rejectQueueItem(queueId, userId, `Already linked to different device`);
                return { success: true, recordId: existingTrailer.id, action: 'rejected' };
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

    private async linkTruck(id: string, queueItem: any) {
        await prisma.truck.update({
            where: { id },
            data: {
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
                make: queueItem.make || undefined,
                model: queueItem.model || undefined,
                year: queueItem.year || undefined,
                vin: queueItem.vin || undefined,
            },
        });
    }

    private async linkTrailer(id: string, queueItem: any) {
        await prisma.trailer.update({
            where: { id },
            data: {
                samsaraId: queueItem.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
                make: queueItem.make || undefined,
                model: queueItem.model || undefined,
                year: queueItem.year || undefined,
                vin: queueItem.vin || undefined,
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

    async linkQueuedDevice(queueId: string, recordId: string, recordType: 'TRUCK' | 'TRAILER', userId: string) {
        const now = new Date();
        const queueItem = await prisma.samsaraDeviceQueue.findUnique({ where: { id: queueId } });
        if (!queueItem) throw new Error('Queue item not found');

        if (recordType === 'TRUCK') await this.linkTruck(recordId, queueItem);
        else await this.linkTrailer(recordId, queueItem);

        await this.markQueueLinked(queueId, userId, recordId, recordType);
        return { success: true };
    }

    async rejectQueuedDevice(queueId: string, userId: string, reason?: string) {
        await this.rejectQueueItem(queueId, userId, reason || 'Manually rejected');
        return { success: true };
    }
}
