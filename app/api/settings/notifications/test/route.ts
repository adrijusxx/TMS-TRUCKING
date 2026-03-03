import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { EmailService } from '@/lib/services/EmailService';
import { logger } from '@/lib/utils/logger';

const testNotificationSchema = z.object({
  type: z.enum(['email', 'sms', 'push', 'webhook']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = testNotificationSchema.parse(body);

    if (type === 'email') {
      const email = session.user.email;
      if (!email) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'No email address on your account' } },
          { status: 400 }
        );
      }

      const sent = await EmailService.sendEmail({
        to: email,
        subject: 'TMS Test Notification',
        html: `<h2>Test Notification</h2><p>This is a test notification from your TMS system.</p><p>If you received this, email notifications are working correctly.</p><p><small>Sent at ${new Date().toLocaleString()}</small></p>`,
      });

      if (!sent) {
        return NextResponse.json(
          { success: false, error: { code: 'SEND_FAILED', message: 'Failed to send test email. Check email service configuration.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: `Test email sent to ${email}` });
    }

    // SMS, push, webhook — not yet wired
    return NextResponse.json(
      { success: false, error: { code: 'NOT_IMPLEMENTED', message: `${type} notifications are not yet configured` } },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.issues } },
        { status: 400 }
      );
    }

    logger.error('Test notification error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
