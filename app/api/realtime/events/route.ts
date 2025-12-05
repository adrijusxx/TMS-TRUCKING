import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { UnauthorizedError } from '@/lib/errors';
import { eventEmitter, EventTypes } from '@/lib/realtime/EventEmitter';
import { logger } from '@/lib/utils/logger';

/**
 * Server-Sent Events endpoint for real-time updates
 * Clients can subscribe to different event types
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const searchParams = request.nextUrl.searchParams;
  const eventTypes = searchParams.get('types')?.split(',') || ['all'];

  logger.info('SSE connection established', {
    userId: session.user.id,
    companyId: session.user.companyId,
    eventTypes,
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isClosed = false;

      // Send initial connection message
      const send = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            logger.error('Error sending SSE data', { error });
            isClosed = true;
          }
        }
      };

      send(JSON.stringify({ 
        type: 'connected', 
        timestamp: new Date().toISOString(),
        eventTypes,
      }));

      // Set up event listeners for subscribed event types
      const eventHandlers: Array<() => void> = [];
      
      for (const eventType of eventTypes) {
        const handler = (data: unknown) => {
          send(JSON.stringify({
            type: eventType === 'all' ? 'event' : eventType,
            data,
            timestamp: new Date().toISOString(),
          }));
        };

        eventEmitter.on(eventType, handler);
        eventHandlers.push(() => eventEmitter.off(eventType, handler));
      }

      // Set up interval to send keepalive
      const keepAliveInterval = setInterval(() => {
        send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
      }, 30000); // Every 30 seconds

      // Cleanup function
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        
        clearInterval(keepAliveInterval);
        eventHandlers.forEach((cleanup) => cleanup());
        
        try {
          controller.close();
        } catch (error) {
          logger.error('Error closing SSE stream', { error });
        }

        logger.info('SSE connection closed', {
          userId: session.user.id,
        });
      };

      // Cleanup on abort
      request.signal.addEventListener('abort', cleanup);

      // Also handle client disconnect
      // Note: This is a best-effort cleanup, actual disconnect detection
      // may vary by deployment environment
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

