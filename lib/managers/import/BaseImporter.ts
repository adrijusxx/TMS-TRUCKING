import { PrismaClient } from '@prisma/client';
import { getRowValue } from '@/lib/import-export/import-utils';

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

    abstract import(data: any[], options: {
        previewOnly?: boolean;
        currentMcNumber?: string;
        updateExisting?: boolean;
        entity?: string;
        columnMapping?: Record<string, string>;
        importBatchId?: string;
        treatAsHistorical?: boolean;
    }): Promise<ImportResult>;

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
        // 1. Try to find by provided value
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

        // 2. HARD FALLBACK: Find the default MC for this company
        const defaultMc = await this.prisma.mcNumber.findFirst({
            where: { companyId: this.companyId, isDefault: true, deletedAt: null },
            select: { id: true }
        });
        if (defaultMc) return defaultMc.id;

        // 3. NUCLEAR FALLBACK: Just find the first available MC for this company
        const firstMc = await this.prisma.mcNumber.findFirst({
            where: { companyId: this.companyId, deletedAt: null },
            select: { id: true }
        });
        return firstMc?.id || null;
    }

    /**
     * Gets a value from a row, respecting column mapping if provided.
     * If the row already has the system field as a key (pre-mapped data, e.g. from registration),
     * return it so importers work without columnMapping.
     */
    protected getValue(row: any, systemField: string, mapping: Record<string, string> | undefined, synonyms: string[]): any {
        const direct = row?.[systemField];
        if (direct !== undefined && direct !== null && direct !== '') {
            return direct;
        }

        if (mapping) {
            // Find which CSV header(s) map to this system field
            const mappedHeaders: string[] = [];
            for (const [csvHeader, mappedSystemField] of Object.entries(mapping)) {
                if (mappedSystemField === systemField) {
                    mappedHeaders.push(csvHeader);
                }
            }

            if (mappedHeaders.length > 0) {
                // Use getRowValue with the mapped headers (flexible normalization matching)
                const mappedValue = getRowValue(row, mappedHeaders);
                if (mappedValue !== undefined && mappedValue !== null && mappedValue !== '') {
                    return mappedValue;
                }
            }
        }

        // Fallback to synonym matching
        return getRowValue(row, synonyms);
    }
}
