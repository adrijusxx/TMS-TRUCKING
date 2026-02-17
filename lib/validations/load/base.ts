import { z } from 'zod';

// Stop item schema
export const stopItemSchema = z.object({
    orderId: z.string().optional(),
    item: z.string().optional(),
    product: z.string().optional(),
    pieces: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
            if (typeof val === 'string') {
                const num = parseInt(val, 10);
                return isNaN(num) ? undefined : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? undefined : val;
            }
            return undefined;
        },
        z.number().int().positive().optional()
    ),
    weight: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? undefined : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? undefined : val;
            }
            return undefined;
        },
        z.number().positive().optional()
    ),
    description: z.string().optional(),
});

// Stop schema for multi-stop loads
export const loadStopSchema = z.object({
    stopType: z.enum(['PICKUP', 'DELIVERY']),
    sequence: z.number().int().positive(),
    company: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional()
    ),
    address: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val || ''),
        z.string().min(1, 'Address is required')
    ),
    city: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val || ''),
        z.string().min(1, 'City is required')
    ),
    state: z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                const trimmed = val.trim().toUpperCase();
                return trimmed.length >= 2 ? trimmed.slice(0, 2) : trimmed;
            }
            return val || '';
        },
        z.string().length(2, 'State must be 2 characters')
    ),
    zip: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim() : val || ''),
        z.string().min(5, 'ZIP code is required (minimum 5 characters)')
    ),
    phone: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional()
    ),
    earliestArrival: z.preprocess(
        (val) => {
            if (val === null || val === undefined) return undefined;
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'string') return val;
            return val;
        },
        z.string().or(z.date()).optional()
    ),
    latestArrival: z.preprocess(
        (val) => {
            if (val === null || val === undefined) return undefined;
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'string') return val;
            return val;
        },
        z.string().or(z.date()).optional()
    ),
    contactName: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional()
    ),
    contactPhone: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional()
    ),
    items: z.preprocess(
        (val) => {
            if (!val || val === null) return undefined;
            if (Array.isArray(val)) {
                return val.map((item) => {
                    if (typeof item === 'string') {
                        try {
                            return JSON.parse(item);
                        } catch {
                            return { description: item };
                        }
                    }
                    return item;
                });
            }
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    return Array.isArray(parsed) ? parsed : undefined;
                } catch {
                    return undefined;
                }
            }
            return undefined;
        },
        z.array(stopItemSchema).optional()
    ),
    totalPieces: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
            if (typeof val === 'string') {
                const num = parseInt(val, 10);
                return isNaN(num) ? undefined : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? undefined : val;
            }
            return undefined;
        },
        z.number().int().positive().optional()
    ),
    totalWeight: z.preprocess(
        (val) => {
            if (val === undefined || val === null || val === '' || val === 'NaN') return undefined;
            if (typeof val === 'string') {
                const num = parseFloat(val);
                return isNaN(num) ? undefined : num;
            }
            if (typeof val === 'number') {
                return isNaN(val) ? undefined : val;
            }
            return undefined;
        },
        z.number().positive().optional()
    ),
    notes: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional()
    ),
    specialInstructions: z.preprocess(
        (val) => (val === null || val === undefined ? undefined : (typeof val === 'string' ? val.trim() : String(val))),
        z.string().optional()
    ),
});
