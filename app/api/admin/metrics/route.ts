import { NextRequest } from 'next/server';
import { handleApiRequest } from '@/lib/api/route-helpers';
import { ForbiddenError } from '@/lib/errors';

/**
 * Get system performance metrics
 * Admin only — returns real Node.js runtime metrics
 */
export async function GET(request: NextRequest) {
  return handleApiRequest(
    request,
    async (session) => {
      if (session.user.role !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }

      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      return {
        uptime: Math.round(uptime),
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
          externalMB: Math.round(memUsage.external / 1024 / 1024),
        },
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString(),
      };
    },
    { loggable: true }
  );
}
