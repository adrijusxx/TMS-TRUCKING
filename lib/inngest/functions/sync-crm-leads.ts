/**
 * CRM Lead Auto-Sync
 *
 * Runs every 15 minutes, checks each CRM integration's syncInterval/lastSyncAt,
 * and triggers processCrmIntegration for those that are due.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { processCrmIntegration } from '@/lib/services/crm-import';

export const syncCrmLeads = inngest.createFunction(
    { id: 'sync-crm-leads', name: 'CRM Lead Auto-Sync' },
    { cron: '*/15 * * * *' }, // Every 15 minutes
    async ({ step }) => {
        // Find all enabled integrations that are due for sync
        const integrations = await step.run('find-due-integrations', async () => {
            const all = await prisma.crmIntegration.findMany({
                where: { enabled: true, syncInterval: { not: null } },
                select: { id: true, lastSyncAt: true, syncInterval: true, type: true, mcNumberId: true },
            });

            const now = Date.now();
            return all.filter((i) => {
                if (!i.syncInterval) return false;
                if (!i.lastSyncAt) return true; // Never synced → sync now
                const intervalMs = i.syncInterval * 60 * 1000;
                return now - new Date(i.lastSyncAt).getTime() >= intervalMs;
            });
        });

        if (integrations.length === 0) {
            return { synced: 0, message: 'No integrations due for sync' };
        }

        const results: Array<{ id: string; status: string; error?: string }> = [];

        for (const integration of integrations) {
            const result = await step.run(`sync-${integration.id}`, async () => {
                const start = Date.now();
                try {
                    const importResult = await processCrmIntegration(integration.id);
                    const duration = Date.now() - start;

                    // Create sync log
                    await prisma.crmSyncLog.create({
                        data: {
                            integrationId: integration.id,
                            status: importResult.errors?.length ? 'PARTIAL' : 'SUCCESS',
                            rowsProcessed: importResult.created + importResult.duplicates,
                            rowsCreated: importResult.created,
                            rowsSkipped: importResult.duplicates,
                            errors: importResult.errors?.length ? importResult.errors : undefined,
                            duration,
                            triggeredBy: 'cron',
                        },
                    });

                    return { id: integration.id, status: 'success' };
                } catch (error: any) {
                    const duration = Date.now() - start;

                    await prisma.crmSyncLog.create({
                        data: {
                            integrationId: integration.id,
                            status: 'FAILED',
                            errors: [{ message: error.message || 'Unknown error' }],
                            duration,
                            triggeredBy: 'cron',
                        },
                    });

                    return { id: integration.id, status: 'failed', error: error.message };
                }
            });
            results.push(result);
        }

        return {
            synced: results.length,
            results,
        };
    }
);
