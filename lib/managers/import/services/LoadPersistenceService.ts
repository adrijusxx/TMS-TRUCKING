import { LoadType, EquipmentType, PrismaClient, StopType } from '@prisma/client';
import { importLoadSchema } from '@/lib/validations/load';

/**
 * LoadPersistenceService
 * 
 * Handles batching, validation, and saving/updating of loads in the database.
 */
export class LoadPersistenceService {
    constructor(private prisma: PrismaClient, private companyId: string) { }

    /**
     * Batch save new loads and update existing ones
     */
    async persist(
        preparedLoads: any[],
        options: { updateExisting?: boolean; importBatchId?: string }
    ) {
        const { updateExisting, importBatchId } = options;
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const errors: any[] = [];

        // 1. Deduplicate by loadNumber
        const uniqueLoads = new Map<string, any>();
        for (const load of preparedLoads) {
            if (uniqueLoads.has(load.data.loadNumber)) skippedCount++;
            uniqueLoads.set(load.data.loadNumber, load);
        }
        const finalLoads = Array.from(uniqueLoads.values());

        // 2. Fetch existing loads for update/skip logic
        const loadNumbers = finalLoads.map(l => String(l.data.loadNumber).trim());
        const existingLoads = await this.prisma.load.findMany({
            where: { loadNumber: { in: loadNumbers }, companyId: this.companyId },
            select: { id: true, loadNumber: true }
        });
        const existingMap = new Map(existingLoads.map(l => [l.loadNumber.trim().toLowerCase(), l]));

        const toCreate: any[] = [];
        const toUpdate: any[] = [];

        for (const load of finalLoads) {
            const normalizedNum = String(load.data.loadNumber).trim().toLowerCase();
            const existing = existingMap.get(normalizedNum);

            if (existing) {
                if (updateExisting) toUpdate.push({ ...load.data, id: existing.id });
                else skippedCount++;
            } else {
                toCreate.push(load.data);
            }
        }

        // 3. Execute Create Batch
        if (toCreate.length > 0) {
            const createResult = await this.executeCreateBatch(toCreate, importBatchId);
            createdCount = createResult.count;
            errors.push(...createResult.errors);
        }

        // 4. Execute Update Batch
        if (toUpdate.length > 0) {
            const updateResult = await this.executeUpdateBatch(toUpdate);
            updatedCount = updateResult.count;
            errors.push(...updateResult.errors);
        }

        return { createdCount, updatedCount, skippedCount, errors };
    }

    private async executeCreateBatch(loads: any[], importBatchId?: string) {
        let count = 0;
        const errors: any[] = [];

        // Use a transaction for the entire batch to ensure data integrity
        // We handle one by one inside the loop but grouped in a large transaction if possible, 
        // or just map over them. Since we need to create stops for EACH load, 
        // a simple createMany is not sufficient.

        // We will process in chunks to avoid massive transactions
        const BATCH_SIZE = 20;

        for (let i = 0; i < loads.length; i += BATCH_SIZE) {
            const batch = loads.slice(i, i + BATCH_SIZE);

            // Process each load in its own transaction for robustness
            // This prevents a single slow save from killing the whole batch
            await Promise.all(batch.map(async (data) => {
                try {
                    const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                    const cleanData = { ...rest, companyId: this.companyId, importBatchId };

                    await this.prisma.$transaction(async (tx) => {
                        // 1. Create Load (without redundant header fields if they will be synced, 
                        // but for now we keep them for performance and initial display)
                        const newLoad = await tx.load.create({
                            data: {
                                ...cleanData,
                                // Enforce some defaults for new fields
                                urgency: (cleanData as any).urgency || 'NORMAL',
                            } as any
                        });

                        // 2. Create Pickup Stop
                        await tx.loadStop.create({
                            data: {
                                loadId: newLoad.id,
                                stopType: 'PICKUP',
                                sequence: 1,
                                company: cleanData.pickupLocation || cleanData.pickupCompany || 'Shipper',
                                address: cleanData.pickupAddress || `${cleanData.pickupCity}, ${cleanData.pickupState}`,
                                city: cleanData.pickupCity || 'Unknown',
                                state: cleanData.pickupState || 'XX',
                                zip: cleanData.pickupZip || '00000',
                                earliestArrival: cleanData.pickupDate,
                                latestArrival: cleanData.pickupDate,
                            }
                        });

                        // 3. Create Delivery Stop
                        await tx.loadStop.create({
                            data: {
                                loadId: newLoad.id,
                                stopType: 'DELIVERY',
                                sequence: 2,
                                company: cleanData.deliveryLocation || cleanData.deliveryCompany || 'Consignee',
                                address: cleanData.deliveryAddress || `${cleanData.deliveryCity}, ${cleanData.deliveryState}`,
                                city: cleanData.deliveryCity || 'Unknown',
                                state: cleanData.deliveryState || 'XX',
                                zip: cleanData.deliveryZip || '00000',
                                earliestArrival: cleanData.deliveryDate,
                                latestArrival: cleanData.deliveryDate,
                            }
                        });
                    }, { timeout: 30000 });

                    count++;
                } catch (err: any) {
                    errors.push({ row: i, error: `Create failed: ${err.message}` });
                }
            }));
        }
        return { count, errors };
    }

