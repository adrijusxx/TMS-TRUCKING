import { PrismaClient, StopType } from '@prisma/client';
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
        const BATCH_SIZE = 50;

        for (let i = 0; i < loads.length; i += BATCH_SIZE) {
            const batch = loads.slice(i, i + BATCH_SIZE);

            try {
                await this.prisma.$transaction(async (tx) => {
                    for (const data of batch) {
                        try {
                            const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                            const cleanData = { ...rest, companyId: this.companyId, importBatchId };

                            // 1. Create Load
                            const newLoad = await tx.load.create({
                                data: cleanData as any
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
                                    latestArrival: cleanData.pickupDate, // Or add window if available
                                    notes: cleanData.dispatchNotes
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
                                    notes: cleanData.dispatchNotes
                                }
                            });

                            count++;
                        } catch (err: any) {
                            // If one fails in the transaction block, it might roll back the whole block 
                            // if we don't catch it. 
                            // However, we want strict transaction for Load+Stops.
                            // If we want partial success of the BATCH, we should not wrap the whole loop in one transaction.
                            // BUT, for performance, we want batching.
                            // Strategy: We will wrap EACH Load+Stops creation in its own small promise 
                            // inside the transaction array? No, $transaction takes an array of promises.
                            // But here we need dependent creates (Load ID needed for Stops).
                            // So we cannot use $transaction([createLoad, createStop]) easily for batch.

                            // fallback: we are inside an async handler. valid pattern:
                            throw err; // Re-throw to be caught by outer try/catch or handle per item?
                        }
                    }
                });
            } catch (batchError) {
                // If the batch transaction fails, we fallback to individual processing
                // to save as many as possible
                for (const data of batch) {
                    try {
                        const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                        const cleanData = { ...rest, companyId: this.companyId, importBatchId };

                        await this.prisma.$transaction(async (tx) => {
                            const newLoad = await tx.load.create({ data: cleanData as any });

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
                                    notes: cleanData.dispatchNotes
                                }
                            });

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
                                    notes: cleanData.dispatchNotes
                                }
                            });
                        });
                        count++;
                    } catch (singleErr: any) {
                        errors.push({ row: 0, error: `Create failed: ${singleErr.message}` });
                    }
                }
            }
        }
        return { count, errors };
    }

    private async executeUpdateBatch(loads: any[]) {
        const BATCH_SIZE = 20; // Reduce batch size for complex transactions
        let count = 0;
        const errors: any[] = [];

        for (let i = 0; i < loads.length; i += BATCH_SIZE) {
            const batch = loads.slice(i, i + BATCH_SIZE);

            // Should prompt for transaction
            for (const u of batch) {
                try {
                    const { id, ...data } = u;
                    const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                    // Ensure we have valid dates and locations
                    const cleanData = { ...rest, companyId: this.companyId };

                    await this.prisma.$transaction(async (tx) => {
                        // 1. Update Load
                        const updatedLoad = await tx.load.update({
                            where: { id },
                            data: { ...cleanData, deletedAt: null } as any
                        });

                        // 2. Manage Stops
                        // Check if stops exist
                        const existingStops = await tx.loadStop.findMany({
                            where: { loadId: id },
                            orderBy: { sequence: 'asc' }
                        });

                        if (existingStops.length === 0) {
                            // CREATE stops if none exist
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
                            // UPDATE existing stops to match new header data (optional but good for consistency)
                            // We only update the first pickup and last delivery to avoid messing up multi-stop loads
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
                    });
                    count++;
                } catch (err: any) {
                    errors.push({ row: 0, error: `Update failed for ${u.loadNumber}: ${err.message}` });
                }
            }
        }
        return { count, errors };
    }
}
