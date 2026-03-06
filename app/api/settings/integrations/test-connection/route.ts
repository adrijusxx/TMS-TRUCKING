import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { testConnectionSchema } from '@/lib/validations/integrations';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/ApiKeyService';

/**
 * Test Connection API
 * POST /api/settings/integrations/test-connection
 * 
 * Tests the connection for a specific integration provider.
 * Supports MC-level credentials via mcNumberId parameter.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (!hasPermission(session.user.role as any, 'settings.view')) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { provider, mcNumberId, apiToken } = testConnectionSchema.parse(body);
        const companyId = session.user.companyId;

        // Test connection based on provider
        switch (provider) {
            case 'SAMSARA':
                return await testSamsaraConnection(companyId, mcNumberId, apiToken);
            case 'TELEGRAM':
                return await testTelegramConnection(companyId);
            case 'MATTERMOST':
                return await testMattermostConnection(companyId);
            case 'QUICKBOOKS':
                return await testQuickBooksConnection(companyId);
            case 'NETSAPIENS':
                return await testNetSapiensConnection(companyId);
            default:
                return NextResponse.json(
                    { success: false, error: { code: 'INVALID_PROVIDER', message: 'Unknown provider' } },
                    { status: 400 }
                );
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
                { status: 400 }
            );
        }
        const { logger } = await import('@/lib/utils/logger');
        logger.error('Error testing connection', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to test connection' } },
            { status: 500 }
        );
    }
}

async function testSamsaraConnection(companyId: string, mcNumberId?: string, tokenOverride?: string) {
    try {
        // Get API token using hierarchical lookup
        const apiToken = await ApiKeyService.getCredential('SAMSARA', 'API_TOKEN', { companyId, mcNumberId });

        // Fallback to legacy SamsaraSettings
        let token: string | null = tokenOverride || apiToken; // Use override if provided
        if (!token) {
            const settings = await prisma.samsaraSettings.findUnique({
                where: { companyId },
            });
            token = settings?.apiToken ?? null;
        }

        if (!token) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'No API token configured',
                details: { scope: mcNumberId ? 'MC' : 'Company' }
            });
        }

        // Test the connection by calling Samsara API
        const response = await fetch('https://api.samsara.com/fleet/vehicles?limit=512', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            const vehicleCount = data.data?.length ?? 0;
            return NextResponse.json({
                success: true,
                connected: true,
                message: 'Connection successful',
                details: {
                    scope: mcNumberId ? 'MC' : 'Company',
                    vehiclesFound: vehicleCount,
                    testedAt: new Date().toISOString(),
                }
            });
        } else if (response.status === 401) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'Invalid API token - authentication failed',
                details: { status: 401 }
            });
        } else if (response.status === 403) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'API token lacks required permissions (check scopes)',
                details: { status: 403 }
            });
        } else {
            const error = await response.text();
            return NextResponse.json({
                success: false,
                connected: false,
                message: `API request failed: ${response.statusText}`,
                details: { status: response.status, error }
            });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            connected: false,
            message: `Connection error: ${error.message}`,
            details: { error: error.message }
        });
    }
}

async function testTelegramConnection(companyId: string) {
    try {
        // Get credentials using hierarchical lookup (Company level for Telegram)
        const apiId = await ApiKeyService.getCredential('TELEGRAM', 'API_ID', { companyId });
        const apiHash = await ApiKeyService.getCredential('TELEGRAM', 'API_HASH', { companyId });

        if (!apiId || !apiHash) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'Telegram API credentials not configured',
                details: { hasApiId: !!apiId, hasApiHash: !!apiHash }
            });
        }

        // Check for existing session
        const session = await prisma.telegramSession.findFirst({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
        });

        if (session && !session.connectionError) {
            return NextResponse.json({
                success: true,
                connected: true,
                message: 'Telegram session is active',
                details: {
                    lastConnected: session.lastConnected,
                    hasSession: true,
                }
            });
        } else if (session?.connectionError) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'Telegram session has errors',
                details: { error: session.connectionError }
            });
        } else {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'No active Telegram session - credentials configured but session not initialized',
                details: { credentialsConfigured: true, sessionInitialized: false }
            });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            connected: false,
            message: `Telegram check error: ${error.message}`,
            details: { error: error.message }
        });
    }
}

async function testMattermostConnection(companyId: string) {
    try {
        const settings = await prisma.mattermostSettings.findUnique({
            where: { companyId },
        });

        if (!settings?.serverUrl || !settings?.botToken) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'Mattermost not configured — server URL or bot token missing',
                details: { hasServerUrl: !!settings?.serverUrl, hasBotToken: !!settings?.botToken }
            });
        }

        const { getMattermostService } = await import('@/lib/services/MattermostService');
        const service = getMattermostService();
        const result = await service.testConnection(settings.serverUrl, settings.botToken);

        if (result.success) {
            return NextResponse.json({
                success: true,
                connected: true,
                message: 'Mattermost connection verified',
                details: {
                    botUsername: result.botUsername,
                    serverUrl: settings.serverUrl,
                    testedAt: new Date().toISOString(),
                }
            });
        }

        return NextResponse.json({
            success: false,
            connected: false,
            message: `Mattermost connection failed: ${result.error}`,
            details: { serverUrl: settings.serverUrl, error: result.error }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            connected: false,
            message: `Mattermost check error: ${error.message}`,
            details: { error: error.message }
        });
    }
}

async function testQuickBooksConnection(companyId: string) {
    try {
        const settings = await prisma.quickBooksSettings.findUnique({
            where: { companyId },
        });

        if (!settings) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'QuickBooks not configured',
                details: {}
            });
        }

        if (!settings.accessToken || !settings.refreshToken) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'QuickBooks OAuth tokens not found - please re-authorize',
                details: { hasRealmId: !!settings.realmId }
            });
        }

        // Check token expiry
        if (settings.tokenExpiry && new Date(settings.tokenExpiry) < new Date()) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'QuickBooks tokens expired - please re-authorize',
                details: { expiredAt: settings.tokenExpiry }
            });
        }

        // Verify tokens by calling QuickBooks CompanyInfo endpoint
        try {
            const baseUrl = settings.qboEnvironment === 'SANDBOX'
                ? 'https://sandbox-quickbooks.api.intuit.com'
                : 'https://quickbooks.api.intuit.com';
            const qbRes = await fetch(
                `${baseUrl}/v3/company/${settings.realmId}/companyinfo/${settings.realmId}`,
                { headers: { 'Authorization': `Bearer ${settings.accessToken}`, 'Accept': 'application/json' } }
            );
            if (qbRes.ok) {
                const qbData = await qbRes.json();
                return NextResponse.json({
                    success: true,
                    connected: true,
                    message: 'QuickBooks connection verified',
                    details: {
                        environment: settings.qboEnvironment,
                        realmId: settings.realmId,
                        companyName: qbData?.CompanyInfo?.CompanyName,
                        tokenExpiry: settings.tokenExpiry,
                        testedAt: new Date().toISOString(),
                    }
                });
            }
            return NextResponse.json({
                success: false,
                connected: false,
                message: `QuickBooks API returned ${qbRes.status} — tokens may need re-authorization`,
                details: { status: qbRes.status, environment: settings.qboEnvironment }
            });
        } catch (qbErr: any) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: `QuickBooks API unreachable: ${qbErr.message}`,
                details: { environment: settings.qboEnvironment }
            });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            connected: false,
            message: `QuickBooks check error: ${error.message}`,
            details: { error: error.message }
        });
    }
}

async function testNetSapiensConnection(companyId: string) {
    try {
        const apiKey = await ApiKeyService.getCredential('NETSAPIENS', 'API_KEY', { companyId });
        const server = await ApiKeyService.getCredential('NETSAPIENS', 'SERVER', { companyId });

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'NetSapiens API key not configured',
                details: { hasApiKey: false }
            });
        }

        if (!server) {
            return NextResponse.json({
                success: false,
                connected: false,
                message: 'NetSapiens server hostname not configured',
                details: { hasServer: false }
            });
        }

        // Test by discovering the domain
        const { discoverDomain } = await import('@/lib/integrations/netsapiens');
        const domain = await discoverDomain(apiKey, server);

        if (domain) {
            return NextResponse.json({
                success: true,
                connected: true,
                message: 'Connection successful',
                details: {
                    domain,
                    server,
                    testedAt: new Date().toISOString(),
                }
            });
        }

        return NextResponse.json({
            success: false,
            connected: false,
            message: 'API key or server is invalid - could not discover PBX domain',
            details: { server }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            connected: false,
            message: `NetSapiens check error: ${error.message}`,
            details: { error: error.message }
        });
    }
}
