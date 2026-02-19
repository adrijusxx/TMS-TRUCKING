import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * NetSapiens Webhook Handler
 * POST /api/webhooks/netsapiens
 *
 * Receives real-time events from the PBX:
 * - call.started / call.answered / call.ended
 * - sms.received
 * - voicemail.new
 *
 * Logs events as Communication records for the communications hub.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event || body.type;
    const data = body.data || body;

    console.log(`[NetSapiens Webhook] Event: ${event}`, JSON.stringify(data).slice(0, 200));

    // Determine company from the domain in the webhook payload
    // For now we try to match by domain or just log the event
    const domain = data.domain || data.orig_domain;

    switch (event) {
      case 'call.ended':
      case 'call.completed': {
        await handleCallEnded(data, domain);
        break;
      }
      case 'sms.received':
      case 'message.received': {
        await handleSmsReceived(data, domain);
        break;
      }
      case 'voicemail.new': {
        // Just log — voicemails are fetched on-demand via the voicemail API
        console.log(`[NetSapiens Webhook] New voicemail for ${data.user || 'unknown'}`);
        break;
      }
      default:
        console.log(`[NetSapiens Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[NetSapiens Webhook] Error:', error);
    // Always return 200 to prevent NS from retrying
    return NextResponse.json({ received: true, error: error.message });
  }
}

async function handleCallEnded(data: any, domain?: string) {
  try {
    // Find the company by domain if possible
    const companyId = await resolveCompanyId(domain);
    if (!companyId) return;

    const direction = data.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND';

    await prisma.communication.create({
      data: {
        companyId,
        channel: 'SIP',
        type: 'CALL',
        direction,
        fromNumber: data.orig_from_user || data.from,
        toNumber: data.orig_to_user || data.to,
        duration: data.duration ? parseInt(String(data.duration), 10) : undefined,
        recordingUrl: data.recording_url || undefined,
        content: data.release_text || undefined,
        status: 'DELIVERED',
      },
    });

    console.log('[NetSapiens Webhook] Call logged as Communication');
  } catch (error) {
    console.error('[NetSapiens Webhook] Failed to log call:', error);
  }
}

async function handleSmsReceived(data: any, domain?: string) {
  try {
    const companyId = await resolveCompanyId(domain);
    if (!companyId) return;

    await prisma.communication.create({
      data: {
        companyId,
        channel: 'SIP',
        type: 'SMS',
        direction: 'INBOUND',
        fromNumber: data.from,
        toNumber: data.to,
        content: data.message || data.body,
        status: 'DELIVERED',
      },
    });

    console.log('[NetSapiens Webhook] Inbound SMS logged');
  } catch (error) {
    console.error('[NetSapiens Webhook] Failed to log SMS:', error);
  }
}

/**
 * Resolve companyId from a PBX domain.
 * Looks up the NETSAPIENS DOMAIN in ApiKeyConfig to find the matching company.
 */
async function resolveCompanyId(domain?: string): Promise<string | null> {
  if (!domain) return null;

  try {
    const config = await prisma.apiKeyConfig.findFirst({
      where: {
        provider: 'NETSAPIENS',
        configKey: 'DOMAIN',
        configValue: domain,
        isActive: true,
      },
      select: { companyId: true },
    });

    return config?.companyId || null;
  } catch {
    return null;
  }
}
