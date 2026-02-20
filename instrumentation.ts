/**
 * Next.js Instrumentation Hook
 *
 * Runs once on server startup. Initializes the in-process
 * cron scheduler for background tasks (CRM sync, follow-ups, etc.).
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCronScheduler } = await import('./lib/cron/CronScheduler');
    await startCronScheduler();
  }
}
