import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';
import { emitLoadDelivered, emitLoadStatusChanged, emitDispatchUpdated } from '@/lib/realtime/emitEvent';
import { inngest } from '@/lib/inngest/client';

/**
 * Mark load as complete and trigger accounting sync
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const loadId = resolvedParams.id;

    // Verify load belongs to company
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!load) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Load not found' },
        },
        { status: 404 }
      );
    }

    // Check if load is in a completable status
    if (load.status !== 'DELIVERED' && load.status !== 'AT_DELIVERY') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Load must be delivered before marking as complete',
          },
        },
        { status: 400 }
      );
    }

    // Update load status to DELIVERED if not already
    if (load.status !== 'DELIVERED') {
      await prisma.load.update({
        where: { id: loadId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });
    }

    // Trigger completion workflow
    const completionManager = new LoadCompletionManager();
    const result = await completionManager.handleLoadCompletion(loadId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COMPLETION_FAILED',
            message: 'Load completion workflow failed',
            details: result.errors,
          },
        },
        { status: 500 }
      );
    }

    // Get updated load for real-time event
    const updatedLoad = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        customer: { select: { name: true } },
        driver: { select: { driverNumber: true } },
      },
    });

    // Emit real-time events
    if (updatedLoad) {
      emitLoadDelivered(loadId, updatedLoad);
      emitLoadStatusChanged(loadId, 'DELIVERED', updatedLoad);
      emitDispatchUpdated({ type: 'load_delivered', loadId });
    }

    // Emit Inngest event for async automation (invoice, settlement readiness)
    try {
      await inngest.send({
        name: 'load/status-changed',
        data: {
          loadId,
          companyId: session.user.companyId,
          previousStatus: load.status,
          newStatus: 'DELIVERED',
        },
      });
    } catch (e) {
      console.error('Failed to emit load/status-changed on completion:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        loadId,
        syncedToAccounting: result.syncedToAccounting,
        metricsUpdated: result.metricsUpdated,
        notificationsSent: result.notificationsSent,
        warnings: result.errors,
      },
    });
  } catch (error: any) {
    console.error('Error completing load:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to complete load',
        },
      },
      { status: 500 }
    );
  }
}





