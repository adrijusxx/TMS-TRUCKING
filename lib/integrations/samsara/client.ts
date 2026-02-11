/**
 * Samsara API Client
 * 
 * Core request logic and configuration for Samsara integration.
 */

import { SamsaraConfig } from './types';

// Cache for unavailable endpoints to reduce log noise
export const unavailableEndpoints = new Set<string>();

/**
 * Get Samsara configuration from database (hierarchical) or environment variables
 */
export async function getSamsaraConfig(
    companyId?: string,
    mcNumberId?: string
): Promise<SamsaraConfig | null> {
    const { ApiKeyService } = await import('@/lib/services/ApiKeyService');

    // 1. Try Hierarchical Lookup (MC -> Company -> Global)
    try {
        const hierarchicalToken = await ApiKeyService.getCredential('SAMSARA', 'API_TOKEN', {
            companyId,
            mcNumberId
        });

        if (hierarchicalToken) {
            return {
                apiKey: hierarchicalToken,
                baseUrl: 'https://api.samsara.com',
                webhookSecret: process.env.SAMSARA_WEBHOOK_SECRET,
            };
        }
    } catch (error) {
        console.debug('[Samsara] Hierarchical API key lookup failed:', error);
    }

    // 1.5. NEW: Check SamsaraSettings table
    if (companyId) {
        try {
            const { prisma } = await import('@/lib/prisma');
            const settings = await prisma.samsaraSettings.findUnique({
                where: { companyId }
            });

            if (settings?.apiToken) {
                return {
                    apiKey: settings.apiToken,
                    baseUrl: 'https://api.samsara.com',
                    webhookSecret: process.env.SAMSARA_WEBHOOK_SECRET,
                };
            }
        } catch (error) {
            console.debug('[Samsara] Could not fetch settings from SamsaraSettings table:', error);
        }
    }

    // 2. Legacy: Check old Integration table
    if (companyId) {
        try {
            const { prisma } = await import('@/lib/prisma');
            const integration = await prisma.integration.findUnique({
                where: {
                    companyId_provider: {
                        companyId,
                        provider: 'SAMSARA',
                    },
                },
            });

            if (integration?.apiKey && integration.isActive) {
                return {
                    apiKey: integration.apiKey,
                    baseUrl: 'https://api.samsara.com',
                    webhookSecret: integration.apiSecret || process.env.SAMSARA_WEBHOOK_SECRET,
                };
            }
        } catch (error) {
            console.debug('[Samsara] Could not fetch legacy API key from database:', error);
        }
    }

    console.warn('Samsara API key not configured for company', companyId);
    return null;
}

/**
 * Make authenticated request to Samsara API
 */
export async function samsaraRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    companyId?: string
): Promise<T | null> {
    const config = await getSamsaraConfig(companyId);
    if (!config) {
        console.warn('[Samsara] API key not configured');
        return null;
    }

    try {
        const response = await fetch(`${config.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error(`[Samsara] Authentication failed for: ${endpoint}`);
                return null;
            }

            if (response.status === 403) {
                console.error(`[Samsara] Access forbidden for: ${endpoint}`);
                return null;
            }

            if (response.status === 404) {
                if (!unavailableEndpoints.has(endpoint)) {
                    unavailableEndpoints.add(endpoint);
                    console.debug(`[Samsara] Endpoint not found: ${endpoint}`);
                }
                return null;
            }

            const error = await response.json().catch(() => ({ message: response.statusText }));
            const errorMessage = error.message || response.statusText;

            if (errorMessage.includes('invalid id') || errorMessage.includes('invalid')) {
                const errorKey = `${endpoint}:invalid_id`;
                if (!unavailableEndpoints.has(errorKey)) {
                    unavailableEndpoints.add(errorKey);
                    console.debug(`[Samsara] Invalid ID error for: ${endpoint}`);
                }
                return null;
            }

            throw new Error(`Samsara API error: ${JSON.stringify(error)}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            const isHandledError =
                error.message.includes('404') ||
                error.message.includes('invalid id') ||
                error.message.includes('Invalid stat type') ||
                error.message.includes('Not Found');

            if (!isHandledError) {
                console.error('Samsara API request error:', error);
            } else {
                console.debug(`[Samsara] Handled error: ${error.message}`);
            }
        } else {
            console.error('Samsara API request error:', error);
        }
        return null;
    }
}
