/**
 * Auto-Invoice on Status Change
 *
 * Listens for load/status-changed events and automatically generates
 * an invoice when a load reaches DELIVERED or READY_TO_BILL status.
 *
 * Idempotent: skips if load is already INVOICED or PAID.
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';
import { BillingHoldManager } from '@/lib/managers/BillingHoldManager';

const INVOICEABLE_STATUSES = ['DELIVERED', 'READY_TO_BILL'];
const ALREADY_INVOICED_STATUSES = ['INVOICED', 'PAID'];

export const autoInvoiceOnStatusChange = inngest.createFunction(
  {
    id: 'auto-invoice-on-status-change',
    name: 'Auto-Generate Invoice on Status Change',
    retries: 3,
  },
  { event: 'load/status-changed' },
  async ({ event, step, logger }) => {
    const { loadId, companyId, newStatus } = event.data;

    // Only process invoiceable statuses
    if (!INVOICEABLE_STATUSES.includes(newStatus)) {
      return { skipped: true, reason: `Status ${newStatus} is not invoiceable` };
    }

    // Step 1: Fetch load and check current state
    const load = await step.run('fetch-load', async () => {
      return prisma.load.findUnique({
        where: { id: loadId },
        select: {
          id: true,
          loadNumber: true,
          status: true,
          companyId: true,
          customerId: true,
          isBillingHold: true,
          customer: { select: { name: true, type: true } },
        },
      });
    });

    if (!load) {
      return { skipped: true, reason: 'Load not found' };
    }

    // Idempotency: skip if already invoiced
    if (ALREADY_INVOICED_STATUSES.includes(load.status)) {
      logger.info(`Load ${load.loadNumber} already ${load.status}, skipping`);
      return { skipped: true, reason: `Already ${load.status}` };
    }

    // Step 2: Check billing hold eligibility
    const eligibility = await step.run('check-eligibility', async () => {
      const billingHoldManager = new BillingHoldManager();
      return billingHoldManager.checkInvoicingEligibility(loadId);
    });

    if (!eligibility.eligible) {
      logger.info(`Load ${load.loadNumber} not eligible: ${eligibility.reason}`);
      return { skipped: true, reason: eligibility.reason };
    }

    // Step 3: Check ready-to-bill conditions
    const readiness = await step.run('check-ready-to-bill', async () => {
      const invoiceManager = new InvoiceManager();
      return invoiceManager.isReadyToBill(loadId, {
        allowBrokerageSplit: load.customer?.type === 'BROKER',
      });
    });

    if (!readiness.ready) {
      logger.info(`Load ${load.loadNumber} not ready to bill: ${readiness.reasons?.join(', ')}`);
      return { skipped: true, reason: `Not ready: ${readiness.reasons?.join(', ')}` };
    }

    // Step 4: Generate invoice
    const invoiceResult = await step.run('generate-invoice', async () => {
      const invoiceManager = new InvoiceManager();
      const result = await invoiceManager.generateInvoice([loadId]);
      // Normalize the discriminated union to a flat shape for Inngest serialization
      if (!result.success) {
        return { success: false as const, error: (result as any).error as string, invoiceId: null };
      }
      return { success: true as const, error: null, invoiceId: (result as any).invoice?.id as string };
    });

    if (!invoiceResult.success) {
      logger.error(`Invoice generation failed for ${load.loadNumber}: ${invoiceResult.error}`);
      throw new Error(`Invoice generation failed: ${invoiceResult.error}`);
    }

    const invoiceId: string | null = invoiceResult.invoiceId;

    // Step 5: Log activity
    await step.run('log-activity', async () => {
      await prisma.activityLog.create({
        data: {
          companyId,
          action: 'AUTO_INVOICE_GENERATED',
          entityType: 'Invoice',
          entityId: invoiceId || loadId,
          description: `Auto-generated invoice for load ${load.loadNumber} (triggered by ${newStatus})`,
          metadata: {
            loadId,
            loadNumber: load.loadNumber,
            customerId: load.customerId,
            customerName: load.customer?.name,
            triggeredBy: 'inngest:auto-invoice',
            triggerStatus: newStatus,
          },
        },
      });
    });

    logger.info(`Invoice auto-generated for load ${load.loadNumber}`);

    return {
      success: true,
      loadId,
      loadNumber: load.loadNumber,
      invoiceId,
    };
  }
);
