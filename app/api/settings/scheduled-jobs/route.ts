/**
 * Scheduled Jobs Settings API
 *
 * GET  — Returns all job definitions with current overrides
 * PATCH — Updates a specific job's enabled state (schedules managed by Inngest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  JOB_REGISTRY,
  type JobKey,
  type CronJobsConfig,
} from '@/lib/cron/CronScheduler';

const validJobKeys = Object.keys(JOB_REGISTRY) as JobKey[];

/** Basic cron expression validation (5-field format) */
function isValidCronExpression(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  return parts.length === 5;
}

const updateSchema = z.object({
  jobKey: z.enum(validJobKeys as [string, ...string[]]),
  enabled: z.boolean().optional(),
  schedule: z.string().optional(),
}).refine((data) => {
  if (data.schedule && !isValidCronExpression(data.schedule)) {
    return false;
  }
  return true;
}, { message: 'Invalid cron expression' });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
      select: { generalSettings: true },
    });

    const general = companySettings?.generalSettings as Record<string, unknown> | null;
    const overrides = (general?.cronJobs as CronJobsConfig) || {};

    const jobs = validJobKeys.map((key) => {
      const def = JOB_REGISTRY[key];
      const override = overrides[key];
      return {
        key,
        name: def.name,
        description: def.description,
        category: def.category,
        defaultSchedule: def.defaultSchedule,
        schedule: override?.schedule || def.defaultSchedule,
        enabled: override?.enabled ?? true,
        isDefault: !override?.schedule,
      };
    });

    return NextResponse.json({ success: true, data: { jobs } });
  } catch (error) {
    console.error('[API:scheduled-jobs] GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to load scheduled jobs' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.message || 'Validation failed' } },
        { status: 400 }
      );
    }

    const { jobKey, enabled, schedule } = parsed.data;

    // Load existing settings
    let companySettings = await prisma.companySettings.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: { companyId: session.user.companyId, generalSettings: {} },
      });
    }

    const general = (companySettings.generalSettings as Record<string, unknown>) || {};
    const cronJobs = (general.cronJobs as CronJobsConfig) || {};

    // Update the specific job
    cronJobs[jobKey as JobKey] = {
      ...cronJobs[jobKey as JobKey],
      ...(enabled !== undefined && { enabled }),
      ...(schedule !== undefined && { schedule }),
    };

    // Save back
    await prisma.companySettings.update({
      where: { companyId: session.user.companyId },
      data: {
        generalSettings: { ...general, cronJobs },
      },
    });

    // Note: Schedules are now managed by Inngest (code-defined cron triggers).
    // DB overrides are stored for reference but Inngest schedules require code deployment to change.

    return NextResponse.json({ success: true, data: { jobKey, enabled, schedule } });
  } catch (error) {
    console.error('[API:scheduled-jobs] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update scheduled job' } },
      { status: 500 }
    );
  }
}
