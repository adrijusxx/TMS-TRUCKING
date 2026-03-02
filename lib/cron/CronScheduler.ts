/**
 * Job Registry
 *
 * Defines all scheduled job metadata for the admin settings UI.
 * Scheduling is handled by Inngest (see lib/inngest/functions/).
 * This file only provides the registry, "Run Now" functionality,
 * and DB override loading for the settings API.
 */

import {
  runDailyAutomationTasks,
  runHourlyAutomationTasks,
  runWeeklyAutomationTasks,
} from './jobs';

// ─── Job Registry ──────────────────────────────────────────────

export type JobKey = 'CRM_SYNC' | 'CRM_FOLLOWUP' | 'CRM_SLA' | 'DRIP_STEPS' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'SAMSARA_FAULTS';

export interface JobDefinition {
  name: string;
  defaultSchedule: string;
  description: string;
  category: 'CRM' | 'Campaign' | 'Automation' | 'Fleet';
}

export const JOB_REGISTRY: Record<JobKey, JobDefinition> = {
  CRM_SYNC:       { name: 'CRM Lead Sync',         defaultSchedule: '4,19,34,49 * * * *', description: 'Syncs new leads from Google Sheets',          category: 'CRM' },
  CRM_FOLLOWUP:   { name: 'CRM Follow-Up Check',    defaultSchedule: '8 * * * *',          description: 'Notifies recruiters about overdue follow-ups', category: 'CRM' },
  CRM_SLA:        { name: 'CRM SLA Check',           defaultSchedule: '0 7 * * *',          description: 'Alerts when leads exceed SLA time limits',    category: 'CRM' },
  DRIP_STEPS:     { name: 'Campaign Drip Steps',     defaultSchedule: '14,29,44,59 * * * *', description: 'Sends scheduled drip campaign messages',      category: 'Campaign' },
  HOURLY:         { name: 'Hourly Automation',        defaultSchedule: '20 * * * *',          description: 'Load status updates',                        category: 'Automation' },
  DAILY:          { name: 'Daily Automation',         defaultSchedule: '0 3 * * *',          description: 'Document expiry checks, HOS violations',     category: 'Automation' },
  WEEKLY:         { name: 'Weekly Automation',        defaultSchedule: '0 4 * * 0',          description: 'Extended document expiry checks',             category: 'Automation' },
  SAMSARA_FAULTS: { name: 'Samsara Fault Sync',      defaultSchedule: '40 * * * *',         description: 'Syncs truck fault codes from Samsara',       category: 'Fleet' },
};

export type JobOverride = { enabled?: boolean; schedule?: string };
export type CronJobsConfig = Partial<Record<JobKey, JobOverride>>;

// ─── Run Now (for admin "Run Now" button) ─────────────────────

const PREFIX = '[JobRunner]';

/**
 * Lazily load task functions to avoid circular imports.
 * CRM/Campaign/Fleet tasks use the same logic as their Inngest functions.
 */
async function getTaskForJob(key: JobKey): Promise<() => Promise<unknown>> {
  switch (key) {
    case 'CRM_SYNC': {
      const { runCrmSyncTask } = await import('./tasks/crm-sync-task');
      return runCrmSyncTask;
    }
    case 'CRM_FOLLOWUP': {
      const { runFollowUpCheckTask } = await import('./tasks/crm-follow-up-task');
      return runFollowUpCheckTask;
    }
    case 'CRM_SLA': {
      const { runSLACheckTask } = await import('./tasks/crm-sla-task');
      return runSLACheckTask;
    }
    case 'DRIP_STEPS': {
      const { runDripStepsTask } = await import('./tasks/drip-steps-task');
      return runDripStepsTask;
    }
    case 'SAMSARA_FAULTS': {
      const { runSamsaraFaultsTask } = await import('./tasks/samsara-faults-task');
      return runSamsaraFaultsTask;
    }
    case 'HOURLY':
      return runHourlyAutomationTasks;
    case 'DAILY':
      return runDailyAutomationTasks;
    case 'WEEKLY':
      return runWeeklyAutomationTasks;
    default:
      throw new Error(`Unknown job key: ${key}`);
  }
}

/** Run a specific job immediately (for "Run Now" button in admin settings) */
export async function runJobNow(jobKey: JobKey): Promise<unknown> {
  const def = JOB_REGISTRY[jobKey];
  if (!def) throw new Error(`Unknown job key: ${jobKey}`);

  const task = await getTaskForJob(jobKey);
  const startTime = Date.now();
  console.log(`${PREFIX} Starting: ${def.name} (manual)`);

  try {
    const result = await task();
    const duration = Date.now() - startTime;
    console.log(`${PREFIX} Completed: ${def.name} (${duration}ms)`, JSON.stringify(result));
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${PREFIX} FAILED: ${def.name} (${duration}ms) — ${message}`);
    throw error;
  }
}

// ─── DB Override Loading ──────────────────────────────────────

/** Load job overrides from DB (used by settings GET API) */
export async function loadJobOverrides(): Promise<CronJobsConfig> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const settings = await prisma.companySettings.findFirst({
      select: { generalSettings: true },
    });
    const general = settings?.generalSettings as Record<string, unknown> | null;
    return (general?.cronJobs as CronJobsConfig) || {};
  } catch (error) {
    console.warn(`${PREFIX} Could not load DB overrides, using defaults:`, error);
    return {};
  }
}