    private async executeUpdateBatch(loads: any[]) {
        const BATCH_SIZE = 20; // Reduce batch size for complex transactions
        let count = 0;
        const errors: any[] = [];

        for (let i = 0; i < loads.length; i += BATCH_SIZE) {
            const batch = loads.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (u) => {
                try {
                    const { id, ...data } = u;
                    const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                    const cleanData = { ...rest, companyId: this.companyId };

                    await this.prisma.$transaction(async (tx) => {
                        // 1. Update Load
                        const updatedLoad = await tx.load.update({
                            where: { id },
                            data: { ...cleanData, deletedAt: null } as any
                        });

                        // 2. Manage Stops
                        const existingStops = await tx.loadStop.findMany({
                            where: { loadId: id },
                            orderBy: { sequence: 'asc' }
                        });

                        if (existingStops.length === 0) {
                            await tx.loadStop.create({
                                data: {
                                    loadId: id,
                                    stopType: 'PICKUP',
                                    sequence: 1,
                                    company: cleanData.pickupLocation || cleanData.pickupCompany || 'Shipper',
                                    address: cleanData.pickupAddress || `${cleanData.pickupCity}, ${cleanData.pickupState}`,
                                    city: cleanData.pickupCity || 'Unknown',
                                    state: cleanData.pickupState || 'XX',
                                    zip: cleanData.pickupZip || '00000',
                                    earliestArrival: cleanData.pickupDate,
                                    latestArrival: cleanData.pickupDate,
                                    notes: cleanData.dispatchNotes
                                }
                            });

                            await tx.loadStop.create({
                                data: {
                                    loadId: id,
                                    stopType: 'DELIVERY',
                                    sequence: 2,
                                    company: cleanData.deliveryLocation || cleanData.deliveryCompany || 'Consignee',
                                    address: cleanData.deliveryAddress || `${cleanData.deliveryCity}, ${cleanData.deliveryState}`,
                                    city: cleanData.deliveryCity || 'Unknown',
                                    state: cleanData.deliveryState || 'XX',
                                    zip: cleanData.deliveryZip || '00000',
                                    earliestArrival: cleanData.deliveryDate,
                                    latestArrival: cleanData.deliveryDate,
                                    notes: cleanData.dispatchNotes
                                }
                            });
                        } else {
                            const firstPickup = existingStops.find(s => s.stopType === 'PICKUP' && s.sequence === 1);
                            const lastDelivery = existingStops.find(s => s.stopType === 'DELIVERY' && s.sequence === Math.max(...existingStops.map(s => s.sequence)));

                            if (firstPickup) {
                                await tx.loadStop.update({
                                    where: { id: firstPickup.id },
                                    data: {
                                        city: cleanData.pickupCity || undefined,
                                        state: cleanData.pickupState || undefined,
                                        earliestArrival: cleanData.pickupDate || undefined,
                                        notes: cleanData.dispatchNotes || undefined
                                    }
                                });
                            }

                            if (lastDelivery) {
                                await tx.loadStop.update({
                                    where: { id: lastDelivery.id },
                                    data: {
                                        city: cleanData.deliveryCity || undefined,
                                        state: cleanData.deliveryState || undefined,
                                        earliestArrival: cleanData.deliveryDate || undefined,
                                        notes: cleanData.dispatchNotes || undefined
                                    }
                                });
                            }
                        }
                    }, { timeout: 30000 });
                    count++;
                } catch (err: any) {
                    errors.push({ row: i, error: `Update failed for ${u.loadNumber}: ${err.message}` });
                }
            }));
        }
        return { count, errors };
    }
}
