/**
 * Database Keep-Alive Cron
 *
 * External watchdog that pings the database every 5 minutes via Inngest.
 * Complements the in-process heartbeat in lib/prisma.ts — if PM2 restarts
 * the process, the Inngest cron triggers an HTTP request that forces
 * module re-initialization and the eager $connect().
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';

export const databaseKeepAlive = inngest.createFunction(
  { id: 'database-keep-alive', name: 'Database Keep-Alive', retries: 1 },
  { cron: '*/5 * * * *' },
  async ({ logger }) => {
    const start = Date.now();

    try {
      await prisma.$queryRaw`SELECT NOW()`;
      const latencyMs = Date.now() - start;
      logger.info(`Keep-alive OK: ${latencyMs}ms`);
      return { status: 'ok', latencyMs };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      logger.error(`Keep-alive FAILED: ${msg}`);

      // Flush stale pool and re-establish fresh connections
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        logger.info('Keep-alive: pool reconnected after failure');
      } catch (reconnectErr) {
        const rmsg = reconnectErr instanceof Error ? reconnectErr.message : 'Unknown';
        logger.error(`Keep-alive: reconnect also failed: ${rmsg}`);
      }

      return { status: 'error', error: msg };
    }
  }
);
