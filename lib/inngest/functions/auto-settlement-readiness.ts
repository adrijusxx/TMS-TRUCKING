/**
 * Auto-Settlement Readiness on Delivery
 *
 * Listens for load/status-changed events and ensures the load is
 * flagged as ready for settlement when delivered. Also emits the
 * load/delivered event consumed by downstream functions (e.g. IFTA).
 *
 * Idempotent: skips the DB update if readyForSettlement is already true,
 * but always emits load/delivered for downstream consumers.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';

export const autoSettlementReadiness = inngest.createFunction(
  {
    id: 'auto-settlement-readiness',
    name: 'Auto-Set Settlement Readiness on Delivery',
    retries: 3,
  },
  { event: 'load/status-changed' },
  async ({ event, step, logger }) => {
    const { loadId, companyId, newStatus } = event.data;

    // Only process DELIVERED status
    if (newStatus !== 'DELIVERED') {
      return { skipped: true, reason: `Status ${newStatus} is not DELIVERED` };
    }

    // Step 1: Fetch load
    const load = await step.run('fetch-load', async () => {
      return prisma.load.findUnique({
        where: { id: loadId },
        select: {
          id: true,
          loadNumber: true,
          driverId: true,
          readyForSettlement: true,
          deliveredAt: true,
          companyId: true,
        },
      });
    });

    if (!load) {
      return { skipped: true, reason: 'Load not found' };
    }

    if (!load.driverId) {
      logger.info(`Load ${load.loadNumber} has no driver, skipping settlement readiness`);
      return { skipped: true, reason: 'No driver assigned' };
    }

    // Step 2: Ensure readyForSettlement flag is set
    const updated = await step.run('ensure-ready-for-settlement', async () => {
      if (load.readyForSettlement) {
        return { alreadyReady: true };
      }

      await prisma.load.update({
        where: { id: loadId },
        data: {
          readyForSettlement: true,
          deliveredAt: load.deliveredAt || new Date(),
        },
      });

      return { alreadyReady: false };
    });

    // Step 3: Emit load/delivered event for downstream consumers (IFTA, etc.)
    await step.run('emit-load-delivered', async () => {
      await inngest.send({
        name: 'load/delivered',
        data: { loadId, companyId },
      });
    });

    // Step 4: Log activity
    await step.run('log-activity', async () => {
      if (!updated.alreadyReady) {
        await prisma.activityLog.create({
          data: {
            companyId,
            action: 'SETTLEMENT_READINESS_SET',
            entityType: 'Load',
            entityId: loadId,
            description: `Load ${load.loadNumber} marked ready for settlement (driver: ${load.driverId})`,
            metadata: {
              loadId,
              loadNumber: load.loadNumber,
              driverId: load.driverId,
              triggeredBy: 'inngest:auto-settlement-readiness',
            },
          },
        });
      }
    });

    logger.info(
      `Load ${load.loadNumber}: readyForSettlement=${!updated.alreadyReady ? 'set' : 'already set'}, load/delivered emitted`
    );

    return {
      success: true,
      loadId,
      loadNumber: load.loadNumber,
      flagWasAlreadySet: updated.alreadyReady,
      loadDeliveredEmitted: true,
    };
  }
);
