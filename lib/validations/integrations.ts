import { z } from 'zod';

// ============================================
// SAMSARA INTEGRATION
// ============================================

export const samsaraSettingsSchema = z.object({
    apiToken: z.string().min(1, 'API Token is required'),
    webhookSecret: z.string().optional(),
    webhookUrl: z.string().url().optional().or(z.literal('')),

    // Sync settings
    autoSyncDrivers: z.boolean().default(false),
    autoSyncVehicles: z.boolean().default(false),
    syncIntervalMinutes: z.coerce
        .number()
        .min(15, 'Sync interval must be at least 15 minutes')
        .max(1440, 'Sync interval cannot exceed 24 hours')
        .default(60),

    // Feature toggles
    statsEnabled: z.boolean().default(true),         // Vehicle stats (speed, fuel, odometer)
    cameraEnabled: z.boolean().default(false),       // Camera media access
    cameraTypes: z.string().default('forwardFacing,driverFacing'), // Comma-separated
    tripsEnabled: z.boolean().default(true),         // Trips data
    tripsLimit: z.coerce.number().min(1).max(100).default(3),
});

export type SamsaraSettingsInput = z.infer<typeof samsaraSettingsSchema>;

// Extended schema with MC context for per-MC credential management
export const samsaraCredentialsSchema = z.object({
    mcNumberId: z.string().optional(), // If not provided, applies to company level
    apiToken: z.string().min(1, 'API Token is required'),
    webhookSecret: z.string().optional(),
    webhookUrl: z.string().optional(),

    // Feature toggles (stored as separate config keys)
    statsEnabled: z.boolean().optional(),
    cameraEnabled: z.boolean().optional(),
    cameraTypes: z.string().optional(),
    tripsEnabled: z.boolean().optional(),
    tripsLimit: z.number().optional(),
});

export type SamsaraCredentialsInput = z.infer<typeof samsaraCredentialsSchema>;

// ============================================
// TELEGRAM INTEGRATION
// ============================================

export const telegramCredentialsSchema = z.object({
    apiId: z.string().min(1, 'API ID is required'),
    apiHash: z.string().min(1, 'API Hash is required'),
    encryptionKey: z.string().optional(), // Auto-generated if not provided
});

export type TelegramCredentialsInput = z.infer<typeof telegramCredentialsSchema>;

// ============================================
// QUICKBOOKS INTEGRATION
// ============================================

export const quickBooksSettingsSchema = z.object({
    realmId: z.string().min(1, 'Company ID (Realm ID) is required'),
    qboEnvironment: z.enum(['SANDBOX', 'PRODUCTION']),
    autoSyncInvoices: z.boolean().default(false),
    autoSyncCustomers: z.boolean().default(false),
});

export type QuickBooksSettingsInput = z.infer<typeof quickBooksSettingsSchema>;

// ============================================
// TEST CONNECTION
// ============================================

export const testConnectionSchema = z.object({
    provider: z.enum(['SAMSARA', 'TELEGRAM', 'QUICKBOOKS']),
    mcNumberId: z.string().optional(),
});

export type TestConnectionInput = z.infer<typeof testConnectionSchema>;

// ============================================
// GENERIC API CREDENTIAL
// ============================================

export const apiCredentialSchema = z.object({
    provider: z.string().min(1, 'Provider is required'),
    configKey: z.string().min(1, 'Config key is required'),
    configValue: z.string().min(1, 'Value is required'),
    scope: z.enum(['GLOBAL', 'COMPANY', 'MC']),
    mcNumberId: z.string().optional(),
    description: z.string().optional(),
});

export type ApiCredentialInput = z.infer<typeof apiCredentialSchema>;
