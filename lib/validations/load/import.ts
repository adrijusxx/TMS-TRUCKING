import { z } from 'zod';
import { baseLoadSchema } from './main';

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
    })
    ;

export type ImportLoadInput = z.infer<typeof importLoadSchema>;
