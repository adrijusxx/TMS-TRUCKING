import { NextRequest } from 'next/server';
import { handleApiRequest } from '@/lib/api/route-helpers';
import { ForbiddenError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

/**
 * Get database metrics
 * Admin only — queries real PostgreSQL stats
 */
export async function GET(request: NextRequest) {
  return handleApiRequest(
    request,
    async (session: Session) => {
      if (session.user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }

      // Query real database size and table stats
      const [dbSize, tableStats, activeConnections] = await Promise.all([
        prisma.$queryRaw<{ size: string }[]>`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `,
        prisma.$queryRaw<{ table_name: string; row_estimate: number; total_size: string }[]>`
          SELECT
            relname as table_name,
            reltuples::bigint as row_estimate,
            pg_size_pretty(pg_total_relation_size(oid)) as total_size
          FROM pg_class
          WHERE relkind = 'r' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          ORDER BY pg_total_relation_size(oid) DESC
          LIMIT 20
        `,
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
        `,
      ]);

      return {
        databaseSize: dbSize[0]?.size ?? 'unknown',
        activeConnections: Number(activeConnections[0]?.count ?? 0),
        largestTables: tableStats.map((t) => ({
          table: t.table_name,
          rowEstimate: Number(t.row_estimate),
          totalSize: t.total_size,
        })),
        timestamp: new Date().toISOString(),
      };
    },
    { loggable: true }
  );
}
