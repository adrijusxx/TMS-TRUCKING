/**
 * CronScheduler
 *
 * Central manager for all node-cron scheduled jobs.
 * Started once via instrumentation.ts on server boot.
 * Supports DB-driven configuration via admin settings UI.
 *
 * Each job is isolated: if one throws, others continue.
 * All output goes to console for PM2 log capture.
 */

import cron, { type ScheduledTask } from 'node-cron';
import { runCrmSyncTask } from './tasks/crm-sync-task';
import { runFollowUpCheckTask } from './tasks/crm-follow-up-task';
import { runSLACheckTask } from './tasks/crm-sla-task';
import { runDripStepsTask } from './tasks/drip-steps-task';
import {
  runDailyAutomationTasks,
  runHourlyAutomationTasks,
  runWeeklyAutomationTasks,
} from './jobs';

// ─── Job Registry ──────────────────────────────────────────────

export type JobKey = 'CRM_SYNC' | 'CRM_FOLLOWUP' | 'CRM_SLA' | 'DRIP_STEPS' | 'HOURLY' | 'DAILY' | 'WEEKLY';

export interface JobDefinition {
  name: string;
  defaultSchedule: string;
  description: string;
  category: 'CRM' | 'Campaign' | 'Automation';
}

export const JOB_REGISTRY: Record<JobKey, JobDefinition> = {
  CRM_SYNC:     { name: 'CRM Lead Sync',       defaultSchedule: '*/15 * * * *', description: 'Syncs new leads from Google Sheets',          category: 'CRM' },
  CRM_FOLLOWUP: { name: 'CRM Follow-Up Check',  defaultSchedule: '5 * * * *',    description: 'Notifies recruiters about overdue follow-ups', category: 'CRM' },
  CRM_SLA:      { name: 'CRM SLA Check',         defaultSchedule: '0 6 * * *',    description: 'Alerts when leads exceed SLA time limits',    category: 'CRM' },
  DRIP_STEPS:   { name: 'Campaign Drip Steps',   defaultSchedule: '*/15 * * * *', description: 'Sends scheduled drip campaign messages',      category: 'Campaign' },
  HOURLY:       { name: 'Hourly Automation',      defaultSchedule: '0 * * * *',    description: 'Load status updates',                        category: 'Automation' },
  DAILY:        { name: 'Daily Automation',       defaultSchedule: '0 2 * * *',    description: 'Document expiry checks, HOS violations',     category: 'Automation' },
  WEEKLY:       { name: 'Weekly Automation',      defaultSchedule: '0 3 * * 0',    description: 'Extended document expiry checks',             category: 'Automation' },
};

const JOB_TASKS: Record<JobKey, () => Promise<unknown>> = {
  CRM_SYNC:     runCrmSyncTask,
  CRM_FOLLOWUP: runFollowUpCheckTask,
  CRM_SLA:      runSLACheckTask,
  DRIP_STEPS:   runDripStepsTask,
  HOURLY:       runHourlyAutomationTasks,
  DAILY:        runDailyAutomationTasks,
  WEEKLY:       runWeeklyAutomationTasks,
};

export type JobOverride = { enabled?: boolean; schedule?: string };
export type CronJobsConfig = Partial<Record<JobKey, JobOverride>>;

// ─── Scheduler State ───────────────────────────────────────────

let isStarted = false;
const activeTasks: ScheduledTask[] = [];
const PREFIX = '[CronScheduler]';

async function executeJob(name: string, task: () => Promise<unknown>): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting: ${name}`);

  try {
    const result = await task();
    const duration = Date.now() - startTime;
    console.log(`${PREFIX} Completed: ${name} (${duration}ms)`, JSON.stringify(result));
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${PREFIX} FAILED: ${name} (${duration}ms) — ${message}`);
  }
}

/** Run a specific job immediately (for "Run Now" button) */
export async function runJobNow(jobKey: JobKey): Promise<unknown> {
  const def = JOB_REGISTRY[jobKey];
  const task = JOB_TASKS[jobKey];
  if (!def || !task) throw new Error(`Unknown job key: ${jobKey}`);
  return executeJob(def.name, task);
}

/** Load overrides from DB (called by scheduler on startup and API on save) */
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

function stopAllTasks(): void {
  for (const task of activeTasks) {
    task.stop();
  }
  activeTasks.length = 0;
}

function registerJobs(overrides: CronJobsConfig): void {
  const jobKeys = Object.keys(JOB_REGISTRY) as JobKey[];

  for (const key of jobKeys) {
    const def = JOB_REGISTRY[key];
    const override = overrides[key];
    const enabled = override?.enabled ?? true;
    const schedule = override?.schedule || def.defaultSchedule;

    if (!enabled) {
      console.log(`${PREFIX}   [OFF] ${def.name}`);
      continue;
    }

    if (!cron.validate(schedule)) {
      console.error(`${PREFIX} Invalid cron for "${def.name}": ${schedule} — skipping`);
      continue;
    }

    const task = cron.schedule(schedule, () => {
      executeJob(def.name, JOB_TASKS[key]);
    }, { timezone: 'America/Chicago' });

    activeTasks.push(task);
    console.log(`${PREFIX}   [OK] ${def.name} — ${schedule}`);
  }
}

/**
 * Start the scheduler. Called once from instrumentation.ts.
 * Loads config from DB, falls back to defaults.
 */
export async function startCronScheduler(): Promise<void> {
  if (isStarted) {
    console.log(`${PREFIX} Already started, skipping`);
    return;
  }
  isStarted = true;

  console.log(`${PREFIX} ========================================`);
  console.log(`${PREFIX} Loading configuration...`);

  const overrides = await loadJobOverrides();

  console.log(`${PREFIX} Registering jobs:`);
  registerJobs(overrides);

  console.log(`${PREFIX} ========================================`);
  console.log(`${PREFIX} Scheduler running.`);
}

/**
 * Reload scheduler with new config. Called from API after settings save.
 * Stops all current jobs and re-registers with updated config.
 */
export async function reloadScheduler(): Promise<void> {
  console.log(`${PREFIX} Reloading...`);
  stopAllTasks();

  const overrides = await loadJobOverrides();
  registerJobs(overrides);

  console.log(`${PREFIX} Reload complete.`);
}
