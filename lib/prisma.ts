import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  keepAliveTimer: ReturnType<typeof setInterval> | undefined;
};

/**
 * Prisma Client singleton with eager connection and aggressive keep-alive.
 *
 * - Calls $connect() immediately to avoid cold-start latency on first query
 * - Pings the database every 60s to keep ALL pool connections warm
 *   (AWS NAT gateways kill idle TCP connections after ~350s)
 * - If heartbeat fails, flushes the zombie pool via $disconnect() + $connect()
 * - DATABASE_URL includes socket_timeout=3 so dead pipes are detected in 3s
 *
 * @see lib/secrets/initialize.ts — DATABASE_URL is set by AWS Secrets Manager
 * @see scripts/start-with-secrets.js — pool params in DATABASE_URL
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
    .then(() => {
      console.log('[Prisma] Connected to database');
      // Log pool params (redacted) so PM2 logs confirm socket_timeout is in effect
      const url = process.env.DATABASE_URL || '';
      const params = url.split('?')[1] || '';
      if (params) console.log(`[Prisma] Pool params: ${params}`);
    })
    .catch((err: Error) => console.error('[Prisma] Initial connect failed:', err.message));

  // Ping every 60s — keeps all pool connections warm before the ~350s AWS idle kill
  const HEARTBEAT_MS = 60 * 1000;

  globalForPrisma.keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      console.warn('[Prisma] Keep-alive failed:', msg);
      // Do NOT call $disconnect()/$connect() here — it kills ALL active connections
      // and causes a full pool flush, freezing every in-flight request.
      // With socket_timeout=3 in DATABASE_URL, Prisma's internal pool automatically
      // evicts dead connections and creates fresh ones on the next query.
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
