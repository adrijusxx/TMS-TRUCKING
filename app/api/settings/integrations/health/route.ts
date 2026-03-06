import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { ApiKeyService } from '@/lib/services/ApiKeyService';
import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

interface IntegrationHealth {
  provider: string;
  label: string;
  status: 'connected' | 'degraded' | 'disconnected' | 'unconfigured';
  lastSyncAt?: string | null;
  errorCount?: number;
  details?: Record<string, unknown>;
}

// ============================================
// GET /api/settings/integrations/health
// ============================================

export async function GET(request: NextRequest) {
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

    const companyId = session.user.companyId;

    const [samsara, quickbooks, telegram, mattermost, stripe, googleMaps] = await Promise.all([
      checkSamsaraHealth(companyId),
      checkQuickBooksHealth(companyId),
      checkTelegramHealth(companyId),
      checkMattermostHealth(companyId),
      checkStripeHealth(companyId),
      checkGoogleMapsHealth(),
    ]);

    const integrations: IntegrationHealth[] = [samsara, quickbooks, telegram, mattermost, stripe, googleMaps];

    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    logger.error('Error checking integration health', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check health' } },
      { status: 500 }
    );
  }
}

// ============================================
// Per-Integration Health Checks
// ============================================

async function checkSamsaraHealth(companyId: string): Promise<IntegrationHealth> {
  try {
    const apiToken = await ApiKeyService.getCredential('SAMSARA', 'API_TOKEN', { companyId });
    const legacySettings = await prisma.samsaraSettings.findUnique({
      where: { companyId },
      select: { apiToken: true, lastSyncAt: true, updatedAt: true },
    });

    const hasToken = !!apiToken || !!legacySettings?.apiToken;
    if (!hasToken) {
      return { provider: 'SAMSARA', label: 'Samsara', status: 'unconfigured' };
    }

    // Count recent errors from activity logs
    const recentErrors = await prisma.activityLog.count({
      where: {
        companyId,
        entityType: 'SAMSARA_SYNC',
        action: 'ERROR',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const status = recentErrors > 5 ? 'degraded' : 'connected';

    return {
      provider: 'SAMSARA',
      label: 'Samsara',
      status,
      lastSyncAt: legacySettings?.lastSyncAt?.toISOString() ?? null,
      errorCount: recentErrors,
      details: { source: apiToken ? 'credentials-store' : 'legacy-settings' },
    };
  } catch {
    return { provider: 'SAMSARA', label: 'Samsara', status: 'disconnected', errorCount: 1 };
  }
}

async function checkQuickBooksHealth(companyId: string): Promise<IntegrationHealth> {
  try {
    const settings = await prisma.quickBooksSettings.findUnique({
      where: { companyId },
      select: {
        accessToken: true,
        refreshToken: true,
        tokenExpiry: true,
        realmId: true,
        qboEnvironment: true,
        updatedAt: true,
      },
    });

    if (!settings || !settings.realmId) {
      return { provider: 'QUICKBOOKS', label: 'QuickBooks', status: 'unconfigured' };
    }

    if (!settings.accessToken || !settings.refreshToken) {
      return {
        provider: 'QUICKBOOKS',
        label: 'QuickBooks',
        status: 'disconnected',
        details: { reason: 'Missing OAuth tokens — needs re-authorization' },
      };
    }

    const isExpired = settings.tokenExpiry && new Date(settings.tokenExpiry) < new Date();
    if (isExpired) {
      return {
        provider: 'QUICKBOOKS',
        label: 'QuickBooks',
        status: 'degraded',
        lastSyncAt: settings.updatedAt?.toISOString() ?? null,
        details: {
          reason: 'Token expired',
          expiredAt: settings.tokenExpiry?.toISOString(),
          environment: settings.qboEnvironment,
        },
      };
    }

    return {
      provider: 'QUICKBOOKS',
      label: 'QuickBooks',
      status: 'connected',
      lastSyncAt: settings.updatedAt?.toISOString() ?? null,
      details: { environment: settings.qboEnvironment, realmId: settings.realmId },
    };
  } catch {
    return { provider: 'QUICKBOOKS', label: 'QuickBooks', status: 'disconnected', errorCount: 1 };
  }
}

async function checkTelegramHealth(companyId: string): Promise<IntegrationHealth> {
  try {
    const apiId = await ApiKeyService.getCredential('TELEGRAM', 'API_ID', { companyId });
    const apiHash = await ApiKeyService.getCredential('TELEGRAM', 'API_HASH', { companyId });

    if (!apiId || !apiHash) {
      return { provider: 'TELEGRAM', label: 'Telegram', status: 'unconfigured' };
    }

    const session = await prisma.telegramSession.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { lastConnected: true, connectionError: true },
    });

    if (!session) {
      return {
        provider: 'TELEGRAM',
        label: 'Telegram',
        status: 'disconnected',
        details: { reason: 'No active session' },
      };
    }

    if (session.connectionError) {
      return {
        provider: 'TELEGRAM',
        label: 'Telegram',
        status: 'degraded',
        details: { error: session.connectionError },
      };
    }

    return {
      provider: 'TELEGRAM',
      label: 'Telegram',
      status: 'connected',
      lastSyncAt: session.lastConnected?.toISOString() ?? null,
    };
  } catch {
    return { provider: 'TELEGRAM', label: 'Telegram', status: 'disconnected', errorCount: 1 };
  }
}

async function checkMattermostHealth(companyId: string): Promise<IntegrationHealth> {
  try {
    const settings = await prisma.mattermostSettings.findUnique({
      where: { companyId },
      select: { serverUrl: true, botToken: true, botUsername: true, connectionError: true, updatedAt: true },
    });

    if (!settings?.serverUrl || !settings?.botToken) {
      return { provider: 'MATTERMOST', label: 'Mattermost', status: 'unconfigured' };
    }

    if (settings.connectionError) {
      return {
        provider: 'MATTERMOST',
        label: 'Mattermost',
        status: 'degraded',
        details: { error: settings.connectionError, serverUrl: settings.serverUrl },
      };
    }

    return {
      provider: 'MATTERMOST',
      label: 'Mattermost',
      status: 'connected',
      lastSyncAt: settings.updatedAt?.toISOString() ?? null,
      details: { botUsername: settings.botUsername, serverUrl: settings.serverUrl },
    };
  } catch {
    return { provider: 'MATTERMOST', label: 'Mattermost', status: 'disconnected', errorCount: 1 };
  }
}

async function checkStripeHealth(companyId: string): Promise<IntegrationHealth> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { companyId, status: { in: ['ACTIVE', 'TRIALING'] } },
      select: { status: true, currentPeriodEnd: true, planId: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        provider: 'STRIPE',
        label: 'Stripe',
        status: 'unconfigured',
        details: { reason: 'No active subscription' },
      };
    }

    return {
      provider: 'STRIPE',
      label: 'Stripe',
      status: 'connected',
      details: {
        subscriptionStatus: subscription.status,
        periodEnd: subscription.currentPeriodEnd?.toISOString(),
      },
    };
  } catch {
    return { provider: 'STRIPE', label: 'Stripe', status: 'disconnected', errorCount: 1 };
  }
}

async function checkGoogleMapsHealth(): Promise<IntegrationHealth> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return { provider: 'GOOGLE_MAPS', label: 'Google Maps', status: 'unconfigured' };
  }

  return {
    provider: 'GOOGLE_MAPS',
    label: 'Google Maps',
    status: 'connected',
    details: { keyConfigured: true, keyPrefix: apiKey.substring(0, 6) + '...' },
  };
}
