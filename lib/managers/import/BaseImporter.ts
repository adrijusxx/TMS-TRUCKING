import { PrismaClient } from '@prisma/client';
import { getRowValue } from '@/lib/import-export/import-utils';
import type { ImportOptions, ImportContext, RowProcessResult } from './types/importer-types';

export interface ImportResult {
    success: boolean;
    created?: any[];
    updated?: any[];
    errors: Array<{ row: number; field?: string; error: string }>;
    warnings: Array<{ row: number; field?: string; error: string }>;
    preview?: any[];
    summary?: {
        total: number;
        created: number;
        updated: number;
        skipped: number;
        errors: number;
    };
}

/**
 * BaseImporter — Template Method base class for all entity importers.
 *
 * Pipeline (when subclass does NOT override import()):
 *   1. Build ImportContext
 *   2. preFetchLookups(ctx)
 *   3. Row loop → processRow() → toCreate[] / toUpdate[]
 *   4. If previewOnly → buildPreviewResult()
 *   5. persist(toCreate, toUpdate, ctx)
 *   6. postImport(ctx, result)
 *   7. buildFinalResult()
 *
 * Backward compat: old importers that override import() fully bypass the template.
 */
export abstract class BaseImporter {
    protected prisma: PrismaClient;
    protected companyId: string;
    protected userId: string;
    protected BATCH_SIZE = 500;

    constructor(prisma: PrismaClient, companyId: string, userId: string) {
        this.prisma = prisma;
        this.companyId = companyId;
        this.userId = userId;
    }

    // ─── Template Method ───────────────────────────────────────────────

    /**
     * Concrete template method. Subclasses that implement processRow() get
     * the full pipeline for free. Subclasses that override import() bypass it.
     */
    async import(data: any[], options: ImportOptions): Promise<ImportResult> {
        const ctx: ImportContext = {
            options,
            errors: [],
            warnings: [],
            lookups: {},
            existingInFile: new Set<string>(),
        };

        // 1. Pre-fetch lookups
        ctx.lookups = await this.preFetchLookups(ctx);

        // 2. Row loop
        const toCreate: any[] = [];
        const toUpdate: any[] = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;
            try {
                const result = await this.processRow(row, rowNum, ctx);
                if (result.warnings) ctx.warnings.push(...result.warnings);
                if (result.action === 'create' && result.data) {
                    toCreate.push(result.data);
                } else if (result.action === 'update' && result.data) {
                    toUpdate.push(result.data);
                } else if (result.action === 'skip' && result.error) {
                    ctx.errors.push(result.error);
                }
            } catch (err: any) {
                ctx.errors.push(this.error(rowNum, err.message || 'Processing failed'));
            }
        }

        // 3. Preview mode
        if (options.previewOnly) {
            return this.buildPreview(data.length, toCreate, toUpdate, ctx);
        }

        // 4. Persist
        const persistResult = await this.persist(toCreate, toUpdate, ctx);

        // 5. Post-import hook
        await this.postImport(ctx, persistResult);

