import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiKeyService } from '@/lib/services/ApiKeyService';

/**
 * GET /api/integrations/netsapiens/webrtc-config
 * Returns SIP configuration needed for the browser softphone to connect.
 * Only returns data if the user has softphone enabled and SIP credentials configured.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { voipConfig: true, companyId: true, firstName: true, lastName: true },
  });

  const config = user?.voipConfig as Record<string, any> | null;

  if (!config?.softphoneEnabled || !config?.pbxExtension || !config?.sipPassword) {
    return NextResponse.json({
      enabled: false,
      reason: !config?.softphoneEnabled
        ? 'Softphone not enabled in VoIP settings'
        : !config?.sipPassword
        ? 'SIP password not configured'
        : 'PBX extension not configured',
    });
  }

  // Get server and domain from company config
  const companyId = user?.companyId || undefined;
  let server: string | null = null;
  let domain: string | null = null;
  let wssUrl: string | null = null;

  try {
    server = await ApiKeyService.getCredential('NETSAPIENS', 'SERVER', { companyId });
    domain = await ApiKeyService.getCredential('NETSAPIENS', 'DOMAIN', { companyId });
    wssUrl = await ApiKeyService.getCredential('NETSAPIENS', 'WSS_URL', { companyId });
  } catch { /* ignore */ }

  server = server || process.env.NS_API_SERVER || null;
  if (!server) {
    return NextResponse.json({ enabled: false, reason: 'PBX server not configured' });
  }

  // Default WSS URL if not explicitly configured
  if (!wssUrl) {
    wssUrl = `wss://${server}:8089/ws`;
  }

  // Use discovered domain or fall back to server hostname
  const sipDomain = domain || server;

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || config.pbxExtension;

  return NextResponse.json({
    enabled: true,
    wssUrl,
    sipDomain,
    sipUser: config.pbxExtension,
    sipPassword: config.sipPassword,
    displayName,
  });
}
