import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/integrations/netsapiens';

/**
 * NetSapiens SMS API
 * POST /api/integrations/netsapiens/sms
 *
 * Body: { to, message }
 * Uses the caller's PBX extension as the "from" number.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Recipient and message are required' } },
        { status: 400 }
      );
    }

    // Get user's VoIP config for the "from" number
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });

    const config = (user?.voipConfig as any) || {};
    const from = config.pbxExtension || config.username;

    if (!from) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'PBX extension not configured. Set up your phone in Profile Settings.' } },
        { status: 400 }
      );
    }

    const result = await sendSMS(from, to, message, user?.companyId || undefined);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'SMS_FAILED', message: result.error || 'Failed to send SMS' } },
        { status: 500 }
      );
    }

    // Log as Communication record
    try {
      await prisma.communication.create({
        data: {
          companyId: user?.companyId || '',
          channel: 'SIP',
          type: 'SMS',
          direction: 'OUTBOUND',
          fromNumber: from,
          toNumber: to.replace(/[^0-9+]/g, ''),
          content: message,
          status: 'SENT',
          createdById: session.user.id,
        },
      });
    } catch (logErr) {
      console.warn('[NetSapiens SMS] Failed to log communication:', logErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[NetSapiens SMS] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
