export interface SheetConfig {
    lastImportedRow: number;
    columnMapping: Record<string, string> | null;
}

export interface CrmSheetsConfig {
    sheetId: string;
    sheets: Record<string, SheetConfig>;
}

/**
 * Normalize raw CRM integration config JSON into the multi-sheet format.
 * Handles backward compatibility with old single-sheet configs.
 *
 * Old format: { sheetId, sheetName, lastImportedRow, columnMapping }
 * New format: { sheetId, sheets: { "Sheet1": { lastImportedRow, columnMapping } } }
 */
export function normalizeCrmConfig(raw: Record<string, any>): CrmSheetsConfig {
    const sheetId = raw.sheetId || '';

    // Already new format
    if (raw.sheets && typeof raw.sheets === 'object' && !Array.isArray(raw.sheets)) {
        return { sheetId, sheets: raw.sheets };
    }

    // Migrate old single-sheet format
    const sheetName = raw.sheetName || 'Sheet1';
    return {
        sheetId,
        sheets: {
            [sheetName]: {
                lastImportedRow: raw.lastImportedRow || 0,
                columnMapping: raw.columnMapping || null,
            },
        },
    };
}

/** Get selected sheet names from a normalized config */
export function getSelectedSheets(config: CrmSheetsConfig): string[] {
    return Object.keys(config.sheets);
}

/** Get total imported rows across all sheets */
export function getTotalImportedRows(config: CrmSheetsConfig): number {
    return Object.values(config.sheets).reduce((sum, s) => sum + (s.lastImportedRow || 0), 0);
}
