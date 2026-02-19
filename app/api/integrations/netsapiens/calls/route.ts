import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import {
  getActiveCalls,
  makeNSCall,
  transferCall,
  holdCall,
  unholdCall,
  disconnectCall,
} from '@/lib/integrations/netsapiens';

/**
 * NetSapiens Active Calls API
 * GET    — list all active calls in the domain
 * POST   — initiate a new call
 * PATCH  — transfer or hold/unhold an active call
 * DELETE — disconnect an active call
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const calls = await getActiveCalls(session.user.companyId);
    return NextResponse.json({ success: true, data: calls, count: calls.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const body = await request.json();
    const { destination } = body;

    if (!destination) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Destination required' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });

    const config = (user?.voipConfig as any) || {};
    const extension = config.pbxExtension || config.username;
    const answerDevice = config.answerDevice;

    if (!extension || !answerDevice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'Phone integration not configured' } },
        { status: 400 }
      );
    }

    const result = await makeNSCall(extension, destination, answerDevice, user?.companyId || undefined);

    if (!result.success) {
      return NextResponse.json({ success: false, error: { code: 'CALL_FAILED', message: result.error } }, { status: 500 });
    }

    return NextResponse.json({ success: true, callId: result.callId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const body = await request.json();
    const { callId, action, target } = body;

    if (!callId || !action) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'callId and action required' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });
    const extension = (user?.voipConfig as any)?.pbxExtension;
    if (!extension) {
      return NextResponse.json({ success: false, error: { code: 'NOT_CONFIGURED' } }, { status: 400 });
    }

    const companyId = user?.companyId || undefined;
    let success = false;

    switch (action) {
      case 'transfer':
        if (!target) return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Transfer target required' } }, { status: 400 });
        success = await transferCall(extension, callId, target, companyId);
        break;
      case 'hold':
        success = await holdCall(extension, callId, companyId);
        break;
      case 'unhold':
        success = await unholdCall(extension, callId, companyId);
        break;
      default:
        return NextResponse.json({ success: false, error: { code: 'INVALID_ACTION' } }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    if (!callId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'callId required' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });
    const extension = (user?.voipConfig as any)?.pbxExtension;
    if (!extension) {
      return NextResponse.json({ success: false, error: { code: 'NOT_CONFIGURED' } }, { status: 400 });
    }

    await disconnectCall(extension, callId, user?.companyId || undefined);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
