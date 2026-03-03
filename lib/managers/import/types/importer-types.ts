/**
 * Shared types for the importer template method pipeline.
 */

export interface ImportOptions {
    previewOnly?: boolean;
    currentMcNumber?: string;
    updateExisting?: boolean;
    entity?: string;
    columnMapping?: Record<string, string>;
    importBatchId?: string;
    treatAsHistorical?: boolean;
    autoCreate?: {
        drivers?: boolean;
        customers?: boolean;
        trucks?: boolean;
        trailers?: boolean;
    };
    formatSettings?: {
        dispatcherMatchBy?: 'name' | 'email';
        dateFormat?: 'auto' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    };
}

export interface ImportContext {
    options: ImportOptions;
    errors: Array<{ row: number; field?: string; error: string }>;
    warnings: Array<{ row: number; field?: string; error: string }>;
    lookups: Record<string, any>;
    existingInFile: Set<string>;
}

export interface RowProcessResult {
    action: 'create' | 'update' | 'skip';
    data?: any;
    error?: { row: number; field?: string; error: string };
    warnings?: Array<{ row: number; field?: string; error: string }>;
}
