
import { PrismaClient } from '@prisma/client';

export interface ImportResult {
    success: boolean;
    count: number;
    errors: Array<{ row: number; field?: string; error: string }>;
    warnings: Array<{ row: number; field?: string; error: string }>;
    preview?: any[];
}

export abstract class BaseImporter {
    protected prisma: PrismaClient;
    protected companyId: string;
    protected userId: string;

    constructor(prisma: PrismaClient, companyId: string, userId: string) {
        this.prisma = prisma;
        this.companyId = companyId;
        this.userId = userId;
    }

    protected error(row: number, error: string, field?: string) {
        return { row, field, error };
    }

    protected success(count: number, errors: any[] = [], warnings: any[] = [], preview?: any[]): ImportResult {
        return {
            success: true,
            count,
            errors,
            warnings,
            preview
        };
    }
}
