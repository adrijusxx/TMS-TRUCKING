import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { ApiKeyService } from '@/lib/services/ApiKeyService';
import { ApiKeyScope } from '@prisma/client';
import { netsapiensSettingsSchema } from '@/lib/validations/integrations';
import { discoverDomain, clearNSCache } from '@/lib/integrations/netsapiens';
import { z } from 'zod';

/**
 * NetSapiens Admin Settings API
 * GET  — returns config status (configured, domain, server)
 * PUT  — saves API key + server, triggers domain auto-discovery
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    if (!hasPermission(session.user.role as any, 'settings.view')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    }

    const companyId = session.user.companyId;
    const apiKey = await ApiKeyService.getCredential('NETSAPIENS', 'API_KEY', { companyId });
    const server = await ApiKeyService.getCredential('NETSAPIENS', 'SERVER', { companyId });
    const domain = await ApiKeyService.getCredential('NETSAPIENS', 'DOMAIN', { companyId });
    const wssUrl = await ApiKeyService.getCredential('NETSAPIENS', 'WSS_URL', { companyId });

    return NextResponse.json({
      success: true,
      data: {
        configured: !!apiKey && !!server,
        hasApiKey: !!apiKey,
        server: server || process.env.NS_API_SERVER || null,
        domain: domain || null,
        wssUrl: wssUrl || null,
      },
    });
  } catch (error: any) {
    console.error('[NetSapiens] Settings GET error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    if (!hasPermission(session.user.role as any, 'settings.edit')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    }

    const body = await request.json();
    const { apiKey: inputApiKey, server } = netsapiensSettingsSchema.parse(body);
    const wssUrl = body.wssUrl as string | undefined;
    const companyId = session.user.companyId;

    // Determine actual API key: if "unchanged", use the stored one
    const isKeyUnchanged = inputApiKey === 'unchanged';
    let effectiveApiKey = inputApiKey;

    if (isKeyUnchanged) {
      const stored = await ApiKeyService.getCredential('NETSAPIENS', 'API_KEY', { companyId });
      if (!stored) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'No API key stored. Please enter your full API key.' } },
          { status: 400 }
        );
      }
      effectiveApiKey = stored;
    } else {
      // Save new API key
      await ApiKeyService.setCredential({
        provider: 'NETSAPIENS',
        configKey: 'API_KEY',
        configValue: inputApiKey,
        scope: ApiKeyScope.COMPANY,
        companyId,
        description: 'NetSapiens PBX API Key',
      });
    }

    // Save server
    await ApiKeyService.setCredential({
      provider: 'NETSAPIENS',
      configKey: 'SERVER',
      configValue: server,
      scope: ApiKeyScope.COMPANY,
      companyId,
      description: 'NetSapiens PBX Server hostname',
    });

    // Save WSS URL if provided
    if (wssUrl) {
      await ApiKeyService.setCredential({
        provider: 'NETSAPIENS',
        configKey: 'WSS_URL',
        configValue: wssUrl,
        scope: ApiKeyScope.COMPANY,
        companyId,
        description: 'WebSocket URL for browser softphone',
      });
    }

    // Clear cache and auto-discover domain
    clearNSCache();
    const domain = await discoverDomain(effectiveApiKey, server);

    if (domain) {
      await ApiKeyService.setCredential({
        provider: 'NETSAPIENS',
        configKey: 'DOMAIN',
        configValue: domain,
        scope: ApiKeyScope.COMPANY,
        companyId,
        description: 'Auto-discovered PBX domain',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        domain: domain || null,
        domainDiscovered: !!domain,
      },
      message: domain
        ? `Connected successfully! Domain: ${domain}`
        : 'API key saved but domain auto-discovery failed. Check the server hostname.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.issues } },
        { status: 400 }
      );
    }
    console.error('[NetSapiens] Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save settings' } },
      { status: 500 }
    );
  }
}
