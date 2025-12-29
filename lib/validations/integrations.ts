import { z } from 'zod';

export const samsaraSettingsSchema = z.object({
    apiToken: z.string().min(1, 'API Token is required'),
    autoSyncDrivers: z.boolean().default(false),
    autoSyncVehicles: z.boolean().default(false),
    syncIntervalMinutes: z.coerce
        .number()
        .min(15, 'Sync interval must be at least 15 minutes')
        .max(1440, 'Sync interval cannot exceed 24 hours')
        .default(60),
});

export type SamsaraSettingsInput = z.infer<typeof samsaraSettingsSchema>;

export const quickBooksSettingsSchema = z.object({
    realmId: z.string().min(1, 'Company ID (Realm ID) is required'),
    qboEnvironment: z.enum(['SANDBOX', 'PRODUCTION']),
    autoSyncInvoices: z.boolean().default(false),
    autoSyncCustomers: z.boolean().default(false),
    // Note: Tokens are handled via OAuth flow, not manual input usually, 
    // but for manual dev/debug we might allow it. For now, we validate the config.
});

export type QuickBooksSettingsInput = z.infer<typeof quickBooksSettingsSchema>;
