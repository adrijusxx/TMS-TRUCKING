/**
 * Scheduled Job Manual Trigger API
 *
 * POST — Runs a specific job immediately for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { JOB_REGISTRY, runJobNow, type JobKey } from '@/lib/cron/CronScheduler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobKey: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { jobKey } = await params;

    if (!JOB_REGISTRY[jobKey as JobKey]) {
      return NextResponse.json(
        { success: false, error: { message: `Unknown job: ${jobKey}` } },
        { status: 400 }
      );
    }

    await runJobNow(jobKey as JobKey);

    return NextResponse.json({
      success: true,
      data: { jobKey, message: `Job "${JOB_REGISTRY[jobKey as JobKey].name}" executed` },
    });
  } catch (error) {
    console.error('[API:scheduled-jobs/test] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to run job';
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
