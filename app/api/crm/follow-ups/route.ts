/**
 * GET  /api/crm/follow-ups          — Get follow-up queue (overdue or user's queue)
 * POST /api/crm/follow-ups          — Schedule a follow-up for a lead
 * POST /api/crm/follow-ups/escalate — Run escalation check
 *
 * Query params (GET):
 *   view=overdue|queue   (default: queue)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { FollowUpManager } from '@/lib/managers/FollowUpManager';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'queue';

    if (view === 'overdue') {
      const data = await FollowUpManager.getOverdueFollowUps(session.user.companyId);
      return NextResponse.json({ success: true, data });
    }

    // Default: user's follow-up queue
    const data = await FollowUpManager.getFollowUpQueue(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    logger.error('Failed to fetch follow-ups', { error });
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Escalation endpoint
    if (action === 'escalate') {
      const thresholdDays = body.thresholdDays ? Number(body.thresholdDays) : undefined;
      const result = await FollowUpManager.escalateOverdue(
        session.user.companyId,
        thresholdDays
      );
      return NextResponse.json({ success: true, data: result });
    }

    // Schedule a follow-up
    const { leadId, date, assigneeId, notes } = body;
    if (!leadId || !date) {
      return NextResponse.json(
        { error: 'leadId and date are required' },
        { status: 400 }
      );
    }

    const result = await FollowUpManager.scheduleFollowUp({
      leadId,
      date: new Date(date),
      assigneeId,
      notes,
      companyId: session.user.companyId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    logger.error('Failed to process follow-up', { error });
    return NextResponse.json({ error: 'Failed to process follow-up' }, { status: 500 });
  }
}
