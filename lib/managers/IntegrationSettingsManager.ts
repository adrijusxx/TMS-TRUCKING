import { prisma } from '@/lib/prisma';
import { IntegrationSettings, Prisma } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface GoogleCredentials {
    email: string;
    privateKey: string;
}

export interface UpdateGoogleSheetsInput {
    googleServiceAccountEmail?: string | null;
    googleServiceAccountPrivateKey?: string | null;
    googleSheetsEnabled?: boolean;
}

// ============================================
// IntegrationSettingsManager
// ============================================

/**
 * Manager for company integration settings (Google Sheets, etc.)
 * Handles CRUD operations and credential retrieval.
 */
export class IntegrationSettingsManager {
    /**
     * Get integration settings for a company
     */
    static async getByCompanyId(companyId: string): Promise<IntegrationSettings | null> {
        return prisma.integrationSettings.findUnique({
            where: { companyId },
        });
    }

    /**
     * Create or update integration settings for a company
     */
    static async upsert(
        companyId: string,
        data: UpdateGoogleSheetsInput
    ): Promise<IntegrationSettings> {
        const updateData: Prisma.IntegrationSettingsUpdateInput = {};
        const createData: Prisma.IntegrationSettingsCreateInput = {
            company: { connect: { id: companyId } },
        };

        // Only include fields that are explicitly provided
        if (data.googleServiceAccountEmail !== undefined) {
            updateData.googleServiceAccountEmail = data.googleServiceAccountEmail;
            createData.googleServiceAccountEmail = data.googleServiceAccountEmail;
        }

        if (data.googleServiceAccountPrivateKey !== undefined) {
            updateData.googleServiceAccountPrivateKey = data.googleServiceAccountPrivateKey;
            createData.googleServiceAccountPrivateKey = data.googleServiceAccountPrivateKey;
        }

        if (data.googleSheetsEnabled !== undefined) {
            updateData.googleSheetsEnabled = data.googleSheetsEnabled;
            createData.googleSheetsEnabled = data.googleSheetsEnabled;
        }

        return prisma.integrationSettings.upsert({
            where: { companyId },
            update: updateData,
            create: createData,
        });
    }

    /**
     * Get Google Sheets credentials for a company
     * Returns null if credentials are not configured or integration is disabled
     */
    static async getGoogleCredentials(companyId: string): Promise<GoogleCredentials | null> {
        const settings = await prisma.integrationSettings.findUnique({
            where: { companyId },
            select: {
                googleServiceAccountEmail: true,
                googleServiceAccountPrivateKey: true,
                googleSheetsEnabled: true,
            },
        });

        if (!settings) {
            return null;
        }

        if (!settings.googleSheetsEnabled) {
            return null;
        }

        if (!settings.googleServiceAccountEmail || !settings.googleServiceAccountPrivateKey) {
            return null;
        }

        return {
            email: settings.googleServiceAccountEmail,
            privateKey: settings.googleServiceAccountPrivateKey,
        };
    }

    /**
     * Check if Google Sheets is configured for a company
     */
    static async isGoogleSheetsConfigured(companyId: string): Promise<boolean> {
        const credentials = await this.getGoogleCredentials(companyId);
        return credentials !== null;
    }

    /**
     * Enable or disable Google Sheets integration
     */
    static async setGoogleSheetsEnabled(companyId: string, enabled: boolean): Promise<void> {
        await prisma.integrationSettings.upsert({
            where: { companyId },
            update: { googleSheetsEnabled: enabled },
            create: {
                company: { connect: { id: companyId } },
                googleSheetsEnabled: enabled,
            },
        });
    }

    /**
     * Clear Google Sheets credentials for a company
     */
    static async clearGoogleCredentials(companyId: string): Promise<void> {
        const settings = await this.getByCompanyId(companyId);
        if (settings) {
            await prisma.integrationSettings.update({
                where: { companyId },
                data: {
                    googleServiceAccountEmail: null,
                    googleServiceAccountPrivateKey: null,
                    googleSheetsEnabled: false,
                },
            });
        }
    }
}
