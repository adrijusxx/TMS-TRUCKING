import { prisma } from '@/lib/prisma';
import { ApiKeyScope } from '@prisma/client';
// In a real scenario, we would use a proper encryption utility
// For this implementation, we'll use a placeholder or Assume the value is already encrypted/decrypted 
// by the caller or a specialist utility.

export class ApiKeyService {
    /**
     * Retrieves a configuration value using hierarchical lookup:
     * 1. MC specific scope
     * 2. Company specific scope
     * 3. Global scope
     */
    static async getCredential(
        provider: string,
        configKey: string,
        context: { companyId?: string; mcNumberId?: string } = {}
    ): Promise<string | null> {
        try {
            // 1. Check MC Level
            if (context.mcNumberId) {
                const mcKey = await prisma.apiKeyConfig.findFirst({
                    where: {
                        provider,
                        configKey,
                        scope: ApiKeyScope.MC,
                        mcNumberId: context.mcNumberId,
                        isActive: true,
                    },
                });
                if (mcKey) return mcKey.configValue;
            }

            // 2. Check Company Level
            if (context.companyId) {
                const companyKey = await prisma.apiKeyConfig.findFirst({
                    where: {
                        provider,
                        configKey,
                        scope: ApiKeyScope.COMPANY,
                        companyId: context.companyId,
                        isActive: true,
                    },
                });
                if (companyKey) return companyKey.configValue;
            }

            // 3. Check Global Level
            const globalKey = await prisma.apiKeyConfig.findFirst({
                where: {
                    provider,
                    configKey,
                    scope: ApiKeyScope.GLOBAL,
                    isActive: true,
                },
            });

            return globalKey?.configValue || null;
        } catch (error) {
            console.error(`Error fetching API key for ${provider}:${configKey}`, error);
            return null;
        }
    }

    /**
     * Set or update a credential
     */
    static async setCredential(params: {
        provider: string;
        configKey: string;
        configValue: string;
        scope: ApiKeyScope;
        companyId?: string;
        mcNumberId?: string;
        description?: string;
    }) {
        const { provider, configKey, configValue, scope, companyId, mcNumberId, description } = params;

        // Use findFirst + update/create instead of upsert because
        // Prisma rejects null in compound unique where clauses
        const existing = await prisma.apiKeyConfig.findFirst({
            where: {
                provider,
                scope,
                configKey,
                companyId: companyId ?? null,
                mcNumberId: mcNumberId ?? null,
            },
        });

        if (existing) {
            return await prisma.apiKeyConfig.update({
                where: { id: existing.id },
                data: { configValue, description, updatedAt: new Date() },
            });
        }

        return await prisma.apiKeyConfig.create({
            data: {
                provider,
                scope,
                companyId,
                mcNumberId,
                configKey,
                configValue,
                description,
            },
        });
    }

    /**
     * List all credentials for Super Admin view
     */
    static async listAll() {
        return await prisma.apiKeyConfig.findMany({
            include: {
                company: { select: { name: true } },
                mcNumber: { select: { number: true } },
            },
            orderBy: [
                { provider: 'asc' },
                { scope: 'asc' },
            ],
        });
    }
}
