import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  keepAliveTimer: ReturnType<typeof setInterval> | undefined;
};

/**
 * Prisma Client singleton with eager connection and keep-alive heartbeat.
 *
 * - Calls $connect() immediately to avoid cold-start latency on first query
 * - Pings the database every 4 minutes to keep connections warm
 *   (AWS VPC NAT gateways can close idle TCP connections after ~5 min)
 *
 * @see lib/secrets/initialize.ts — DATABASE_URL is set by AWS Secrets Manager
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });

// Cache singleton in ALL environments (PM2 fork mode is a single long-lived process)
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// ── Eager connect + Keep-alive heartbeat ──────────────────────────────────
if (!globalForPrisma.keepAliveTimer) {
  // Establish the connection pool immediately (don't wait for the first query)
  prisma.$connect()
    .then(() => console.log('[Prisma] Connected to database'))
    .catch((err: Error) => console.error('[Prisma] Initial connect failed:', err.message));

  // Ping every 4 min to prevent idle TCP connections from being dropped
  const HEARTBEAT_MS = 4 * 60 * 1000;

  globalForPrisma.keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      console.warn('[Prisma] Keep-alive failed:', msg);
    }
  }, HEARTBEAT_MS);

  // Don't let the timer prevent Node.js from exiting on shutdown
  if (globalForPrisma.keepAliveTimer.unref) {
    globalForPrisma.keepAliveTimer.unref();
  }
}

/** Graceful shutdown — clear heartbeat timer and disconnect */
export async function shutdownPrisma(): Promise<void> {
  if (globalForPrisma.keepAliveTimer) {
    clearInterval(globalForPrisma.keepAliveTimer);
    globalForPrisma.keepAliveTimer = undefined;
  }
  await prisma.$disconnect();
  console.log('[Prisma] Disconnected');
}
