/**
 * CRM Lead Sync Task
 *
 * Standalone version of the Inngest sync-crm-leads function.
 * Finds integrations due for sync and processes them via Google Sheets.
 */

import { prisma } from '@/lib/prisma';
import { processCrmIntegration } from '@/lib/services/crm-import';

interface SyncResult {
  synced: number;
  results: Array<{ id: string; status: string; error?: string }>;
}

export async function runCrmSyncTask(): Promise<SyncResult> {
  const allIntegrations = await prisma.crmIntegration.findMany({
    where: { enabled: true, syncInterval: { not: null } },
    select: { id: true, lastSyncAt: true, syncInterval: true },
  });

  const now = Date.now();
  const dueIntegrations = allIntegrations.filter((i) => {
    if (!i.syncInterval) return false;
    if (!i.lastSyncAt) return true;
    const intervalMs = i.syncInterval * 60 * 1000;
    return now - new Date(i.lastSyncAt).getTime() >= intervalMs;
  });

  if (dueIntegrations.length === 0) {
    return { synced: 0, results: [] };
  }

  const results: SyncResult['results'] = [];

  for (const integration of dueIntegrations) {
    const start = Date.now();
    try {
      const importResult = await processCrmIntegration(integration.id);
      const duration = Date.now() - start;

      await prisma.crmSyncLog.create({
        data: {
          integrationId: integration.id,
          status: importResult.errors?.length ? 'PARTIAL' : 'SUCCESS',
          rowsProcessed: importResult.created + importResult.duplicates,
          rowsCreated: importResult.created,
          rowsSkipped: importResult.duplicates,
          errors: importResult.errors?.length ? importResult.errors : undefined,
          duration,
          triggeredBy: 'node-cron',
        },
      });

      results.push({ id: integration.id, status: 'success' });
    } catch (error: unknown) {
      const duration = Date.now() - start;
      const message = error instanceof Error ? error.message : 'Unknown error';

      await prisma.crmSyncLog.create({
        data: {
          integrationId: integration.id,
          status: 'FAILED',
          errors: [{ message }],
          duration,
          triggeredBy: 'node-cron',
        },
      });

      results.push({ id: integration.id, status: 'failed', error: message });
    }
  }

  return { synced: results.length, results };
}
