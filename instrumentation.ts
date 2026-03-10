/**
 * Next.js Instrumentation Hook
 *
 * Runs once on server startup. Initializes background services.
 * Note: Cron jobs are now handled by Inngest (external scheduler),
 * so no in-process scheduler is needed.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Auto-reconnect all active Telegram sessions on startup
    setTimeout(async () => {
      try {
        const { prisma } = await import('./lib/prisma');
        const { getTelegramService } = await import('./lib/services/TelegramService');
        // Find all active sessions and reconnect each
        const activeSessions = await prisma.telegramSession.findMany({
          where: { isActive: true },
          select: { companyId: true, mcNumberId: true },
        });

        for (const sess of activeSessions) {
          if (!sess.companyId) continue;
          const scope = {
            key: sess.mcNumberId ? `mc:${sess.mcNumberId}` : `company:${sess.companyId}`,
            companyId: sess.companyId,
            mcNumberId: sess.mcNumberId,
            mode: (sess.mcNumberId ? 'MC' : 'COMPANY') as 'MC' | 'COMPANY',
          };
          try {
            const service = getTelegramService(scope);
            const connected = await service.autoConnect();
            if (connected) {
              console.log(`[Startup] Telegram reconnected for ${scope.key}`);
            }
          } catch (err) {
            console.warn(`[Startup] Telegram reconnect failed for ${scope.key}:`, (err as Error).message);
          }
        }
      } catch (error) {
        console.warn('[Startup] Telegram auto-reconnect failed:', (error as Error).message);
      }
    }, 5000);
  }
}
