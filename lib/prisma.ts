import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client (Prisma 6)
 * 
 * Note: DATABASE_URL should be initialized from AWS Secrets Manager
 * via the initialization function before this module is imported.
 * 
 * In production on AWS, secrets are initialized via the /api/init-secrets
 * endpoint (called on first request or by a startup script).
 * 
 * @see lib/secrets/initialize.ts
 * @see app/api/init-secrets/route.ts
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors and warnings - reduce console noise
    log: ['error', 'warn'],
    // Connection URL is handled via DATABASE_URL environment variable
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
