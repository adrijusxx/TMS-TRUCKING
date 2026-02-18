import { z } from 'zod';
import { baseLoadSchema } from './main';

const datePreprocess = (val: unknown) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (val instanceof Date) return val;
    if (typeof val === 'string') { const d = new Date(val); return isNaN(d.getTime()) ? undefined : d; }
    return undefined;
};

/**
 * Lenient import schema for bulk load imports
 */
export const importLoadSchema = baseLoadSchema
    .extend({
        pickupState: z.string().optional(),
        deliveryState: z.string().optional(),
        pickupZip: z.string().optional(),
        deliveryZip: z.string().optional(),
        pickupLocation: z.string().optional(),
        pickupAddress: z.string().optional(),
        pickupCity: z.string().optional(),
        deliveryLocation: z.string().optional(),
        deliveryAddress: z.string().optional(),
        deliveryCity: z.string().optional().nullable(),
        pickupDate: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().or(z.date()).optional().nullable()),
        deliveryDate: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().or(z.date()).optional().nullable()),
        tripId: z.string().optional().nullable(),
        stopsCount: z.preprocess(
            (val) => {
                if (val === undefined || val === null || val === '') return null;
                if (typeof val === 'string') { const n = parseInt(val, 10); return isNaN(n) ? null : n; }
                if (typeof val === 'number') return isNaN(val) ? null : val;
                return null;
            },
            z.number().int().nonnegative().optional().nullable()
        ),
        lastNote: z.string().optional().nullable(),
        onTimeDelivery: z.string().optional().nullable(),
        lastUpdate: z.preprocess(datePreprocess, z.date().optional().nullable()),

        // Computed fields set by LoadImporter
        readyForSettlement: z.boolean().optional(),
        netProfit: z.number().optional().nullable(),
        assignedAt: z.preprocess(datePreprocess, z.date().optional().nullable()),
        pickedUpAt: z.preprocess(datePreprocess, z.date().optional().nullable()),
        deliveredAt: z.preprocess(datePreprocess, z.date().optional().nullable()),
        invoicedAt: z.preprocess(datePreprocess, z.date().optional().nullable()),
        paidAt: z.preprocess(datePreprocess, z.date().optional().nullable()),

        // Stop contact info (passed through to LoadStop creation)
        pickupContact: z.string().optional().nullable(),
        pickupPhone: z.string().optional().nullable(),
        deliveryContact: z.string().optional().nullable(),
        deliveryPhone: z.string().optional().nullable(),
    });

export type ImportLoadInput = z.infer<typeof importLoadSchema>;
