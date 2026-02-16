import { PrismaClient } from '@prisma/client';
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
        const BATCH_SIZE = 100;
        let count = 0;
        const errors: any[] = [];

        for (let i = 0; i < loads.length; i += BATCH_SIZE) {
            const batch = loads.slice(i, i + BATCH_SIZE);
            const valid = batch.map(d => {
                try {
                    const { mcNumber, stops, ...rest } = importLoadSchema.parse(d);
                    return { ...rest, companyId: this.companyId, importBatchId };
                } catch (e: any) {
                    errors.push({ row: 0, error: `Validation failed: ${e.message}` });
                    return null;
                }
            }).filter(Boolean);

            if (valid.length > 0) {
                await this.prisma.load.createMany({ data: valid as any, skipDuplicates: true });
                count += valid.length;
            }
        }
        return { count, errors };
    }

    private async executeUpdateBatch(loads: any[]) {
        const BATCH_SIZE = 50;
        let count = 0;
        const errors: any[] = [];

        for (let i = 0; i < loads.length; i += BATCH_SIZE) {
            const batch = loads.slice(i, i + BATCH_SIZE);
            try {
                await this.prisma.$transaction(
                    batch.map(u => {
                        const { id, ...data } = u;
                        const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                        return this.prisma.load.update({ where: { id }, data: { ...rest, deletedAt: null } as any });
                    })
                );
                count += batch.length;
            } catch (e: any) {
                // Fallback individual if transaction fails
                for (const u of batch) {
                    try {
                        const { id, ...data } = u;
                        const { mcNumber, stops, ...rest } = importLoadSchema.parse(data);
                        await this.prisma.load.update({ where: { id }, data: { ...rest, deletedAt: null } as any });
                        count++;
                    } catch (err: any) {
                        errors.push({ row: 0, error: `Update failed for ${u.loadNumber}: ${err.message}` });
                    }
                }
            }
        }
        return { count, errors };
    }
}