        // 6. Final result
        return this.buildFinal(data.length, toCreate, toUpdate, persistResult, ctx);
    }

    // ─── Subclass Hooks (override these) ───────────────────────────────

    /**
     * Pre-fetch database records and build lookup maps.
     * Called once before the row loop. Return value is stored in ctx.lookups.
     */
    protected async preFetchLookups(_ctx: ImportContext): Promise<Record<string, any>> {
        return {};
    }

    /**
     * Process a single row. Must return create/update/skip with data.
     * Default throws — subclasses using the template MUST implement this.
     */
    protected async processRow(_row: any, _rowNum: number, _ctx: ImportContext): Promise<RowProcessResult> {
        throw new Error('processRow() not implemented — subclass must override import() or processRow()');
    }

    /**
     * Persist create and update arrays. Default uses batchCreate + individual updates.
     * Override for custom persistence (e.g., nested User+Driver creation).
     */
    protected async persist(
        toCreate: any[],
        toUpdate: any[],
        ctx: ImportContext
    ): Promise<{ createdCount: number; updatedCount: number }> {
        let createdCount = 0;
        let updatedCount = 0;

        if (toCreate.length > 0) {
            createdCount = await this.batchCreate(toCreate, ctx);
        }

        if (ctx.options.updateExisting && toUpdate.length > 0) {
            updatedCount = await this.batchUpdate(toUpdate, ctx);
        }

        return { createdCount, updatedCount };
    }

    /**
     * Optional post-import hook. Called after persist, before final result.
     * Use for side effects like auto-calculating miles, sending notifications, etc.
     */
    protected async postImport(
        _ctx: ImportContext,
        _persistResult: { createdCount: number; updatedCount: number }
    ): Promise<void> {
        // no-op by default
    }

    // ─── Persistence Helpers ───────────────────────────────────────────

    /**
     * Batch create using createMany with skipDuplicates, fallback to individual.
     * Override useCreateMany() to switch to individual creates.
     */
    protected async batchCreate(items: any[], ctx: ImportContext): Promise<number> {
        const delegate = this.getPrismaDelegate();
        let createdCount = 0;

        if (this.useCreateMany()) {
            for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
                const batch = items.slice(i, i + this.BATCH_SIZE);
                try {
                    await (delegate as any).createMany({ data: batch, skipDuplicates: true });
                    createdCount += batch.length;
                } catch {
                    // Fallback to individual creates
                    for (const item of batch) {
                        try {
                            await (delegate as any).create({ data: item });
                            createdCount++;
                        } catch (e: any) {
                            ctx.errors.push(this.error(0, `Create failed: ${e.message}`));
                        }
                    }
                }
            }
        } else {
            for (const item of items) {
                try {
                    await (delegate as any).create({ data: item });
                    createdCount++;
                } catch (e: any) {
                    ctx.errors.push(this.error(0, `Create failed: ${e.message}`));
                }
            }
        }

        return createdCount;
    }

    /**
     * Update items individually by ID.
     */
    protected async batchUpdate(items: any[], ctx: ImportContext): Promise<number> {
        const delegate = this.getPrismaDelegate();
        let updatedCount = 0;

        for (const item of items) {
            const { id, ...dataToUpdate } = item;
            if (!id) continue;
            try {
                await (delegate as any).update({ where: { id }, data: dataToUpdate });
                updatedCount++;
            } catch (e: any) {
                ctx.errors.push(this.error(0, `Update failed: ${e.message}`));
            }
        }

        return updatedCount;
    }

    /**
     * Returns the Prisma model delegate for this entity.
     * Override in subclass: e.g., `return this.prisma.vendor`
     */
    protected getPrismaDelegate(): any {
        throw new Error('getPrismaDelegate() not implemented');
    }

    /**
     * Whether to use createMany (batch) or individual creates.
     * Override to return false for entities needing individual creates.
     */
    protected useCreateMany(): boolean {
        return true;
    }

    // ─── Dedup Helpers ─────────────────────────────────────────────────

    /**
     * Check and add a key to file-level dedup set.
     * Returns true if the key is a duplicate (already seen).
     */
    protected checkFileDedup(key: string, ctx: ImportContext): boolean {
        if (ctx.existingInFile.has(key)) return true;
        ctx.existingInFile.add(key);
        return false;
    }

    /**
     * Check multiple keys for file-level dedup.
     * Returns the first duplicate key found, or null if none.
     */
    protected checkMultipleFileDedup(keys: string[], ctx: ImportContext): string | null {
        for (const key of keys) {
            if (key && ctx.existingInFile.has(key)) return key;
        }
        for (const key of keys) {
            if (key) ctx.existingInFile.add(key);
        }
        return null;
    }

    // ─── Result Builders ───────────────────────────────────────────────

    protected buildPreview(
        total: number,
        toCreate: any[],
        toUpdate: any[],
        ctx: ImportContext
    ): ImportResult {
        return this.success(
            {
                total,
                created: toCreate.length,
                updated: toUpdate.length,
                skipped: ctx.errors.length + ctx.warnings.length,
                errors: ctx.errors.length,
            },
            toCreate.slice(0, 10),
            ctx.errors,
            ctx.warnings
        );
    }

    protected buildFinal(
        total: number,
        toCreate: any[],
        _toUpdate: any[],
        persistResult: { createdCount: number; updatedCount: number },
        ctx: ImportContext
    ): ImportResult {
        return this.success(
            {
                total,
                created: persistResult.createdCount,
                updated: persistResult.updatedCount,
                skipped: total - persistResult.createdCount - persistResult.updatedCount - ctx.errors.length,
                errors: ctx.errors.length,
            },
            toCreate,
            ctx.errors,
            ctx.warnings
        );
    }

    // ─── Existing Helpers (unchanged) ──────────────────────────────────

    protected error(row: number, error: string, field?: string) {
        return { row, field, error };
    }

    protected warning(row: number, message: string, field?: string) {
        return { row, field, error: `[Warning] ${message}` };
    }

    protected getFutureDate(years: number = 1): Date {
        const d = new Date();
        d.setFullYear(d.getFullYear() + years);
        return d;
    }

    protected getPlaceholder(prefix: string, rowNum: number): string {
        return `${prefix}-${rowNum}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    }

    protected success(summary: ImportResult['summary'], created: any[] = [], errors: any[] = [], warnings: any[] = []): ImportResult {
        return {
            success: true,
            created,
            errors,
            warnings,
            summary
        };
    }

    /**
     * Resolves an MC number string or ID to a valid MC Number ID record.
     */
    protected async resolveMcNumberId(mcValue: string | null | undefined): Promise<string | null> {
        if (mcValue) {
            const mcStr = String(mcValue).trim();
            if (mcStr) {
                // Try direct ID match
                if (mcStr.length === 25 && mcStr.startsWith('cm')) {
                    const match = await this.prisma.mcNumber.findFirst({
                        where: { id: mcStr, companyId: this.companyId, deletedAt: null },
                        select: { id: true }
                    });
                    if (match) return match.id;
                }

                // Try by number
                const byNumber = await this.prisma.mcNumber.findFirst({
                    where: { number: mcStr, companyId: this.companyId, deletedAt: null },
                    select: { id: true }
                });
                if (byNumber) return byNumber.id;

                // Try by company name
                const byName = await this.prisma.mcNumber.findFirst({
                    where: { companyName: { equals: mcStr, mode: 'insensitive' }, companyId: this.companyId, deletedAt: null },
                    select: { id: true }
                });
                if (byName) return byName.id;
            }
        }

        // HARD FALLBACK: Find the default MC for this company
        const defaultMc = await this.prisma.mcNumber.findFirst({
            where: { companyId: this.companyId, isDefault: true, deletedAt: null },
            select: { id: true }
        });
        if (defaultMc) return defaultMc.id;

        // NUCLEAR FALLBACK: Just find the first available MC for this company
        const firstMc = await this.prisma.mcNumber.findFirst({
            where: { companyId: this.companyId, deletedAt: null },
            select: { id: true }
        });
        return firstMc?.id || null;
    }

    /**
     * Gets a value from a row, respecting column mapping if provided.
     */
    protected getValue(row: any, systemField: string, mapping: Record<string, string> | undefined, synonyms: string[]): any {
        const direct = row?.[systemField];
        if (direct !== undefined && direct !== null && direct !== '') {
            return direct;
        }

        if (mapping) {
            const mappedHeaders: string[] = [];
            for (const [csvHeader, mappedSystemField] of Object.entries(mapping)) {
                if (mappedSystemField === systemField) {
                    mappedHeaders.push(csvHeader);
                }
            }

            if (mappedHeaders.length > 0) {
                const mappedValue = getRowValue(row, mappedHeaders);
                if (mappedValue !== undefined && mappedValue !== null && mappedValue !== '') {
                    return mappedValue;
                }
            }
        }

        return getRowValue(row, synonyms);
    }
}
