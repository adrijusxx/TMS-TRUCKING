/**
 * Background check endpoints for a specific lead
 *
 * GET  /api/crm/leads/[id]/background-checks           — List all checks
 * GET  /api/crm/leads/[id]/background-checks?complete   — Check if all required complete
 * POST /api/crm/leads/[id]/background-checks            — Initiate a new check
 * PATCH /api/crm/leads/[id]/background-checks           — Update check status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BackgroundCheckManager } from '@/lib/managers/BackgroundCheckManager';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const { searchParams } = new URL(request.url);

    if (searchParams.has('complete')) {
      const result = await BackgroundCheckManager.isCheckComplete(leadId);
      return NextResponse.json({ success: true, data: result });
    }

    const checks = await BackgroundCheckManager.getCheckStatus(leadId);
    return NextResponse.json({ success: true, data: checks });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    logger.error('Failed to fetch background checks', { error });
    return NextResponse.json(
      { error: 'Failed to fetch background checks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const { checkType } = body;

    if (!checkType) {
      return NextResponse.json(
        { error: 'checkType is required' },
        { status: 400 }
      );
    }

    const result = await BackgroundCheckManager.initiateCheck(
      leadId,
      checkType,
      session.user.companyId,
      session.user.id
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    logger.error('Failed to initiate background check', { error });
    return NextResponse.json(
      { error: 'Failed to initiate background check' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { checkId, status, results } = body;

    if (!checkId || !status) {
      return NextResponse.json(
        { error: 'checkId and status are required' },
        { status: 400 }
      );
    }

    const result = await BackgroundCheckManager.updateCheckStatus(
      checkId,
      status,
      results
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    logger.error('Failed to update background check', { error });
    return NextResponse.json(
      { error: 'Failed to update background check' },
      { status: 500 }
    );
  }
}
