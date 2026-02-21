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

    // Auto-reconnect Telegram and start AI message processing
    // Runs after a short delay to avoid blocking startup
    setTimeout(async () => {
      try {
        const { getTelegramService } = await import('./lib/services/TelegramService');
        const telegramService = getTelegramService();
        const connected = await telegramService.autoConnect();
        if (connected) {
          console.log('[Startup] Telegram reconnected — message listener active');
        }
      } catch (error) {
        console.warn('[Startup] Telegram auto-reconnect failed (will retry on first UI access):', (error as Error).message);
      }
    }, 5000);
  }
}
