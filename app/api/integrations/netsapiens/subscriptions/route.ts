import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { listSubscriptions, createSubscription, deleteSubscription } from '@/lib/integrations/netsapiens';

/**
 * NetSapiens Event Subscriptions API
 * GET    — list active webhook subscriptions
 * POST   — create a new subscription
 * DELETE — remove a subscription
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'settings.view')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
    }

    const subs = await listSubscriptions(session.user.companyId);
    return NextResponse.json({ success: true, data: subs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'settings.edit')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
    }

    const body = await request.json();
    const { event, targetUrl } = body;

    if (!event || !targetUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Event and targetUrl required' } },
        { status: 400 }
      );
    }

    const sub = await createSubscription(event, targetUrl, session.user.companyId);
    return NextResponse.json({ success: true, data: sub });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Subscription ID required' } }, { status: 400 });
    }

    await deleteSubscription(id, session.user.companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
