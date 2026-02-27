/**
 * Automated Invoice Generation
 *
 * Generates invoices for delivered loads that are ready for invoicing.
 * Respects billing holds, customer tax rates, payment terms, POD requirements,
 * and factoring configuration.
 */

import { prisma } from '../prisma';
import { InvoiceStatus, LoadStatus } from '@prisma/client';
import { createActivityLog } from '../activity-log';
import { logger } from '../utils/logger';
import { ConsolidatedBillingManager } from '../managers/ConsolidatedBillingManager';

interface AutoInvoiceResult {
  success: boolean;
  invoicesGenerated: number;
  loadsProcessed: number;
  loadsSkipped: number;
  errors: string[];
}

/**
 * Generate invoices for delivered loads that are ready for invoicing.
 */
export async function autoGenerateInvoices(companyId: string): Promise<AutoInvoiceResult> {
  const result: AutoInvoiceResult = {
    success: true,
    invoicesGenerated: 0,
    loadsProcessed: 0,
    loadsSkipped: 0,
    errors: [],
  };

  try {
    // Load accounting settings for POD/BOL requirements
    const settings = await prisma.accountingSettings.findUnique({
      where: { companyId },
    });
    const requirePod = settings?.requirePodUploaded ?? false;

    // Find delivered loads ready for invoicing
    const loads = await prisma.load.findMany({
      where: {
        companyId,
        status: LoadStatus.DELIVERED,
        invoicedAt: null,
        isBillingHold: false,
        deletedAt: null,
        revenue: { gt: 0 },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            taxRate: true,
            isTaxExempt: true,
            paymentTerms: true,
            factoringCompanyId: true,
            billingCycle: true,
            consolidatedBilling: true,
            billingCycleDay: true,
          },
        },
        documents: {
          where: { deletedAt: null },
          select: { type: true },
        },
      },
    });

    // Filter loads that pass validation
    const eligibleLoads = loads.filter((load) => {
      // Skip loads without a customer
      if (!load.customerId || !load.customer) {
        result.loadsSkipped++;
        return false;
      }

      // Skip loads missing POD if required
      if (requirePod) {
        const hasPod = load.documents.some((d: { type: string }) => d.type === 'POD');
        if (!hasPod) {
          result.loadsSkipped++;
          return false;
        }
      }

      // Skip consolidated billing customers (they get invoiced on their billing cycle)
      if (ConsolidatedBillingManager.shouldDeferInvoicing(load.customer)) {
        result.loadsSkipped++;
        return false;
      }

      return true;
    });

    // One invoice per load (strict 1:1 relationship)
    for (const load of eligibleLoads) {
      try {
        const customer = load.customer!;
        const customerId = load.customerId;

        // Calculate financials for this single load
        const subtotal = load.revenue || 0;
        const taxRate = customer.isTaxExempt ? 0 : (customer.taxRate ?? 0);
        const tax = Number((subtotal * (taxRate / 100)).toFixed(2));
        const total = Number((subtotal + tax).toFixed(2));

        // Due date from customer's payment terms (default 30 days)
        const paymentTermsDays = customer.paymentTerms ?? 30;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + paymentTermsDays);

        // Generate unique invoice number
        const invoiceCount = await prisma.invoice.count({ where: { companyId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

        // Prepare factoring data if customer has a factoring company
        const factoringData: Record<string, unknown> = {};
        if (customer.factoringCompanyId) {
          const fc = await prisma.factoringCompany.findUnique({
            where: { id: customer.factoringCompanyId },
            select: { reservePercentage: true },
          });
          if (fc) {
            factoringData.factoringCompanyId = customer.factoringCompanyId;
            factoringData.factoringStatus = 'NOT_FACTORED';
            factoringData.reserveAmount = Number((total * ((fc.reservePercentage ?? 10) / 100)).toFixed(2));
            factoringData.advanceAmount = Number((total - (factoringData.reserveAmount as number)).toFixed(2));
          }
        }

        // Create invoice (one per load)
        const invoice = await prisma.invoice.create({
          data: {
            companyId,
            customerId,
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate,
            subtotal,
            tax,
            total,
            balance: total,
            status: InvoiceStatus.DRAFT,
            loadIds: [load.id],
            loadId: load.id,
            ...factoringData,
          },
        });

        // Mark load as invoiced and ready for settlement
        const now = new Date();
        await prisma.load.updateMany({
          where: { id: { in: [load.id] } },
          data: {
            status: LoadStatus.INVOICED,
            invoicedAt: now,
            readyForSettlement: true,
          },
        });

        // Apply financial lock (if not already locked)
        await prisma.load.updateMany({
          where: {
            id: load.id,
            financialLockedAt: null,
          },
          data: {
            financialLockedAt: now,
            financialLockReason: 'AUTO_INVOICED',
          },
        });

        result.invoicesGenerated++;
        result.loadsProcessed++;

        await createActivityLog({
          companyId,
          action: 'INVOICE_GENERATED',
          entityType: 'Invoice',
          entityId: invoice.id,
          description: `Auto-invoice ${invoiceNumber} for ${customer.name} (load ${load.loadNumber}, $${total.toFixed(2)})`,
          metadata: {
            invoiceNumber,
            customerId,
            loadId: load.id,
            loadNumber: load.loadNumber,
            subtotal,
            tax,
            total,
            taxRate,
          },
        });
      } catch (error) {
        const msg = `Invoice generation failed for load ${load.loadNumber}: ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(msg);
        logger.error(msg);
      }
    }

    return result;
  } catch (error) {
    logger.error('autoGenerateInvoices failed', { companyId, error });
    return {
      ...result,
      success: false,
      errors: [...result.errors, error instanceof Error ? error.message : String(error)],
    };
  }
}
