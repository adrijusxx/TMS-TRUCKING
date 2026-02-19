import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { fetchRecordingStream } from '@/lib/integrations/netsapiens';

/**
 * NetSapiens Recording Proxy
 * GET /api/integrations/netsapiens/recordings/[callId]
 *
 * Proxies the recording audio from the NS API (which requires Bearer auth)
 * so the browser's <audio> element can play it without credentials.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'settings.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { callId } = await params;
    if (!callId) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 });
    }

    const response = await fetchRecordingStream(callId, session.user.companyId);

    if (!response) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Forward the audio stream to the client
    const contentType = response.headers.get('content-type') || 'audio/wav';
    const contentLength = response.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    };
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[NetSapiens Recording] Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
}
