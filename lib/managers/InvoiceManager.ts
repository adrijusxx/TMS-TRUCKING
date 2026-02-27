import { prisma } from '@/lib/prisma';
import { UsageManager } from '@/lib/managers/UsageManager';
import { InvoiceValidationManager } from './invoice/InvoiceValidationManager';
import { InvoiceSnapshotService, LoadDataSnapshot } from './invoice/InvoiceSnapshotService';
import { InvoiceAuditService } from './invoice/InvoiceAuditService';

/**
 * InvoiceManager - Split from original file to comply with 500-line limit.
 * Coordinates invoice finalization, generation, and auditing.
 */
export class InvoiceManager {
  // Re-export nested service methods for backward compatibility
  isReadyToBill = InvoiceValidationManager.isReadyToBill;
  areLoadsReadyToBill = InvoiceValidationManager.areLoadsReadyToBill;
  validateLoadsForInvoicing = InvoiceValidationManager.validateLoadsForInvoicing;
  detectExpenseGaps = InvoiceValidationManager.detectExpenseGaps;
  createLoadDataSnapshots = InvoiceSnapshotService.createLoadDataSnapshots;
  checkDataConsistency = InvoiceSnapshotService.checkDataConsistency;
  checkInvoicingCompleteness = InvoiceAuditService.checkInvoicingCompleteness;
  checkSettlementParity = InvoiceAuditService.checkSettlementParity;

  /**
   * Finalize invoice with factoring logic
   */
  async finalizeInvoice(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { customer: { include: { factoringCompany: true } } },
      });

      if (!invoice) return { success: false, error: 'Invoice not found' };

      const isFactored = invoice.customer.factoringCompanyId !== null;
      if (isFactored && invoice.customer.factoringCompany) {
        const fc = invoice.customer.factoringCompany;
        const metadata = (fc as any).metadata || {};
        const remitToAddress = {
          name: fc.name,
          address: metadata.address || fc.contactName || fc.name,
          city: metadata.city || '', state: metadata.state || '', zip: metadata.zip || '',
          phone: fc.contactPhone || undefined, email: fc.contactEmail || undefined,
        };

        return {
          success: true, remitToAddress,
          noticeOfAssignment: `NOTICE OF ASSIGNMENT\n\nThis invoice assigned to ${fc.name}. Remit to: ${remitToAddress.address}...`
        };
      }

      const company = await prisma.company.findUnique({ where: { id: invoice.customer.companyId } });
      if (!company) return { success: false, error: 'Company not found' };

      return {
        success: true,
        remitToAddress: { name: company.name, address: company.address || '', city: company.city || '', state: company.state || '', zip: company.zip || '' }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate an invoice for a single load (strict 1:1 relationship).
   * Accepts an array for backward compatibility but creates one invoice per load.
   */
  async generateInvoice(loadIds: string[], options?: any) {
    try {
      const loads = await prisma.load.findMany({
        where: { id: { in: loadIds } },
        include: { customer: true, dispatcher: true, driver: { include: { user: true } }, truck: true, mcNumber: true },
      });

      if (loads.length === 0) return { success: false, error: 'No loads found' };

      // Create one invoice per load (strict 1:1)
      const invoices = [];
      for (const load of loads) {
        const subtotal = load.revenue || 0;
        const tax = (load.customer as any).isTaxExempt ? 0 : (subtotal * ((load.customer as any).taxRate || 0) / 100);
        const total = subtotal + tax;

        const invoiceNumber: string = loads.length > 1 && options?.invoiceNumber
          ? `${options.invoiceNumber}-${invoices.length + 1}`
          : (options?.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`);

        const invoice = await prisma.invoice.create({
          data: {
            companyId: load.companyId, customerId: load.customerId,
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: options?.dueDate || new Date(Date.now() + ((load.customer as any).paymentTerms || 30) * 86400000),
            subtotal, tax, total, balance: total, status: 'DRAFT',
            loadIds: [load.id], loadId: load.id,
            mcNumber: load.mcNumber?.number, mcNumberId: load.mcNumberId,
          },
        });

        await prisma.load.update({ where: { id: load.id }, data: { status: 'INVOICED', readyForSettlement: true } });
        await UsageManager.trackUsage(load.companyId, 'INVOICES_GENERATED');
        invoices.push(invoice);
      }

      // Return first invoice for backward compatibility (single load case)
      return { success: true, invoice: invoices[0], invoices };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
