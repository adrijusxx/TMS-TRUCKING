import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client
 * 
 * Note: DATABASE_URL should be initialized from AWS Secrets Manager
 * via the initialization function before this module is imported.
 * @see lib/secrets/initialize.ts
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors and warnings - reduce console noise
    log: ['error', 'warn'],
    // Add connection pool configuration to prevent connection errors
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

