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

        return await prisma.apiKeyConfig.upsert({
            where: {
                provider_scope_companyId_mcNumberId_configKey: {
                    provider,
                    scope,
                    companyId: (companyId || null) as any,
                    mcNumberId: (mcNumberId || null) as any,
                    configKey,
                }
            },
            update: {
                configValue,
                description,
                updatedAt: new Date(),
            },
            create: {
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
