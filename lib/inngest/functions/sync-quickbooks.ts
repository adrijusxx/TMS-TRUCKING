/**
 * QuickBooks Sync Background Functions
 * 
 * Handles invoice and customer syncing to QuickBooks in the background.
 * Triggered by: invoice.approved event
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 3.2
 */

import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { syncInvoiceToQuickBooks, syncCustomerToQuickBooks } from '@/lib/integrations/quickbooks';

/**
 * Sync invoice to QuickBooks when approved
 * Triggered by: invoice/approved event
 */
export const syncInvoiceOnApproval = inngest.createFunction(
  {
    id: 'sync-invoice-on-approval',
    name: 'Sync Invoice to QuickBooks',
    retries: 3,
    onFailure: async ({ error, event, logger }) => {
      const invoiceId = (event.data as any).invoiceId;
      logger.error(`Failed to sync invoice ${invoiceId}: ${error.message}`);
      
      // Mark invoice sync as failed
      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            qbSyncStatus: 'FAILED',
            qbSyncError: error.message,
          },
        });
      }
    },
  },
  { event: 'invoice/approved' },
  async ({ event, step, logger }) => {
    const { invoiceId, companyId } = event.data;

    logger.info(`Syncing invoice ${invoiceId} to QuickBooks`);

    // Step 1: Get invoice with customer
    const invoice = await step.run('fetch-invoice', async () => {
      return prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          load: {
            include: {
              customer: true,
            },
          },
        },
      });
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Step 2: Check if customer exists in QB, if not sync
    const customer = invoice.load?.customer;
    if (customer && !customer.qbCustomerId) {
      await step.run('sync-customer', async () => {
        logger.info(`Syncing customer ${customer.name} to QuickBooks first`);
        
        const qbCustomerId = await syncCustomerToQuickBooks(companyId, customer.id);
        
        if (qbCustomerId) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { qbCustomerId },
          });
        }
        
        return qbCustomerId;
      });
    }

    // Step 3: Sync invoice to QuickBooks
    const qbInvoiceId = await step.run('sync-invoice', async () => {
      return syncInvoiceToQuickBooks(companyId, invoiceId);
    });

    // Step 4: Update invoice with QB reference
    await step.run('update-invoice', async () => {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          qbInvoiceId,
          qbSyncStatus: 'SYNCED',
          qbSyncedAt: new Date(),
          qbSyncError: null,
        },
      });
    });

    logger.info(`Invoice ${invoiceId} synced to QuickBooks as ${qbInvoiceId}`);

    return { invoiceId, qbInvoiceId };
  }
);

/**
 * Manual QuickBooks invoice sync
 */
export const manualInvoiceSync = inngest.createFunction(
  {
    id: 'manual-invoice-sync',
    name: 'Manual Invoice Sync to QuickBooks',
    retries: 2,
  },
  { event: 'quickbooks/sync-invoice' },
  async ({ event, step, logger }) => {
    const { invoiceId, companyId } = event.data;

    logger.info(`Manual sync for invoice ${invoiceId}`);

    // Update status to syncing
    await step.run('set-syncing', async () => {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { qbSyncStatus: 'SYNCING' },
      });
    });

    // Sync to QuickBooks
    const qbInvoiceId = await step.run('sync-invoice', async () => {
      return syncInvoiceToQuickBooks(companyId, invoiceId);
    });

    // Update with result
    await step.run('update-result', async () => {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          qbInvoiceId,
          qbSyncStatus: 'SYNCED',
          qbSyncedAt: new Date(),
          qbSyncError: null,
        },
      });
    });

    return { invoiceId, qbInvoiceId };
  }
);

/**
 * Sync customer to QuickBooks
 */
export const syncCustomer = inngest.createFunction(
  {
    id: 'sync-customer-to-quickbooks',
    name: 'Sync Customer to QuickBooks',
    retries: 2,
  },
  { event: 'quickbooks/sync-customer' },
  async ({ event, step, logger }) => {
    const { customerId, companyId } = event.data;

    logger.info(`Syncing customer ${customerId} to QuickBooks`);

    const qbCustomerId = await step.run('sync-customer', async () => {
      return syncCustomerToQuickBooks(companyId, customerId);
    });

    await step.run('update-customer', async () => {
      await prisma.customer.update({
        where: { id: customerId },
        data: { qbCustomerId },
      });
    });

    return { customerId, qbCustomerId };
  }
);



