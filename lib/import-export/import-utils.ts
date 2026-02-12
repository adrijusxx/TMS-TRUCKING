
import { normalizeState } from '@/lib/utils/state-utils';

/**
 * Normalizes a key for consistent header matching.
 * Trims whitespace, converts to lowercase, and replaces spaces with underscores.
 */
export const normalizeHeaderKey = (key: string): string => {
    return String(key || '').trim().toLowerCase().replace(/\s+/g, '_');
};

/**
 * Helper to get value from a row based on multiple possible header names.
 */
export const getRowValue = (row: any, headerNames: string[]): any => {
    const normalizedHeaders = headerNames.map(normalizeHeaderKey);

    for (const normalized of normalizedHeaders) {
        // Try exact match on normalized key
        const rowKeys = Object.keys(row);
        for (const key of rowKeys) {
            if (normalizeHeaderKey(key) === normalized) {
                const value = row[key];
                if (value !== undefined && value !== null && value !== '') {
                    return value;
                }
            }
        }

        // Try original header names
        for (const originalName of headerNames) {
            if (row[originalName] !== undefined && row[originalName] !== null && row[originalName] !== '') {
                return row[originalName];
            }
        }
    }
    return null;
};

/**
 * Parses a date string or number into a Date object.
 * Handles Excel serial dates and various string formats.
 */
export const parseImportDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'na') {
            return null;
        }

        // Standard JS parsing
        let date = new Date(trimmed);
        if (!isNaN(date.getTime())) return date;

        // Excel serial date match
        const excelSerialMatch = trimmed.match(/^(\d+)(\.\d+)?$/);
        if (excelSerialMatch) {
            const excelSerial = parseFloat(excelSerialMatch[1]);
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + excelSerial * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) return date;
        }

        // Common human-readable formats
        const formats = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
        ];

        for (const format of formats) {
            const match = trimmed.match(format);
            if (match) {
                let year, month, day;
                if (format === formats[1]) {
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                } else {
                    month = parseInt(match[1]) - 1;
                    day = parseInt(match[2]);
                    year = parseInt(match[3]);
                    if (month > 11) { // Assume DD/MM/YYYY
                        day = parseInt(match[1]);
                        month = parseInt(match[2]) - 1;
                    }
                }
                date = new Date(year, month, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
    }

    if (typeof value === 'number') {
        if (value > 0 && value < 10000000000000) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) return date;
        }
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        if (!isNaN(date.getTime())) return date;
    }

    return null;
};

/**
 * Pre-processes location data from strings like "City, ST ZIP"
 */
export const parseLocationString = (location: string | null): {
    city: string;
    state: string;
    zip?: string;
    address?: string
} | null => {
    if (!location) return null;
    const parts = String(location).split(',').map((p) => p.trim());
    if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        const zipMatch = lastPart.match(/\b(\d{5}(?:-\d{4})?)\b/);
        const zip = zipMatch ? zipMatch[1] : undefined;
        const stateRaw = zipMatch ? lastPart.replace(zipMatch[0], '').trim() : lastPart;
        const state = normalizeState(stateRaw) || stateRaw;

        return {
            city: parts[0],
            state: state.length === 2 ? state : '',
            zip,
            address: parts.length > 2 ? parts.slice(0, -2).join(', ') : parts[0]
        };
    }
    return null;
};

/**
 * Parses tags from string or array
 */
export const parseTags = (value: any): string[] | null => {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
            } catch { /* fall through */ }
        }
        const tags = value.split(',').map((t) => t.trim()).filter((t) => t);
        return tags.length > 0 ? tags : null;
    }
    return null;
};
